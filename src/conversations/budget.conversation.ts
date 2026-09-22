import type { MyContext, MyConversation } from "../bot-context";
import { uz } from "../i18n/uz";
import { FamilyService } from "../services/family.service";
import { BudgetService } from "../services/budget.service";
import { formatMoney, currentMonthKey, monthLabel } from "../utils/formatters";
import { categoryKeyboard } from "../keyboards/category.keyboard";
import { cancelOnlyKeyboard } from "../keyboards/common.keyboard";
import { mainMenuKeyboard } from "../keyboards/main.keyboard";
import { backKeyboard } from "../keyboards/back.keyboard";
import { CANCELLED, waitForAmount, waitForCallbackChoice } from "./helpers";

export async function budgetConversation(conversation: MyConversation, ctx: MyContext): Promise<void> {
  const auth = await conversation.external(() =>
    ctx.from ? FamilyService.getAuthContext(BigInt(ctx.from.id)) : null,
  );
  if (!auth) {
    await ctx.reply(uz.common.notInFamily);
    return;
  }

  const categories = await conversation.external(() => FamilyService.getCategories(auth.family.id, "EXPENSE"));
  if (categories.length === 0) {
    await ctx.reply(uz.transaction.noCategories);
    return;
  }

  await ctx.reply(uz.common.backHint, { reply_markup: backKeyboard });
  await ctx.reply(uz.budget.askCategory, { reply_markup: categoryKeyboard(categories) });
  const categoryId = await waitForCallbackChoice(conversation, "cat");
  if (categoryId === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }
  const category = categories.find((c) => c.id === categoryId);
  if (!category) {
    await ctx.reply(uz.common.unknownError, { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(uz.budget.askAmount, { reply_markup: cancelOnlyKeyboard });
  const amount = await waitForAmount(conversation, ctx);
  if (amount === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }

  const month = await conversation.external(() => currentMonthKey());

  // The Prisma result carries a Decimal field, which structuredClone (used
  // internally by external() to persist the value for replay) can't
  // serialize — so the write is discarded rather than returned.
  await conversation.external(async () => {
    await BudgetService.create(auth.family.id, category.id, amount, month);
  });

  await ctx.reply(
    `${uz.budget.created}\n\n${category.icon} ${category.name} — ${formatMoney(amount)} (${monthLabel(month)})`,
    { reply_markup: mainMenuKeyboard },
  );
}
