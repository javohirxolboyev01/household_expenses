import type { MyContext } from "../../bot-context";
import { uz } from "../../i18n/uz";
import { TransactionService } from "../../services/transaction.service";
import { BudgetService } from "../../services/budget.service";
import { currentMonthKey } from "../../utils/formatters";
import { NlpPendingStore } from "../nlp-pending.store";
import { notifyFamily } from "../../utils/notify";

export async function nlpConfirmCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery();
  if (!ctx.chat || !ctx.auth) return;

  const pending = NlpPendingStore.take(ctx.chat.id);
  if (!pending) return;

  const date = new Date();
  await TransactionService.create({
    familyId: ctx.auth.family.id,
    memberId: pending.memberId,
    categoryId: pending.categoryId,
    amount: pending.amount,
    type: pending.type,
    paymentMethod: "CASH",
    description: pending.description,
    date,
  });

  const savedText = pending.type === "INCOME" ? uz.transaction.incomeSaved : uz.transaction.expenseSaved;
  await ctx.reply(savedText);

  if (pending.type === "EXPENSE") {
    const alert = await BudgetService.checkAfterTransaction(
      ctx.auth.family.id,
      pending.categoryId,
      currentMonthKey(date),
    );
    if (alert) {
      const message =
        alert.percent >= 100
          ? uz.budget.exceededAlert(alert.categoryName)
          : uz.budget.alert(alert.categoryName, `${Math.round(alert.percent)}`);
      // Budget is shared family-wide, so every member should see the alert.
      await notifyFamily(ctx.api, ctx.auth.family.id, message);
    }
  }
}

export async function nlpCancelCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery();
  if (!ctx.chat) return;
  const pending = NlpPendingStore.take(ctx.chat.id);
  if (!pending) return;
  await ctx.reply(uz.common.cancelled);
}
