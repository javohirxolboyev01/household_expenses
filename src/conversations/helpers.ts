import type { MyContext, MyConversation } from "../bot-context";
import { parseAmount, extractAmount, parseUzbekDate } from "../utils/validators";
import { uz } from "../i18n/uz";

export const CANCELLED = Symbol("CANCELLED");
export const SKIPPED = Symbol("SKIPPED");

function isBackText(text: string): boolean {
  return text.trim() === uz.common.back;
}

/** Waits for a text message containing a valid money amount, a "cancel"
 * callback, or the persistent "⬅️ Orqaga" reply-keyboard button. */
export async function waitForAmount(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<number | typeof CANCELLED> {
  for (;;) {
    const next = await conversation.waitFor(["message:text", "callback_query:data"]);
    if (next.callbackQuery?.data === "cancel") {
      await next.answerCallbackQuery();
      return CANCELLED;
    }
    if (next.message?.text) {
      if (isBackText(next.message.text)) return CANCELLED;
      // Accept either a bare amount ("350000", "6.000.000") or a full
      // sentence with the amount embedded ("Men bugun 350000 sarfladim").
      const amount = parseAmount(next.message.text) ?? extractAmount(next.message.text);
      if (amount === null) {
        await next.reply(uz.common.invalidAmount);
        continue;
      }
      return amount;
    }
  }
}

/** Waits for a callback_query whose data starts with `prefix:`, cancel, or
 * any stray text (including "⬅️ Orqaga") — no text is ever valid input at a
 * button-only step, so it's treated as backing out. */
export async function waitForCallbackChoice(
  conversation: MyConversation,
  prefix: string,
): Promise<string | typeof CANCELLED> {
  for (;;) {
    const next = await conversation.waitFor(["callback_query:data", "message:text"]);
    if (next.message?.text || !next.callbackQuery) {
      return CANCELLED;
    }
    const data = next.callbackQuery.data;
    if (data === "cancel") {
      await next.answerCallbackQuery();
      return CANCELLED;
    }
    if (data.startsWith(`${prefix}:`)) {
      await next.answerCallbackQuery();
      return data.slice(prefix.length + 1);
    }
    await next.answerCallbackQuery();
  }
}

/** Waits for free-text description, a "skip" callback, a "cancel" callback,
 * or the "⬅️ Orqaga" reply-keyboard button. */
export async function waitForOptionalText(
  conversation: MyConversation,
): Promise<string | typeof SKIPPED | typeof CANCELLED> {
  const next = await conversation.waitFor(["message:text", "callback_query:data"]);
  if (next.callbackQuery?.data === "cancel") {
    await next.answerCallbackQuery();
    return CANCELLED;
  }
  if (next.callbackQuery?.data === "skip") {
    await next.answerCallbackQuery();
    return SKIPPED;
  }
  if (next.message?.text) {
    if (isBackText(next.message.text)) return CANCELLED;
    return next.message.text.trim();
  }
  return SKIPPED;
}

/** Waits for a "date:today" callback, a custom DD.MM.YYYY text date, cancel,
 * or the "⬅️ Orqaga" reply-keyboard button. */
export async function waitForDate(
  conversation: MyConversation,
): Promise<Date | typeof CANCELLED> {
  for (;;) {
    const next = await conversation.waitFor(["message:text", "callback_query:data"]);
    if (next.callbackQuery?.data === "cancel") {
      await next.answerCallbackQuery();
      return CANCELLED;
    }
    if (next.callbackQuery?.data === "date:today") {
      await next.answerCallbackQuery();
      return new Date(await conversation.now());
    }
    if (next.message?.text) {
      if (isBackText(next.message.text)) return CANCELLED;
      const date = parseUzbekDate(next.message.text);
      if (!date) {
        await next.reply("⚠️ Sana formati: KK.OO.YYYY (masalan: 15.03.2026)");
        continue;
      }
      return date;
    }
  }
}

/** Waits for a custom DD.MM.YYYY text date, a "skip" callback, a "cancel"
 * callback, or the "⬅️ Orqaga" reply-keyboard button. An invalid date is
 * re-prompted rather than silently discarded. */
export async function waitForOptionalDate(
  conversation: MyConversation,
): Promise<Date | typeof SKIPPED | typeof CANCELLED> {
  for (;;) {
    const next = await conversation.waitFor(["message:text", "callback_query:data"]);
    if (next.callbackQuery?.data === "cancel") {
      await next.answerCallbackQuery();
      return CANCELLED;
    }
    if (next.callbackQuery?.data === "skip") {
      await next.answerCallbackQuery();
      return SKIPPED;
    }
    if (next.message?.text) {
      if (isBackText(next.message.text)) return CANCELLED;
      const date = parseUzbekDate(next.message.text);
      if (!date) {
        await next.reply("⚠️ Sana formati: KK.OO.YYYY (masalan: 15.03.2026) yoki o'tkazib yuboring.");
        continue;
      }
      return date;
    }
  }
}

/** Waits for confirm/cancel callback, or any stray text (incl. "⬅️ Orqaga"),
 * which is treated as cancelling. Returns true only if explicitly confirmed. */
export async function waitForConfirm(conversation: MyConversation): Promise<boolean> {
  const next = await conversation.waitFor(["callback_query:data", "message:text"]);
  if (next.message?.text || !next.callbackQuery) return false;
  await next.answerCallbackQuery();
  return next.callbackQuery.data === "confirm";
}
