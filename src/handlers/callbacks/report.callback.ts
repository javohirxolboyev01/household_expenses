import type { MyContext } from "../../bot-context";
import { uz } from "../../i18n/uz";
import { ReportService } from "../../services/report.service";
import { startOfMonth, startOfWeek } from "../../services/balance.service";
import { formatMoney, formatPercent } from "../../utils/formatters";

export async function reportCallback(ctx: MyContext): Promise<void> {
  await ctx.answerCallbackQuery();
  const data = ctx.callbackQuery?.data;
  if (!data || !ctx.auth) return;

  const isWeek = data === "report:week";
  const from = isWeek ? startOfWeek() : startOfMonth();
  const to = new Date();
  const label = isWeek ? uz.balance.week : uz.balance.month;

  const [byCategory, byMember] = await Promise.all([
    ReportService.byCategory(ctx.auth.family.id, { from, to }, "EXPENSE"),
    ReportService.byMember(ctx.auth.family.id, { from, to }, "EXPENSE"),
  ]);

  if (byCategory.length === 0) {
    await ctx.reply(`${uz.report.title} — ${label}\n\n${uz.report.noData}`);
    return;
  }

  const categoryLines = byCategory.map(
    (c) => `${c.icon} ${c.name}: ${formatMoney(c.amount)} (${formatPercent(c.percent)})`,
  );
  const memberLines = byMember.map(
    (m) => `${m.displayName}: ${formatMoney(m.amount)} (${formatPercent(m.percent)})`,
  );

  const text = [
    `${uz.report.title} — ${label}`,
    "",
    uz.report.byCategoryTitle,
    ...categoryLines,
    "",
    uz.report.byMemberTitle,
    ...memberLines,
  ].join("\n");

  await ctx.reply(text);
}
