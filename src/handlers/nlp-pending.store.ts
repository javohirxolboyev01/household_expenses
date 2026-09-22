import type { CategoryType } from "@prisma/client";

export interface PendingParsedTransaction {
  amount: number;
  type: CategoryType;
  categoryId: string;
  categoryLabel: string;
  memberId: string;
  description: string;
}

/**
 * Transient in-memory store for a natural-language parse awaiting user
 * confirmation. Keyed by chat id; cleared on confirm/cancel or overwritten
 * by a newer parse. Not persisted across restarts — acceptable since it
 * only bridges one message to the immediately following confirm tap.
 */
const pending = new Map<number, PendingParsedTransaction>();

export const NlpPendingStore = {
  set(chatId: number, value: PendingParsedTransaction): void {
    pending.set(chatId, value);
  },
  take(chatId: number): PendingParsedTransaction | undefined {
    const value = pending.get(chatId);
    pending.delete(chatId);
    return value;
  },
};
