import { InlineKeyboard } from "grammy";
import type { MyContext, MyConversation } from "../bot-context";
import { uz } from "../i18n/uz";
import { FamilyService } from "../services/family.service";
import { DebtService } from "../services/debt.service";
import { formatMoney, formatDate } from "../utils/formatters";
import { cancelOnlyKeyboard, confirmCancelKeyboard, skipCancelKeyboard } from "../keyboards/common.keyboard";
import { mainMenuKeyboard } from "../keyboards/main.keyboard";
import { backKeyboard } from "../keyboards/back.keyboard";
import { CANCELLED, SKIPPED, waitForAmount, waitForCallbackChoice, waitForConfirm, waitForOptionalDate, waitForOptionalText } from "./helpers";
import type { DebtType } from "@prisma/client";

const debtTypeKeyboard = new InlineKeyboard()
  .text(uz.debt.typeIOwe, "debttype:I_OWE")
  .text(uz.debt.typeTheyOwe, "debttype:THEY_OWE")
  .row()
  .text(uz.common.cancel, "cancel");

const DEBT_TYPE_LABEL: Record<DebtType, string> = {
  I_OWE: uz.debt.typeIOwe,
  THEY_OWE: uz.debt.typeTheyOwe,
};

export async function debtConversation(conversation: MyConversation, ctx: MyContext): Promise<void> {
  const auth = await conversation.external(() =>
    ctx.from ? FamilyService.getAuthContext(BigInt(ctx.from.id)) : null,
  );
  if (!auth) {
    await ctx.reply(uz.common.notInFamily);
    return;
  }

  await ctx.reply(uz.common.backHint, { reply_markup: backKeyboard });
  await ctx.reply(uz.debt.askType, { reply_markup: debtTypeKeyboard });
  const typeChoice = await waitForCallbackChoice(conversation, "debttype");
  if (typeChoice === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }
  const type = typeChoice as DebtType;

  await ctx.reply(uz.debt.askParty, { reply_markup: cancelOnlyKeyboard });
  const partyResult = await waitForOptionalText(conversation);
  if (partyResult === CANCELLED || partyResult === SKIPPED || partyResult.length === 0) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }
  const partyName = partyResult;

  await ctx.reply(uz.debt.askAmount, { reply_markup: cancelOnlyKeyboard });
  const amount = await waitForAmount(conversation, ctx);
  if (amount === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(uz.debt.askDueDate, { reply_markup: skipCancelKeyboard });
  const dueDateResult = await waitForOptionalDate(conversation);
  if (dueDateResult === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }
  const dueDate = dueDateResult === SKIPPED ? null : dueDateResult;

  await ctx.reply(uz.debt.askDescription, { reply_markup: skipCancelKeyboard });
  const descriptionResult = await waitForOptionalText(conversation);
  if (descriptionResult === CANCELLED) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }
  const description = descriptionResult === SKIPPED ? null : descriptionResult;

  const summaryLines = [
    uz.debt.title,
    `Turi: ${DEBT_TYPE_LABEL[type]}`,
    `Kim: ${partyName}`,
    `Summa: ${formatMoney(amount)}`,
    ...(dueDate ? [`Muddat: ${formatDate(dueDate)}`] : []),
    ...(description ? [`Izoh: ${description}`] : []),
  ];
  await ctx.reply(summaryLines.join("\n"), { reply_markup: confirmCancelKeyboard });
  const confirmed = await waitForConfirm(conversation);
  if (!confirmed) {
    await ctx.reply(uz.common.cancelled, { reply_markup: mainMenuKeyboard });
    return;
  }

  // The Prisma result carries a Decimal field, which structuredClone (used
  // internally by external() to persist the value for replay) can't
  // serialize — so the write is discarded rather than returned.
  await conversation.external(async () => {
    await DebtService.create({
      familyId: auth.family.id,
      memberId: auth.member.id,
      amount,
      type,
      partyName,
      dueDate,
      description,
    });
  });

  await ctx.reply(uz.debt.created, { reply_markup: mainMenuKeyboard });
}
