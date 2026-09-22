import { prisma } from "../prisma";
import type { Debt, DebtType } from "@prisma/client";

export interface CreateDebtInput {
  familyId: string;
  memberId: string;
  amount: number;
  type: DebtType;
  partyName: string;
  dueDate?: Date | null;
  description?: string | null;
}

export const DebtService = {
  async create(input: CreateDebtInput): Promise<Debt> {
    return prisma.debt.create({
      data: {
        familyId: input.familyId,
        memberId: input.memberId,
        amount: input.amount,
        type: input.type,
        partyName: input.partyName,
        dueDate: input.dueDate ?? null,
        description: input.description ?? null,
      },
    });
  },

  async listActive(familyId: string): Promise<Debt[]> {
    await prisma.debt.updateMany({
      where: { familyId, status: "PENDING", dueDate: { lt: new Date() } },
      data: { status: "OVERDUE" },
    });

    return prisma.debt.findMany({
      where: { familyId, status: { in: ["PENDING", "OVERDUE"] } },
      orderBy: [{ status: "desc" }, { dueDate: "asc" }],
    });
  },

  async markPaid(debtId: string, familyId: string): Promise<Debt> {
    const existing = await prisma.debt.findUnique({ where: { id: debtId } });
    if (!existing || existing.familyId !== familyId) {
      throw new Error("FORBIDDEN");
    }
    return prisma.debt.update({ where: { id: debtId }, data: { status: "PAID" } });
  },

  async findById(debtId: string): Promise<Debt | null> {
    return prisma.debt.findUnique({ where: { id: debtId } });
  },
};
