import { prisma } from "../prisma";
import { toNumber } from "../utils/formatters";
import type { Budget } from "@prisma/client";

export type BudgetStatus = "SAFE" | "WARNING" | "EXCEEDED";

export interface BudgetWithUsage {
  budget: Budget;
  categoryName: string;
  categoryIcon: string;
  spent: number;
  percent: number;
  status: BudgetStatus;
}

export function computeStatus(percent: number): BudgetStatus {
  if (percent > 90) return "EXCEEDED";
  if (percent >= 70) return "WARNING";
  return "SAFE";
}

async function spentForCategoryMonth(familyId: string, categoryId: string, month: string): Promise<number> {
  const [year, monthNum] = month.split("-").map(Number);
  const from = new Date(year ?? 1970, (monthNum ?? 1) - 1, 1, 0, 0, 0, 0);
  const to = new Date(year ?? 1970, monthNum ?? 1, 0, 23, 59, 59, 999);

  const agg = await prisma.transaction.aggregate({
    where: { familyId, categoryId, type: "EXPENSE", date: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  return toNumber(agg._sum.amount ?? 0);
}

export const BudgetService = {
  async create(familyId: string, categoryId: string, amount: number, month: string): Promise<Budget> {
    return prisma.budget.upsert({
      where: { familyId_categoryId_month: { familyId, categoryId, month } },
      update: { amount },
      create: { familyId, categoryId, amount, month },
    });
  },

  async listForMonth(familyId: string, month: string): Promise<BudgetWithUsage[]> {
    const budgets = await prisma.budget.findMany({
      where: { familyId, month },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    const results: BudgetWithUsage[] = [];
    for (const budget of budgets) {
      const spent = await spentForCategoryMonth(familyId, budget.categoryId, month);
      const amount = toNumber(budget.amount);
      const percent = amount > 0 ? (spent / amount) * 100 : 0;
      results.push({
        budget,
        categoryName: budget.category.name,
        categoryIcon: budget.category.icon,
        spent,
        percent,
        status: computeStatus(percent),
      });
    }
    return results;
  },

  async checkAfterTransaction(
    familyId: string,
    categoryId: string,
    month: string,
  ): Promise<{ categoryName: string; percent: number; status: BudgetStatus } | null> {
    const budget = await prisma.budget.findUnique({
      where: { familyId_categoryId_month: { familyId, categoryId, month } },
      include: { category: true },
    });
    if (!budget) return null;

    const spent = await spentForCategoryMonth(familyId, categoryId, month);
    const amount = toNumber(budget.amount);
    const percent = amount > 0 ? (spent / amount) * 100 : 0;

    if (percent < 80) return null;
    return { categoryName: budget.category.name, percent, status: computeStatus(percent) };
  },
};
