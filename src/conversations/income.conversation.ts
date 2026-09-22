import type { MyContext, MyConversation } from "../bot-context";
import { uz } from "../i18n/uz";
import { FamilyService } from "../services/family.service";
import { TransactionService } from "../services/transaction.service";
import { formatMoney, formatDate } from "../utils/formatters";
import { categoryKeyboard } from "../keyboards/category.keyboard";
import { memberKeyboard } from "../keyboards/member.keyboard";
import { cancelOnlyKeyboard, confirmCancelKeyboard, dateChoiceKeyboard, paymentMethodKeyboard, skipCancelKeyboard } from "../keyboards/common.keyboard";
import { mainMenuKeyboard } from "../keyboards/main.keyboard";
import { backKeyboard } from "../keyboards/back.keyboard";
import { CANCELLED, SKIPPED, waitForAmount, waitForCallbackChoice, waitForConfirm, waitForDate, waitForOptionalText } from "./helpers";
import type { PaymentMethod } from "@prisma/client";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: uz.transaction.paymentCash,
  CARD: uz.transaction.paymentCard,
  BANK_TRANSFER: uz.transaction.paymentTransfer,
  OTHER: uz.transaction.paymentOther,
};

export async function incomeConversation(conversation: MyConversation, ctx: MyContext): Promise<void> {
  const auth = await conversation.external(() =>
    ctx.from ? FamilyService.getAuthContext(BigInt(ctx.from.id)) : null,
  );
  if (!auth) {
    await ctx.reply(uz.common.notInFamily);
    return;
  }

  const categories = await conversation.external(() => FamilyService.getCategories(auth.family.id, "INCOME"));
  if (categories.length === 0) {
    await ctx.reply(uz.transaction.noCategories);
    return;
  }

  const members = await conversation.external(() => FamilyService.getFamilyMembers(auth.family.id));
  if (members.length === 0) {
    await ctx.reply(uz.transaction.noMembers);
    return;
  }

  await ctx.reply(uz.common.backHint, { reply_markup: backKeyboard });
  await ctx.reply(uz.transaction.askAmount, { reply_markup: cancelOnlyKeyboard });
  const amount = await waitForAmount(conversation, ctx);
  if (amount === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(uz.transaction.askCategory, { reply_markup: categoryKeyboard(categories) });
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

  await ctx.reply(uz.transaction.askMember, { reply_markup: memberKeyboard(members) });
  const memberId = await waitForCallbackChoice(conversation, "mem");
  if (memberId === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }
  const member = members.find((m) => m.id === memberId);
  if (!member) {
    await ctx.reply(uz.common.unknownError, { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(uz.transaction.askPaymentMethod, { reply_markup: paymentMethodKeyboard });
  const paymentChoice = await waitForCallbackChoice(conversation, "pay");
  if (paymentChoice === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }
  const paymentMethod = paymentChoice as PaymentMethod;

  await ctx.reply(uz.transaction.askDescription, { reply_markup: skipCancelKeyboard });
  const descriptionResult = await waitForOptionalText(conversation);
  if (descriptionResult === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }
  const description = descriptionResult === SKIPPED ? null : descriptionResult;

  await ctx.reply(uz.transaction.askDate, { reply_markup: dateChoiceKeyboard });
  const date = await waitForDate(conversation);
  if (date === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }

  const summary = [
    uz.transaction.summaryTitle,
    uz.transaction.summaryType(uz.categoryType.INCOME),
    uz.transaction.summaryAmount(formatMoney(amount)),
    uz.transaction.summaryCategory(`${category.icon} ${category.name}`),
    uz.transaction.summaryMember(member.displayName),
    uz.transaction.summaryPayment(PAYMENT_LABELS[paymentMethod]),
    ...(description ? [uz.transaction.summaryDescription(description)] : []),
    uz.transaction.summaryDate(formatDate(date)),
  ].join("\n");

  await ctx.reply(summary, { reply_markup: confirmCancelKeyboard });
  const confirmed = await waitForConfirm(conversation);
  if (!confirmed) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }

  // The Prisma result carries a Decimal field, which structuredClone (used
  // internally by external() to persist the value for replay) can't
  // serialize — so the write is discarded rather than returned.
  await conversation.external(async () => {
    await TransactionService.create({
      familyId: auth.family.id,
      memberId: member.id,
      categoryId: category.id,
      amount,
      type: "INCOME",
      paymentMethod,
      description,
      date,
    });
  });

  await ctx.reply(uz.transaction.incomeSaved, { reply_markup: mainMenuKeyboard });
}
