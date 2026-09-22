import { InlineKeyboard } from "grammy";
import type { MyContext } from "../bot-context";
import { uz } from "../i18n/uz";
import { BalanceService } from "../services/balance.service";
import { BudgetService } from "../services/budget.service";
import { DebtService } from "../services/debt.service";
import { FamilyService, MAX_FAMILY_MEMBERS } from "../services/family.service";
import { formatDate, formatMoney, formatPercent, currentMonthKey, monthLabel } from "../utils/formatters";
import { backKeyboard } from "../keyboards/back.keyboard";
import { mainMenuKeyboard } from "../keyboards/main.keyboard";

async function requireAuth(ctx: MyContext): Promise<boolean> {
  if (!ctx.auth) {
    await ctx.reply(uz.common.notInFamily);
    return false;
  }
  return true;
}

/** Restricts the persistent reply keyboard to just "⬅️ Orqaga" so other
 * categories can't be tapped into while inside this one. */
async function enterSection(ctx: MyContext): Promise<void> {
  await ctx.reply(uz.common.backHint, { reply_markup: backKeyboard });
}

export async function backToMainMenuHandler(ctx: MyContext): Promise<void> {
  await ctx.reply(uz.common.backToMenu, { reply_markup: mainMenuKeyboard });
}

export async function addExpenseMenuHandler(ctx: MyContext): Promise<void> {
  if (!(await requireAuth(ctx))) return;
  await ctx.conversation.enter("expense");
}

export async function addIncomeMenuHandler(ctx: MyContext): Promise<void> {
  if (!(await requireAuth(ctx))) return;
  await ctx.conversation.enter("income");
}

export async function balanceMenuHandler(ctx: MyContext): Promise<void> {
  if (!(await requireAuth(ctx)) || !ctx.auth) return;

  const summary = await BalanceService.getSummary(ctx.auth.family.id);
  const section = (label: string, s: typeof summary.today) =>
    [
      uz.balance.period(label),
      uz.balance.income(formatMoney(s.totalIncome)),
      uz.balance.expense(formatMoney(s.totalExpenses)),
      uz.balance.net(formatMoney(s.netBalance)),
    ].join("\n");

  const text = [
    uz.balance.title,
    "",
    section(uz.balance.today, summary.today),
    "",
    section(uz.balance.week, summary.week),
    "",
    section(uz.balance.month, summary.month),
    "",
    section(uz.balance.overall, summary.overall),
  ].join("\n");

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: backKeyboard });
}

const reportPeriodKeyboard = new InlineKeyboard()
  .text(uz.balance.week, "report:week")
  .text(uz.balance.month, "report:month");

export async function reportsMenuHandler(ctx: MyContext): Promise<void> {
  if (!(await requireAuth(ctx))) return;
  await enterSection(ctx);
  await ctx.reply(uz.report.chooseRange, { reply_markup: reportPeriodKeyboard });
}

const budgetsKeyboard = new InlineKeyboard().text("➕ Yangi byudjet", "budget:new");

export async function budgetMenuHandler(ctx: MyContext): Promise<void> {
  if (!(await requireAuth(ctx)) || !ctx.auth) return;
  await enterSection(ctx);

  const month = currentMonthKey();
  const budgets = await BudgetService.listForMonth(ctx.auth.family.id, month);

  if (budgets.length === 0) {
    await ctx.reply(`${uz.budget.title} (${monthLabel(month)})\n\n${uz.budget.noBudgets}`, {
      reply_markup: budgetsKeyboard,
    });
    return;
  }

  const statusLabel = { SAFE: uz.budget.statusSafe, WARNING: uz.budget.statusWarning, EXCEEDED: uz.budget.statusExceeded };

  const lines = budgets.map(
    (b) =>
      `${b.categoryIcon} ${b.categoryName}: ${formatMoney(b.spent)} / ${formatMoney(b.budget.amount)} (${formatPercent(b.percent)}) — ${statusLabel[b.status]}`,
  );

  await ctx.reply(`${uz.budget.title} (${monthLabel(month)})\n\n${lines.join("\n")}`, {
    reply_markup: budgetsKeyboard,
  });
}

export async function debtsMenuHandler(ctx: MyContext): Promise<void> {
  if (!(await requireAuth(ctx)) || !ctx.auth) return;
  await enterSection(ctx);

  const debts = await DebtService.listActive(ctx.auth.family.id);
  const kb = new InlineKeyboard();

  if (debts.length === 0) {
    kb.text("➕ Yangi qarz", "debt:new");
    await ctx.reply(`${uz.debt.title}\n\n${uz.debt.noDebts}`, { reply_markup: kb });
    return;
  }

  const statusLabel = { PENDING: uz.debt.pending, OVERDUE: uz.debt.overdue, PAID: uz.debt.paid };
  const typeLabel = { I_OWE: uz.debt.typeIOwe, THEY_OWE: uz.debt.typeTheyOwe };

  const lines: string[] = [];
  for (const debt of debts) {
    lines.push(
      `${typeLabel[debt.type]} — ${debt.partyName}: ${formatMoney(debt.amount)}` +
        `${debt.dueDate ? ` (${formatDate(debt.dueDate)})` : ""} [${statusLabel[debt.status]}]`,
    );
    kb.text(`${uz.debt.markPaid}: ${debt.partyName}`, `debt:paid:${debt.id}`).row();
  }
  kb.text("➕ Yangi qarz", "debt:new");

  await ctx.reply(`${uz.debt.title}\n\n${lines.join("\n")}`, { reply_markup: kb });
}

export async function familyMenuHandler(ctx: MyContext): Promise<void> {
  if (!(await requireAuth(ctx)) || !ctx.auth) return;

  const members = await FamilyService.getFamilyMembers(ctx.auth.family.id);
  const roleLabel = { ADMIN: uz.family.roleAdmin, MEMBER: uz.family.roleMember };
  const lines = members.map((m) => `• ${m.displayName} — ${roleLabel[m.role]}`);

  const text = [
    `${uz.family.title}: ${ctx.auth.family.name}`,
    uz.family.membersCount(members.length),
    uz.family.joinCode(ctx.auth.family.joinCode),
    "",
    ...lines,
  ].join("\n");

  if (members.length >= MAX_FAMILY_MEMBERS) {
    await ctx.reply(`${text}\n\n${uz.common.memberLimitReached}`, { parse_mode: "HTML", reply_markup: backKeyboard });
    return;
  }

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: backKeyboard });
}

export async function settingsMenuHandler(ctx: MyContext): Promise<void> {
  if (!(await requireAuth(ctx)) || !ctx.auth) return;
  const text = [
    "⚙️ Sozlamalar",
    "",
    `Til: O'zbekcha`,
    `Valyuta: ${ctx.auth.user.currency}`,
    `Ism: ${ctx.auth.member.displayName}`,
  ].join("\n");
  await ctx.reply(text, { reply_markup: backKeyboard });
}
