import { prisma } from "../prisma";
import { generateJoinCode } from "../utils/formatters";
import type { Category, CategoryType, Family, FamilyMember, User } from "@prisma/client";
import type { TelegramProfile } from "./user.service";

export const MAX_FAMILY_MEMBERS = 6;

const DEFAULT_CATEGORIES: { name: string; icon: string; type: CategoryType }[] = [
  { name: "Oziq-ovqat", icon: "🍔", type: "EXPENSE" },
  { name: "Uy-joy", icon: "🏠", type: "EXPENSE" },
  { name: "Transport", icon: "🚕", type: "EXPENSE" },
  { name: "Kommunal", icon: "💡", type: "EXPENSE" },
  { name: "Ta'lim", icon: "📚", type: "EXPENSE" },
  { name: "Salomatlik", icon: "💊", type: "EXPENSE" },
  { name: "Kiyim", icon: "👕", type: "EXPENSE" },
  { name: "Ko'ngilochar", icon: "🎉", type: "EXPENSE" },
  { name: "Boshqa", icon: "🌀", type: "EXPENSE" },
  { name: "Maosh", icon: "💼", type: "INCOME" },
  { name: "Biznes", icon: "📈", type: "INCOME" },
  { name: "Sovg'a", icon: "🎁", type: "INCOME" },
];

export interface AuthContext {
  user: User;
  member: FamilyMember;
  family: Family;
}

export type JoinFamilyResult =
  | { ok: true; family: Family; member: FamilyMember }
  | { ok: false; reason: "NOT_FOUND" | "LIMIT_REACHED" };

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateJoinCode();
    const existing = await prisma.family.findUnique({ where: { joinCode: code } });
    if (!existing) return code;
  }
  throw new Error("Noyob qo'shilish kodini generatsiya qilib bo'lmadi");
}

export const FamilyService = {
  async getAuthContext(telegramId: bigint): Promise<AuthContext | null> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { memberships: { include: { family: true } } },
    });
    if (!user) return null;
    const membership = user.memberships[0];
    if (!membership) return null;
    return { user, member: membership, family: membership.family };
  },

  async createFamilyWithAdmin(profile: TelegramProfile, familyName: string): Promise<AuthContext> {
    const joinCode = await generateUniqueJoinCode();

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
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

      const family = await tx.family.create({
        data: { name: familyName, joinCode },
      });

      const member = await tx.familyMember.create({
        data: {
          familyId: family.id,
          userId: user.id,
          displayName: profile.firstName,
          role: "ADMIN",
        },
      });

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({ ...c, familyId: family.id })),
      });

      return { user, member, family };
    });
  },

  async joinFamilyByCode(profile: TelegramProfile, rawCode: string): Promise<JoinFamilyResult> {
    const code = rawCode.trim().toUpperCase();
    const family = await prisma.family.findUnique({
      where: { joinCode: code },
      include: { members: true },
    });

    if (!family) return { ok: false, reason: "NOT_FOUND" };
    if (family.members.length >= MAX_FAMILY_MEMBERS) {
      return { ok: false, reason: "LIMIT_REACHED" };
    }

    const member = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
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

      const existing = await tx.familyMember.findUnique({
        where: { familyId_userId: { familyId: family.id, userId: user.id } },
      });
      if (existing) return existing;

      const freshCount = await tx.familyMember.count({ where: { familyId: family.id } });
      if (freshCount >= MAX_FAMILY_MEMBERS) {
        throw new Error("LIMIT_REACHED");
      }

      return tx.familyMember.create({
        data: {
          familyId: family.id,
          userId: user.id,
          displayName: profile.firstName,
          role: "MEMBER",
        },
      });
    }).catch((err: Error) => {
      if (err.message === "LIMIT_REACHED") return null;
      throw err;
    });

    if (!member) return { ok: false, reason: "LIMIT_REACHED" };
    return { ok: true, family, member };
  },

  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    return prisma.familyMember.findMany({ where: { familyId }, orderBy: { createdAt: "asc" } });
  },

  async getFamily(familyId: string): Promise<Family | null> {
    return prisma.family.findUnique({ where: { id: familyId } });
  },

  async getCategories(familyId: string, type: CategoryType): Promise<Category[]> {
    return prisma.category.findMany({ where: { familyId, type }, orderBy: { name: "asc" } });
  },

  async getCategoryById(categoryId: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id: categoryId } });
  },
};
