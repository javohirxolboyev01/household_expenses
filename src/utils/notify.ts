import type { Api } from "grammy";
import { prisma } from "../prisma";

/**
 * Sends a message to every member of a family (e.g. a shared budget alert),
 * not just the person who triggered it — the family's data and events are
 * shared across all its members. Skips a member silently if delivery fails
 * (blocked the bot, chat not found, etc.) rather than failing the whole
 * broadcast.
 */
export async function notifyFamily(api: Api, familyId: string, message: string): Promise<void> {
  const members = await prisma.familyMember.findMany({
    where: { familyId },
    include: { user: { select: { telegramId: true } } },
  });

  await Promise.all(
    members.map((member) =>
      api.sendMessage(member.user.telegramId.toString(), message, { parse_mode: "HTML" }).catch(() => {
        // Member may have blocked the bot or never started a chat with it.
      }),
    ),
  );
}
