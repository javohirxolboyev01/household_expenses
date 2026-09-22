function stripGroupSeparators(numStr: string): string {
  return numStr.replace(/[.,\s]/g, "");
}

/**
 * '.', ',' and spaces are treated purely as thousand separators, matching
 * how numbers are normally written: "6.000.000", "6,500,000", "6 000 000"
 * and "6000000" all mean six million(-ish) so'm.
 */
const GROUPED_INTEGER_ANCHORED = /^(?:\d{1,3}(?:[.,\s]\d{3})+|\d+)$/;
const GROUPED_INTEGER_LOOSE = /\d{1,3}(?:[.,\s]\d{3})+|\d+/;

function fromGroupedMatch(matchedText: string): number | null {
  const result = Number(stripGroupSeparators(matchedText));
  return Number.isFinite(result) && result > 0 ? Math.round(result) : null;
}

/**
 * Parses a plain number where the ENTIRE string is the amount: "350000",
 * "350.000", "350,000", "6 000 000" -> raw number of UZS. Returns null for
 * anything else, including free-form text.
 */
export function parseAmount(raw: string): number | null {
  const text = raw.trim();
  return GROUPED_INTEGER_ANCHORED.test(text) ? fromGroupedMatch(text) : null;
}

/**
 * Finds a money amount ANYWHERE within free-form text, e.g. "Men bugun
 * 6.000.000 oylik oldim" -> 6000000. Used as a fallback so users can type
 * a full sentence at an amount prompt instead of a bare number.
 */
export function extractAmount(raw: string): number | null {
  const match = raw.match(GROUPED_INTEGER_LOOSE);
  return match ? fromGroupedMatch(match[0]) : null;
}

export function isValidJoinCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.trim().toUpperCase());
}

/**
 * Parses a "KK.OO.YYYY" date, rejecting anything JS's Date would otherwise
 * silently roll over (e.g. "31.02.2026" would normalize to March 3rd).
 */
export function parseUzbekDate(raw: string): Date | null {
  const match = raw.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);

  const isValid =
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isValid ? date : null;
}
