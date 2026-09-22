import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { env } from "./config/env";
import type { MyContext } from "./bot-context";
import { initialSession } from "./bot-context";

import { authMiddleware } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";

import { expenseConversation } from "./conversations/expense.conversation";
import { incomeConversation } from "./conversations/income.conversation";
import { budgetConversation } from "./conversations/budget.conversation";
import { debtConversation } from "./conversations/debt.conversation";
import { createFamilyConversation, joinFamilyConversation } from "./conversations/onboarding.conversation";

import { startHandler } from "./handlers/commands/start.handler";
import { helpHandler } from "./handlers/commands/help.handler";

import { onboardingCreateCallback, onboardingJoinCallback } from "./handlers/callbacks/onboarding.callback";
import { budgetNewCallback } from "./handlers/callbacks/budget.callback";
import { debtNewCallback, debtPaidCallback } from "./handlers/callbacks/debt.callback";
import { reportCallback } from "./handlers/callbacks/report.callback";
import { nlpConfirmCallback, nlpCancelCallback } from "./handlers/callbacks/nlp.callback";

import {
  addExpenseMenuHandler,
  addIncomeMenuHandler,
  balanceMenuHandler,
  reportsMenuHandler,
  budgetMenuHandler,
  debtsMenuHandler,
  familyMenuHandler,
  settingsMenuHandler,
  backToMainMenuHandler,
} from "./handlers/menu.handler";
import { textHandler } from "./handlers/text.handler";
import { uz } from "./i18n/uz";

export function createBot(): Bot<MyContext> {
  const bot = new Bot<MyContext>(env.BOT_TOKEN);

  bot.use(session({ initial: initialSession }));
  bot.use(conversations());

  bot.use(createConversation(expenseConversation, "expense"));
  bot.use(createConversation(incomeConversation, "income"));
  bot.use(createConversation(budgetConversation, "budget"));
  bot.use(createConversation(debtConversation, "debt"));
  bot.use(createConversation(createFamilyConversation, "createFamily"));
  bot.use(createConversation(joinFamilyConversation, "joinFamily"));

  bot.use(authMiddleware);

  bot.command("start", startHandler);
  bot.command("help", helpHandler);

  bot.callbackQuery("onboard:create", onboardingCreateCallback);
  bot.callbackQuery("onboard:join", onboardingJoinCallback);
  bot.callbackQuery("budget:new", budgetNewCallback);
  bot.callbackQuery("debt:new", debtNewCallback);
  bot.callbackQuery(/^debt:paid:.+/, debtPaidCallback);
  bot.callbackQuery(["report:week", "report:month"], reportCallback);
  bot.callbackQuery("confirm", nlpConfirmCallback);
  bot.callbackQuery("cancel", nlpCancelCallback);

  bot.hears(uz.menu.addExpense, addExpenseMenuHandler);
  bot.hears(uz.menu.addIncome, addIncomeMenuHandler);
  bot.hears(uz.menu.balance, balanceMenuHandler);
  bot.hears(uz.menu.reports, reportsMenuHandler);
  bot.hears(uz.menu.budget, budgetMenuHandler);
  bot.hears(uz.menu.debts, debtsMenuHandler);
  bot.hears(uz.menu.family, familyMenuHandler);
  bot.hears(uz.menu.settings, settingsMenuHandler);
  bot.hears(uz.menu.help, helpHandler);
  bot.hears(uz.common.back, backToMainMenuHandler);

  bot.on("message:text", textHandler);

  bot.catch(errorHandler);

  return bot;
}
