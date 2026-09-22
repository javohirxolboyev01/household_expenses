import type { MyContext } from "../../bot-context";

export async function budgetNewCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("budget");
}
