import type { MyContext } from "../../bot-context";
import { uz } from "../../i18n/uz";
import { DebtService } from "../../services/debt.service";

export async function debtNewCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("debt");
}

export async function debtPaidCallback(ctx: MyContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data || !ctx.auth) {
    await ctx.answerCallbackQuery();
    return;
  }

  const debtId = data.slice("debt:paid:".length);

  try {
    await DebtService.markPaid(debtId, ctx.auth.family.id);
    await ctx.answerCallbackQuery({ text: uz.debt.markedPaid });
    await ctx.reply(uz.debt.markedPaid);
  } catch {
    await ctx.answerCallbackQuery({ text: uz.common.unknownError });
  }
}
