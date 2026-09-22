import { PrismaClient } from "@prisma/client";
import type { CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_JOIN_CODE = "DEMO01";

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

const DEMO_MEMBERS = [
  { telegramId: 900000001n, firstName: "Aziz", lastName: "Aliyev", role: "ADMIN" as const },
  { telegramId: 900000002n, firstName: "Nilufar", lastName: "Aliyeva", role: "MEMBER" as const },
  { telegramId: 900000003n, firstName: "Sardor", lastName: "Aliyev", role: "MEMBER" as const },
  { telegramId: 900000004n, firstName: "Malika", lastName: "Aliyeva", role: "MEMBER" as const },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function main(): Promise<void> {
  const existing = await prisma.family.findUnique({ where: { joinCode: DEMO_JOIN_CODE } });
  if (existing) {
    console.log("♻️  Eski demo oila topildi, o'chirilmoqda...");
    // Deleting the family cascades FamilyMember/Category/Transaction/Budget/Debt,
    // but User rows are not children of Family and must be cleaned up separately.
    await prisma.user.deleteMany({ where: { telegramId: { in: DEMO_MEMBERS.map((m) => m.telegramId) } } });
    await prisma.family.delete({ where: { id: existing.id } });
  }

  console.log("🏠 Demo oila yaratilmoqda...");
  const family = await prisma.family.create({
    data: { name: "Aliyevlar oilasi", joinCode: DEMO_JOIN_CODE },
  });

  console.log("🗂 Kategoriyalar yaratilmoqda...");
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, familyId: family.id })),
  });
  const categories = await prisma.category.findMany({ where: { familyId: family.id } });
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  console.log("👨‍👩‍👧‍👦 Oila a'zolari yaratilmoqda...");
  const members = [];
  for (const demoMember of DEMO_MEMBERS) {
    const user = await prisma.user.create({
      data: {
        telegramId: demoMember.telegramId,
        firstName: demoMember.firstName,
        lastName: demoMember.lastName,
      },
    });
    const member = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId: user.id,
        displayName: demoMember.firstName,
        role: demoMember.role,
      },
    });
    members.push(member);
  }

  const [admin, member2, member3, member4] = members;
  if (!admin || !member2 || !member3 || !member4) {
    throw new Error("Demo a'zolarni yaratishda xatolik");
  }

  console.log("💰 Byudjetlar yaratilmoqda...");
  const currentMonth = monthKey(new Date());
  const budgetCategories: [string, number][] = [
    ["Oziq-ovqat", 3_000_000],
    ["Transport", 800_000],
    ["Ko'ngilochar", 500_000],
    ["Kommunal", 1_200_000],
  ];
  for (const [name, amount] of budgetCategories) {
    const category = categoryByName.get(name);
    if (!category) continue;
    await prisma.budget.create({
      data: { familyId: family.id, categoryId: category.id, amount, month: currentMonth },
    });
  }

  console.log("🧾 Namunaviy tranzaksiyalar yaratilmoqda...");
  const sampleTransactions: {
    memberId: string;
    categoryName: string;
    amount: number;
    type: CategoryType;
    daysAgo: number;
    description?: string;
  }[] = [
    { memberId: admin.id, categoryName: "Maosh", amount: 8_500_000, type: "INCOME", daysAgo: 20, description: "Oylik maosh" },
    { memberId: member2.id, categoryName: "Biznes", amount: 2_300_000, type: "INCOME", daysAgo: 15, description: "Frilanser ish" },
    { memberId: admin.id, categoryName: "Oziq-ovqat", amount: 350_000, type: "EXPENSE", daysAgo: 1, description: "Supermarket" },
    { memberId: member2.id, categoryName: "Oziq-ovqat", amount: 220_000, type: "EXPENSE", daysAgo: 3, description: "Bozor" },
    { memberId: member3.id, categoryName: "Transport", amount: 45_000, type: "EXPENSE", daysAgo: 2, description: "Taksi" },
    { memberId: admin.id, categoryName: "Kommunal", amount: 650_000, type: "EXPENSE", daysAgo: 10, description: "Svet va gaz" },
    { memberId: member4.id, categoryName: "Ta'lim", amount: 900_000, type: "EXPENSE", daysAgo: 7, description: "Kurs to'lovi" },
    { memberId: member2.id, categoryName: "Kiyim", amount: 480_000, type: "EXPENSE", daysAgo: 5 },
    { memberId: member3.id, categoryName: "Ko'ngilochar", amount: 150_000, type: "EXPENSE", daysAgo: 4, description: "Kino" },
    { memberId: admin.id, categoryName: "Salomatlik", amount: 120_000, type: "EXPENSE", daysAgo: 6, description: "Dorixona" },
    { memberId: member4.id, categoryName: "Sovg'a", amount: 300_000, type: "INCOME", daysAgo: 12, description: "Tug'ilgan kun sovg'asi" },
    { memberId: member3.id, categoryName: "Uy-joy", amount: 2_000_000, type: "EXPENSE", daysAgo: 14, description: "Ijara" },
  ];

  for (const tx of sampleTransactions) {
    const category = categoryByName.get(tx.categoryName);
    if (!category) continue;
    await prisma.transaction.create({
      data: {
        familyId: family.id,
        memberId: tx.memberId,
        categoryId: category.id,
        amount: tx.amount,
        type: tx.type,
        paymentMethod: "CASH",
        description: tx.description ?? null,
        date: daysAgo(tx.daysAgo),
      },
    });
  }

  console.log("✅ Seed muvaffaqiyatli yakunlandi!");
  console.log(`   Oila: ${family.name}`);
  console.log(`   Qo'shilish kodi: ${family.joinCode}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed xatoligi:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
