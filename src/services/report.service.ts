import { prisma } from "../prisma";
import { toNumber } from "../utils/formatters";
import type { CategoryType } from "@prisma/client";

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  amount: number;
  percent: number;
}

export interface MemberBreakdownItem {
  memberId: string;
  displayName: string;
  amount: number;
  percent: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export const ReportService = {
  async byCategory(
    familyId: string,
    range: DateRange,
    type: CategoryType = "EXPENSE",
  ): Promise<CategoryBreakdownItem[]> {
    const grouped = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { familyId, type, date: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
    });

    if (grouped.length === 0) return [];

    const categories = await prisma.category.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const total = grouped.reduce((sum, g) => sum + toNumber(g._sum.amount ?? 0), 0);

    return grouped
      .map((g) => {
        const category = categoryMap.get(g.categoryId);
        const amount = toNumber(g._sum.amount ?? 0);
        return {
          categoryId: g.categoryId,
          name: category?.name ?? "Noma'lum",
          icon: category?.icon ?? "🌀",
          amount,
          percent: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  },

  async byMember(
    familyId: string,
    range: DateRange,
    type: CategoryType = "EXPENSE",
  ): Promise<MemberBreakdownItem[]> {
    const grouped = await prisma.transaction.groupBy({
      by: ["memberId"],
      where: { familyId, type, date: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
    });

    if (grouped.length === 0) return [];

    const members = await prisma.familyMember.findMany({
      where: { id: { in: grouped.map((g) => g.memberId) } },
    });
    const memberMap = new Map(members.map((m) => [m.id, m]));

    const total = grouped.reduce((sum, g) => sum + toNumber(g._sum.amount ?? 0), 0);

    return grouped
      .map((g) => {
        const member = memberMap.get(g.memberId);
        const amount = toNumber(g._sum.amount ?? 0);
        return {
          memberId: g.memberId,
          displayName: member?.displayName ?? "Noma'lum",
          amount,
          percent: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  },
};
