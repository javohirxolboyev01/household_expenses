import { InlineKeyboard } from "grammy";
import { uz } from "../i18n/uz";

export const confirmCancelKeyboard = new InlineKeyboard()
  .text(uz.common.confirm, "confirm")
  .text(uz.common.cancel, "cancel");

export const cancelOnlyKeyboard = new InlineKeyboard().text(uz.common.cancel, "cancel");

export const skipCancelKeyboard = new InlineKeyboard()
  .text(uz.common.skip, "skip")
  .text(uz.common.cancel, "cancel");

export const dateChoiceKeyboard = new InlineKeyboard()
  .text(uz.common.today, "date:today")
  .row()
  .text(uz.common.cancel, "cancel");

export const paymentMethodKeyboard = new InlineKeyboard()
  .text(uz.transaction.paymentCash, "pay:CASH")
  .text(uz.transaction.paymentCard, "pay:CARD")
  .row()
  .text(uz.transaction.paymentTransfer, "pay:BANK_TRANSFER")
  .text(uz.transaction.paymentOther, "pay:OTHER")
  .row()
  .text(uz.common.cancel, "cancel");

export function paginationKeyboard(prefix: string, page: number, hasNext: boolean): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (page > 0) kb.text("⬅️", `${prefix}:page:${page - 1}`);
  if (hasNext) kb.text("➡️", `${prefix}:page:${page + 1}`);
  return kb;
}
