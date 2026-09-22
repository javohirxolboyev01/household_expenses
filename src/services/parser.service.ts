import type { CategoryType } from "@prisma/client";
import { extractAmount } from "../utils/validators";

export interface ParsedTransaction {
  amount: number;
  type: CategoryType;
  categoryGuess: string;
  description: string;
}

const INCOME_KEYWORDS = ["oldim", "kirim", "maosh", "daromad", "sotuv", "foyda", "tushdi", "berdi"];
const EXPENSE_KEYWORDS = ["sarfladim", "xarid", "to'ladim", "toladim", "ketdi", "sotib oldim", "berdim"];

const CATEGORY_KEYWORDS: { keywords: string[]; category: string }[] = [
  { keywords: ["supermarket", "oziq", "bozor", "do'kon", "dokon", "market"], category: "Oziq-ovqat" },
  { keywords: ["taksi", "avtobus", "metro", "benzin", "transport", "yo'l"], category: "Transport" },
  { keywords: ["kommunal", "svet", "gaz", "suv", "elektr"], category: "Kommunal" },
  { keywords: ["maosh", "ish haqi"], category: "Maosh" },
  { keywords: ["kiyim", "poyabzal"], category: "Kiyim" },
  { keywords: ["dorixona", "shifoxona", "salomat", "dori"], category: "Salomatlik" },
  { keywords: ["restoran", "kafe", "kino", "concert"], category: "Ko'ngilochar" },
  { keywords: ["o'quv", "kurs", "maktab", "universitet"], category: "Ta'lim" },
  { keywords: ["ijara", "kvartira", "uy"], category: "Uy-joy" },
  { keywords: ["biznes", "savdo"], category: "Biznes" },
  { keywords: ["sovg'a", "sovga"], category: "Sovg'a" },
];

export const ParserService = {
  parse(text: string): ParsedTransaction | null {
    const lower = text.toLowerCase();
    const amount = extractAmount(lower);
    if (amount === null) return null;

    let type: CategoryType = "EXPENSE";
    if (INCOME_KEYWORDS.some((kw) => lower.includes(kw))) type = "INCOME";
    if (EXPENSE_KEYWORDS.some((kw) => lower.includes(kw))) type = "EXPENSE";

    let categoryGuess = type === "INCOME" ? "Boshqa" : "Boshqa";
    for (const entry of CATEGORY_KEYWORDS) {
      if (entry.keywords.some((kw) => lower.includes(kw))) {
        categoryGuess = entry.category;
        break;
      }
    }

    const description = text.trim();

    return { amount, type, categoryGuess, description };
  },
};
