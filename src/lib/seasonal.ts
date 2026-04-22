export type Season = "valentines" | "easter" | "halloween" | "christmas" | "newyear" | "default";

export interface SeasonInfo {
  season: Season;
  heroLabel: string;
}

// Compute Easter (Anonymous Gregorian / Meeus algorithm)
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function detectSeason(now: Date = new Date()): SeasonInfo {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  // Valentine's: Feb 1–14
  if (m === 1 && d <= 14) return { season: "valentines", heroLabel: "Baked With Love This Valentine's" };

  // Easter: 14 days before Easter Sunday → Easter Sunday
  const easter = easterDate(y);
  const easterStart = new Date(easter); easterStart.setDate(easter.getDate() - 14);
  if (now >= easterStart && now <= easter) return { season: "easter", heroLabel: "Fresh Bakes For The Season" };

  // Halloween: Oct 1–31
  if (m === 9) return { season: "halloween", heroLabel: "Wickedly Good Pastries" };

  // Christmas: Dec 1–25
  if (m === 11 && d <= 25) return { season: "christmas", heroLabel: "The Sweetest Gift This Christmas" };

  // New Year: Dec 26 – Jan 1
  if ((m === 11 && d >= 26) || (m === 0 && d === 1)) return { season: "newyear", heroLabel: "End The Year On A Sweet Note" };

  return { season: "default", heroLabel: "Baked In Busia · Made With Love" };
}
