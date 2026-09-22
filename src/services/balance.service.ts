import { prisma } from "../prisma";
import { toNumber } from "../utils/formatters";

export interface PeriodBalance {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface BalanceSummary {
  today: PeriodBalance;
  week: PeriodBalance;
  month: PeriodBalance;
  overall: PeriodBalance;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(): Date {
  const d = startOfToday();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as first day
  d.setDate(d.getDate() - diff);
  return d;
}

export function startOfMonth(): Date {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

async function computePeriod(familyId: string, from?: Date): Promise<PeriodBalance> {
  const where = from ? { familyId, date: { gte: from } } : { familyId };

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...where, type: "INCOME" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { ...where, type: "EXPENSE" }, _sum: { amount: true } }),
  ]);

  const totalIncome = toNumber(incomeAgg._sum.amount ?? 0);
  const totalExpenses = toNumber(expenseAgg._sum.amount ?? 0);
  return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses };
}

export const BalanceService = {
  async getSummary(familyId: string): Promise<BalanceSummary> {
    const [today, week, month, overall] = await Promise.all([
      computePeriod(familyId, startOfToday()),
      computePeriod(familyId, startOfWeek()),
      computePeriod(familyId, startOfMonth()),
      computePeriod(familyId),
    ]);
    return { today, week, month, overall };
  },
};
