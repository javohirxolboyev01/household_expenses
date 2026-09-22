import { createBot } from "./bot";
import { prisma } from "./prisma";
import { DebtReminderService } from "./services/debt-reminder.service";

async function main(): Promise<void> {
  const bot = createBot();

  await bot.api.setMyCommands([
    { command: "start", description: "Botni ishga tushirish / oila sozlash" },
    { command: "help", description: "Yordam va buyruqlar ro'yxati" },
  ]);

  const runDebtReminderCheck = () => {
    DebtReminderService.checkAndSendReminders(bot.api).catch((err) => {
      console.error("❌ Qarz eslatmalarini yuborishda xatolik:", err);
    });
  };
  runDebtReminderCheck();
  const reminderTimer = setInterval(runDebtReminderCheck, DebtReminderService.checkIntervalMs);

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} qabul qilindi. Bot to'xtatilmoqda...`);
    clearInterval(reminderTimer);
    await bot.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  console.log("🤖 Oilaviy xarajatlar boti ishga tushmoqda...");
  await bot.start({
    onStart: (info) => console.log(`✅ Bot ishga tushdi: @${info.username}`),
  });
}

main().catch((err) => {
  console.error("❌ Botni ishga tushirishda xatolik:", err);
  process.exit(1);
});
