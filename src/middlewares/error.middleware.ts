import { GrammyError, HttpError } from "grammy";
import type { BotError } from "grammy";
import type { MyContext } from "../bot-context";
import { uz } from "../i18n/uz";

export async function errorHandler(err: BotError<MyContext>): Promise<void> {
  const ctx = err.ctx;
  const error = err.error;

  if (error instanceof GrammyError) {
    console.error(`❌ Telegram API xatosi (update ${ctx.update.update_id}):`, error.description);
  } else if (error instanceof HttpError) {
    console.error(`❌ Tarmoq xatosi (update ${ctx.update.update_id}):`, error);
  } else {
    console.error(`❌ Kutilmagan xatolik (update ${ctx.update.update_id}):`, error);
  }

  try {
    await ctx.reply(uz.common.unknownError);
  } catch {
    // Reply attempt failed too (e.g. chat unreachable) — nothing more we can do.
  }
}
