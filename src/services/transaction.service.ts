import { prisma } from "../prisma";
import type { CategoryType, PaymentMethod, Transaction } from "@prisma/client";

export interface CreateTransactionInput {
  familyId: string;
  memberId: string;
  categoryId: string;
  amount: number;
  type: CategoryType;
  paymentMethod: PaymentMethod;
  description?: string | null;
  date: Date;
}

export interface TransactionFilters {
  familyId: string;
  memberId?: string;
  categoryId?: string;
  type?: CategoryType;
  from?: Date;
  to?: Date;
  description?: string;
}

export type TransactionWithRelations = Transaction & {
  category: { name: string; icon: string };
  member: { displayName: string };
};

const PAGE_SIZE = 5;

export const TransactionService = {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    return prisma.transaction.create({
      data: {
        familyId: input.familyId,
        memberId: input.memberId,
        categoryId: input.categoryId,
        amount: input.amount,
        type: input.type,
        paymentMethod: input.paymentMethod,
        description: input.description ?? null,
        date: input.date,
      },
    });
  },

  async search(
    filters: TransactionFilters,
    page = 0,
    pageSize = PAGE_SIZE,
  ): Promise<{ items: TransactionWithRelations[]; hasNext: boolean; total: number }> {
    const where = {
      familyId: filters.familyId,
      memberId: filters.memberId,
      categoryId: filters.categoryId,
      type: filters.type,
      date:
        filters.from || filters.to
          ? { gte: filters.from, lte: filters.to }
          : undefined,
      description: filters.description
        ? { contains: filters.description, mode: "insensitive" as const }
        : undefined,
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: { select: { name: true, icon: true } }, member: { select: { displayName: true } } },
        orderBy: { date: "desc" },
        skip: page * pageSize,
        take: pageSize + 1,
      }),
      prisma.transaction.count({ where }),
    ]);

    const hasNext = items.length > pageSize;
    return { items: items.slice(0, pageSize), hasNext, total };
  },

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({ where: { id } });
  },

  async delete(id: string): Promise<void> {
    await prisma.transaction.delete({ where: { id } });
  },
};
