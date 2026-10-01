/**
 * Centralized Date and Timezone Utilities for Devio
 * Standardized to Mexico City timezone (America/Mexico_City) across all operations.
 */

export const MEXICO_TIMEZONE = "America/Mexico_City";

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MONTH_NAMES_SHORT_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

/**
 * Returns the current date in Mexico City as a Date object aligned to Mexico local day
 */
export function getMexicoNow(): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  
  try {
    const parts = formatter.formatToParts(new Date());
    let y = 0, m = 0, d = 0, h = 0, min = 0, s = 0;
    for (const part of parts) {
      if (part.type === "year") y = parseInt(part.value, 10);
      else if (part.type === "month") m = parseInt(part.value, 10) - 1;
      else if (part.type === "day") d = parseInt(part.value, 10);
      else if (part.type === "hour") h = parseInt(part.value, 10);
      else if (part.type === "minute") min = parseInt(part.value, 10);
      else if (part.type === "second") s = parseInt(part.value, 10);
    }
    return new Date(y, m, d, h, min, s);
  } catch (_) {
    return new Date();
  }
}

/**
 * Returns today's date formatted as YYYY-MM-DD in Mexico City time
 */
export function getMexicoDateISO(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: MEXICO_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch (_) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
}

/**
 * Parses any date representation safely into { year, month (0-11), day }
 * without UTC shift or timezone offset degradation.
 */
export function parseDateSafe(val?: string | Date | number | null): { year: number; month: number; day: number } | null {
  if (!val && val !== 0) return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: MEXICO_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.format(val).split("-").map(Number);
      return { year: parts[0]!, month: parts[1]! - 1, day: parts[2]! };
    } catch (_) {
      return { year: val.getFullYear(), month: val.getMonth(), day: val.getDate() };
    }
  }

  const clean = String(val).trim();
  if (!clean || clean.toLowerCase() === "pendiente" || clean === "-") return null;

  // 1. ISO format with potential time/UTC: YYYY-MM-DD (e.g. 2026-10-01, 2026-10-01T00:00:00.000Z)
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const datePart = clean.split("T")[0]!;
    const parts = datePart.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
  }

  // 2. Format DD/MM/YYYY or DD-MM-YYYY (e.g. 01/10/2026 or 1/10/2026)
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
    const parts = clean.split(/[\/\-]/).map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return { year: parts[2], month: parts[1] - 1, day: parts[0] };
    }
  }

  // 3. Format YYYY/MM/DD
  if (/^\d{4}[\/]\d{1,2}[\/]\d{1,2}$/.test(clean)) {
    const parts = clean.split("/").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
  }

  // 4. Text format: "18 Sep 2026", "1 Octubre 2026", "01/Oct/2026"
  const monthMap: Record<string, number> = {
    ene: 0, enero: 0, jan: 0, january: 0,
    feb: 1, febrero: 1, february: 1,
    mar: 2, marzo: 2, march: 2,
    abr: 3, abril: 3, apr: 3, april: 3,
    may: 4, mayo: 4,
    jun: 5, junio: 5, june: 5,
    jul: 6, julio: 6, july: 6,
    ago: 7, agosto: 7, aug: 7, august: 7,
    sep: 8, sept: 8, septiembre: 8, september: 8,
    oct: 9, octubre: 9, october: 9,
    nov: 10, noviembre: 10, november: 10,
    dic: 11, diciembre: 11, dec: 11, december: 11,
  };

  const textTokens = clean.replace(/,/g, "").split(/[\s\/\-]+/);
  if (textTokens.length >= 3) {
    const firstNum = parseInt(textTokens[0]!, 10);
    const lastNum = parseInt(textTokens[textTokens.length - 1]!, 10);
    const middleToken = textTokens[1]!.toLowerCase();

    if (!isNaN(firstNum) && !isNaN(lastNum)) {
      const monthIdx = monthMap[middleToken] ?? monthMap[middleToken.slice(0, 3)];
      if (monthIdx !== undefined) {
        if (lastNum > 1000) {
          return { year: lastNum, month: monthIdx, day: firstNum };
        } else if (firstNum > 1000) {
          return { year: firstNum, month: monthIdx, day: lastNum };
        }
      }
    }
  }

  // Fallback to standard JS Date
  const fallback = new Date(clean);
  if (!isNaN(fallback.getTime())) {
    return { year: fallback.getFullYear(), month: fallback.getMonth(), day: fallback.getDate() };
  }

  return null;
}

/**
 * Formats year, monthIndex (0-11), and day into standard YYYY-MM-DD string
 */
export function formatDateISO(year: number, monthIndex: number, day: number): string {
  // Normalize year and month overflow
  const d = new Date(year, monthIndex, 1, 12, 0, 0);
  const y = d.getFullYear();
  const m = d.getMonth();
  
  // Calculate max days in target month
  const maxDaysInMonth = new Date(y, m + 1, 0).getDate();
  const safeDay = Math.min(Math.max(1, day), maxDaysInMonth);
  
  const mStr = String(m + 1).padStart(2, "0");
  const dStr = String(safeDay).padStart(2, "0");
  return `${y}-${mStr}-${dStr}`;
}

export type DateFormatStyle = "dd/mm/yyyy" | "d/m/yyyy" | "yyyy-mm-dd" | "short" | "long" | "medium";

/**
 * Universal Mexican date formatter with guaranteed timezone stability
 */
export function formatDateMX(
  val?: string | Date | number | null,
  style: DateFormatStyle = "dd/mm/yyyy"
): string {
  const parsed = parseDateSafe(val);
  if (!parsed) {
    return val ? String(val) : "";
  }

  const { year, month, day } = parsed;
  const dStrPad = String(day).padStart(2, "0");
  const mStrPad = String(month + 1).padStart(2, "0");
  const monthShort = MONTH_NAMES_SHORT_ES[month] || "Ene";
  const monthLong = MONTH_NAMES_ES[month] || "Enero";

  switch (style) {
    case "yyyy-mm-dd":
      return `${year}-${mStrPad}-${dStrPad}`;
    case "d/m/yyyy":
      return `${day}/${month + 1}/${year}`;
    case "short":
      return `${dStrPad} ${monthShort} ${year}`;
    case "medium":
      return `${day} de ${monthShort}, ${year}`;
    case "long":
      return `${day} de ${monthLong} de ${year}`;
    case "dd/mm/yyyy":
    default:
      return `${dStrPad}/${mStrPad}/${year}`;
  }
}

/**
 * Calculates payment installment dates according to frequency and cutoff day
 */
export function calculateInstallmentDate(
  baseDateStr: string = "",
  index: number = 1,
  period: string = "Mensual",
  cutoffDay?: number
): string {
  const parsed = parseDateSafe(baseDateStr) || {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    day: new Date().getDate(),
  };

  const targetDay = cutoffDay && cutoffDay > 0 ? cutoffDay : parsed.day;

  if (period === "Semanal") {
    const d = new Date(parsed.year, parsed.month, parsed.day + index * 7, 12, 0, 0);
    return formatDateISO(d.getFullYear(), d.getMonth(), d.getDate());
  } else if (period === "Quincenal") {
    const d = new Date(parsed.year, parsed.month, parsed.day + index * 15, 12, 0, 0);
    return formatDateISO(d.getFullYear(), d.getMonth(), d.getDate());
  } else if (period === "Bimestral") {
    return formatDateISO(parsed.year, parsed.month + index * 2, targetDay);
  } else if (period === "Trimestral") {
    return formatDateISO(parsed.year, parsed.month + index * 3, targetDay);
  } else if (period === "Semestral") {
    return formatDateISO(parsed.year, parsed.month + index * 6, targetDay);
  } else if (period === "Anual") {
    return formatDateISO(parsed.year + index, parsed.month, targetDay);
  } else {
    // Mensual por default
    return formatDateISO(parsed.year, parsed.month + index, targetDay);
  }
}

/**
 * Checks if a date string is past due relative to Mexico City current date
 */
export function isDatePastDueMX(dateStr?: string | Date | null): boolean {
  const parsed = parseDateSafe(dateStr);
  if (!parsed) return false;
  
  const mexicoNow = getMexicoNow();
  mexicoNow.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(parsed.year, parsed.month, parsed.day, 0, 0, 0);
  return targetDate.getTime() < mexicoNow.getTime();
}
