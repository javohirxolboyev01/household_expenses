import type { MyContext } from "../bot-context";
import { uz } from "../i18n/uz";
import { ParserService } from "../services/parser.service";
import { FamilyService } from "../services/family.service";
import { formatMoney } from "../utils/formatters";
import { confirmCancelKeyboard } from "../keyboards/common.keyboard";
import { NlpPendingStore } from "./nlp-pending.store";

export async function textHandler(ctx: MyContext): Promise<void> {
  if (!ctx.message?.text || !ctx.chat) return;

  if (!ctx.auth) {
    await ctx.reply(uz.common.notInFamily);
    return;
  }

  const parsed = ParserService.parse(ctx.message.text);
  if (!parsed) {
    await ctx.reply(uz.parser.notRecognized);
    return;
  }

  const categories = await FamilyService.getCategories(ctx.auth.family.id, parsed.type);
  const match =
    categories.find((c) => c.name.toLowerCase() === parsed.categoryGuess.toLowerCase()) ??
    categories.find((c) => c.name === "Boshqa") ??
    categories[0];

  if (!match) {
    await ctx.reply(uz.transaction.noCategories);
    return;
  }

  NlpPendingStore.set(ctx.chat.id, {
    amount: parsed.amount,
    type: parsed.type,
    categoryId: match.id,
    categoryLabel: `${match.icon} ${match.name}`,
    memberId: ctx.auth.member.id,
    description: parsed.description,
  });

  const summary = [
    uz.parser.detected,
    "",
    uz.transaction.summaryType(uz.categoryType[parsed.type]),
    uz.transaction.summaryAmount(formatMoney(parsed.amount)),
    uz.transaction.summaryCategory(`${match.icon} ${match.name}`),
    uz.transaction.summaryDescription(parsed.description),
    "",
    uz.parser.confirmQuestion,
  ].join("\n");

  await ctx.reply(summary, { reply_markup: confirmCancelKeyboard });
}
