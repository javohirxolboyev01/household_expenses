import type { Context, SessionFlavor } from "grammy";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import type { AuthContext } from "./services/family.service";

export interface SessionData {
  // grammY session storage required by the conversations plugin.
  // Kept intentionally empty; conversation state is managed internally.
}

export interface AuthFlavor {
  /** Populated by auth.middleware for the current update. Not reliable inside
   * a replaying conversation step — conversations must re-resolve auth via
   * `conversation.external`. */
  auth: AuthContext | null;
}

export type MyContext = Context & ConversationFlavor<Context> & SessionFlavor<SessionData> & AuthFlavor;
export type MyConversation = Conversation<MyContext, MyContext>;

export const initialSession = (): SessionData => ({});
