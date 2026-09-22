import type { Api } from "grammy";
import type { DebtType } from "@prisma/client";
import { prisma } from "../prisma";
import { uz } from "../i18n/uz";
import { formatDate, formatMoney } from "../utils/formatters";
import { notifyFamily } from "../utils/notify";

const TYPE_LABEL: Record<DebtType, string> = {
  I_OWE: uz.debt.typeIOwe,
  THEY_OWE: uz.debt.typeTheyOwe,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const DebtReminderService = {
  /** How often the scheduler should call {@link checkAndSendReminders}. */
  checkIntervalMs: 60 * 60 * 1000, // 1 hour — fine-grained enough for "due within 24h" reminders

  /**
   * Sends a one-time "due soon" reminder for debts due within the next 24h,
   * and a one-time "overdue" notice for debts whose due date has passed.
   * Each debt is only ever notified once per case, tracked via
   * `reminderSentAt` / `overdueNotifiedAt`, so repeated calls are safe.
   */
  async checkAndSendReminders(api: Api): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + DAY_MS);

    const approaching = await prisma.debt.findMany({
      where: {
        status: { not: "PAID" },
        dueDate: { gte: now, lte: in24h },
        reminderSentAt: null,
      },
    });

    for (const debt of approaching) {
      if (!debt.dueDate) continue;
      const message = uz.debt.reminderApproaching(
        TYPE_LABEL[debt.type],
        debt.partyName,
        formatMoney(debt.amount),
        formatDate(debt.dueDate),
      );
      await notifyFamily(api, debt.familyId, message);
      await prisma.debt.update({ where: { id: debt.id }, data: { reminderSentAt: now } });
    }

    const overdue = await prisma.debt.findMany({
      where: {
        status: { not: "PAID" },
        dueDate: { lt: now },
        overdueNotifiedAt: null,
      },
    });

    for (const debt of overdue) {
      const message = uz.debt.reminderOverdue(TYPE_LABEL[debt.type], debt.partyName, formatMoney(debt.amount));
      await notifyFamily(api, debt.familyId, message);
      await prisma.debt.update({
        where: { id: debt.id },
        data: { overdueNotifiedAt: now, status: "OVERDUE" },
      });
    }
  },
};
