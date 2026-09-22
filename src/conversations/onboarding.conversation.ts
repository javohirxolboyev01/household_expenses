import type { MyContext, MyConversation } from "../bot-context";
import { uz } from "../i18n/uz";
import { FamilyService } from "../services/family.service";
import { mainMenuKeyboard } from "../keyboards/main.keyboard";
import { isValidJoinCode } from "../utils/validators";

function profileFromCtx(ctx: MyContext) {
  if (!ctx.from) throw new Error("Foydalanuvchi ma'lumotlari topilmadi");
  return {
    telegramId: BigInt(ctx.from.id),
    username: ctx.from.username ?? null,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name ?? null,
  };
}

export async function createFamilyConversation(conversation: MyConversation, ctx: MyContext): Promise<void> {
  await ctx.reply(uz.start.askFamilyName);

  let familyName = "";
  for (;;) {
    const { message } = await conversation.waitFor("message:text");
    familyName = message.text.trim().slice(0, 100);
    if (familyName.length > 0) break;
    await ctx.reply(uz.start.invalidFamilyName);
  }

  const profile = profileFromCtx(ctx);
  const auth = await conversation.external(() => FamilyService.createFamilyWithAdmin(profile, familyName));

  await ctx.reply(uz.start.familyCreated(auth.family.name, auth.family.joinCode), { parse_mode: "HTML" });
  await ctx.reply(uz.start.mainMenuIntro, { reply_markup: mainMenuKeyboard });
}

export async function joinFamilyConversation(conversation: MyConversation, ctx: MyContext): Promise<void> {
  await ctx.reply(uz.start.askJoinCode);

  for (;;) {
    const { message } = await conversation.waitFor("message:text");
    const code = message.text.trim();

    if (!isValidJoinCode(code)) {
      await ctx.reply(uz.start.invalidJoinCode);
      continue;
    }

    const profile = profileFromCtx(ctx);
    const result = await conversation.external(() => FamilyService.joinFamilyByCode(profile, code));

    if (!result.ok) {
      if (result.reason === "LIMIT_REACHED") {
        await ctx.reply(uz.common.memberLimitReached);
        return;
      }
      await ctx.reply(uz.start.invalidJoinCode);
      continue;
    }

    await ctx.reply(uz.start.joinedFamily(result.family.name));
    await ctx.reply(uz.start.mainMenuIntro, { reply_markup: mainMenuKeyboard });
    return;
  }
}
