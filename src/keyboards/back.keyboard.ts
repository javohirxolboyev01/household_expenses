import { Keyboard } from "grammy";
import { uz } from "../i18n/uz";

/** Persistent reply keyboard shown while the user is inside a section or
 * conversation, replacing the full main menu so other categories can't be
 * tapped into until the user backs out. */
export const backKeyboard = new Keyboard().text(uz.common.back).resized();
