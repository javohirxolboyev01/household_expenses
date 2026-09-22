import { InlineKeyboard } from "grammy";
import type { Category } from "@prisma/client";

export function categoryKeyboard(categories: Category[], prefix = "cat"): InlineKeyboard {
  const kb = new InlineKeyboard();
  categories.forEach((category, index) => {
    kb.text(`${category.icon} ${category.name}`, `${prefix}:${category.id}`);
    if (index % 2 === 1) kb.row();
  });
  if (categories.length % 2 === 1) kb.row();
  return kb;
}
