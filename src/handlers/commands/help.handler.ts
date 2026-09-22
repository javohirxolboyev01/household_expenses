import type { MyContext } from "../../bot-context";
import { uz } from "../../i18n/uz";
import { backKeyboard } from "../../keyboards/back.keyboard";

export async function helpHandler(ctx: MyContext): Promise<void> {
  await ctx.reply(uz.help.guide, { parse_mode: "HTML", reply_markup: backKeyboard });
}
