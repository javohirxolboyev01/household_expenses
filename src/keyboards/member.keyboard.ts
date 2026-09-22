import { InlineKeyboard } from "grammy";
import type { FamilyMember } from "@prisma/client";
import { uz } from "../i18n/uz";

export function memberKeyboard(members: FamilyMember[], prefix = "mem"): InlineKeyboard {
  const kb = new InlineKeyboard();
  members.forEach((member, index) => {
    const label = member.role === "ADMIN" ? `${uz.family.roleAdmin} ${member.displayName}` : member.displayName;
    kb.text(label, `${prefix}:${member.id}`);
    if (index % 2 === 1) kb.row();
  });
  if (members.length % 2 === 1) kb.row();
  return kb;
}
