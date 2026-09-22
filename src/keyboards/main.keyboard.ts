import { Keyboard } from "grammy";
import { uz } from "../i18n/uz";

export const mainMenuKeyboard = new Keyboard()
  .text(uz.menu.addExpense)
  .text(uz.menu.addIncome)
  .row()
  .text(uz.menu.balance)
  .text(uz.menu.reports)
  .row()
  .text(uz.menu.budget)
  .text(uz.menu.debts)
  .row()
  .text(uz.menu.family)
  .text(uz.menu.settings)
  .row()
  .text(uz.menu.help)
  .resized();
