import { prisma } from "../prisma";
import type { User } from "@prisma/client";

export interface TelegramProfile {
  telegramId: bigint;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
}

export const UserService = {
  async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return prisma.user.findUnique({ where: { telegramId } });
  },

  async upsert(profile: TelegramProfile): Promise<User> {
    return prisma.user.upsert({
      where: { telegramId: profile.telegramId },
      update: {
        username: profile.username ?? undefined,
        firstName: profile.firstName,
        lastName: profile.lastName ?? undefined,
      },
      create: {
        telegramId: profile.telegramId,
        username: profile.username ?? undefined,
        firstName: profile.firstName,
        lastName: profile.lastName ?? undefined,
      },
    });
  },
};
