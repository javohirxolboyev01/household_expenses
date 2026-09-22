import { InlineKeyboard } from "grammy";
import type { MyContext } from "../../bot-context";
import { uz } from "../../i18n/uz";
import { mainMenuKeyboard } from "../../keyboards/main.keyboard";

const onboardingKeyboard = new InlineKeyboard()
  .text(uz.start.createFamilyBtn, "onboard:create")
  .row()
  .text(uz.start.joinFamilyBtn, "onboard:join");

export async function startHandler(ctx: MyContext): Promise<void> {
  if (!ctx.from) return;

  if (ctx.auth) {
    await ctx.reply(uz.start.welcomeBack(ctx.auth.member.displayName), { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(uz.start.welcomeNew, { reply_markup: onboardingKeyboard });
}
