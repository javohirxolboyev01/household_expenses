import type { MyContext } from "../../bot-context";

export async function onboardingCreateCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("createFamily");
}

export async function onboardingJoinCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("joinFamily");
}
