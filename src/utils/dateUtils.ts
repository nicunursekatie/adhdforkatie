import {
  format,
  parse,
  isValid,
  startOfDay,
  addDays,
  addWeeks,
  addMonths,
  nextDay,
  lastDayOfMonth,
} from 'date-fns';

// Standard date format used throughout the app (YYYY-MM-DD).
export const DATE_FORMAT = 'yyyy-MM-dd';

export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    if (dateString.includes('T') || dateString.includes('Z')) {
      const isoDate = new Date(dateString);
      return isValid(isoDate) ? isoDate : null;
    }
    const parsed = parse(dateString, DATE_FORMAT, new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function formatDateString(date: Date | null | undefined): string | null {
  if (!date || !isValid(date)) return null;
  try {
    return format(date, DATE_FORMAT);
  } catch {
    return null;
  }
}

// Local-timezone "today" so it matches the user's perception of the day.
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowString(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const year = t.getFullYear();
  const month = String(t.getMonth() + 1).padStart(2, '0');
  const day = String(t.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  if (!date) return '';
  try {
    return format(date, 'EEE, MMM d');
  } catch {
    return '';
  }
}

export function isToday(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString);
  if (!date) return false;
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
}

export function isPastDate(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString);
  if (!date) return false;
  return startOfDay(date) < startOfDay(new Date());
}

export function getDaysBetween(
  a: string | null | undefined,
  b: string | null | undefined
): number | null {
  const d1 = parseDate(a);
  const d2 = parseDate(b);
  if (!d1 || !d2) return null;
  const diff = startOfDay(d2).getTime() - startOfDay(d1).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export interface DueDateStatus {
  text: string;
  className: string;
  isOverdue: boolean;
  isToday: boolean;
  daysUntilDue: number | null;
}

export function getDueDateStatus(dateString: string | null | undefined): DueDateStatus | null {
  if (!dateString) return null;
  const daysUntil = getDaysBetween(getTodayString(), dateString);
  if (daysUntil === null) return null;

  if (daysUntil < 0) {
    const overdue = Math.abs(daysUntil);
    return {
      text: `${overdue} day${overdue !== 1 ? 's' : ''} overdue`,
      className: 'text-red-600 font-semibold',
      isOverdue: true,
      isToday: false,
      daysUntilDue: daysUntil,
    };
  }
  if (daysUntil === 0)
    return { text: 'Due today', className: 'text-orange-600 font-bold', isOverdue: false, isToday: true, daysUntilDue: 0 };
  if (daysUntil === 1)
    return { text: 'Due tomorrow', className: 'text-amber-600 font-semibold', isOverdue: false, isToday: false, daysUntilDue: 1 };
  if (daysUntil <= 3)
    return { text: formatDateForDisplay(dateString), className: 'text-gray-700 dark:text-gray-300 font-medium', isOverdue: false, isToday: false, daysUntilDue: daysUntil };
  return { text: formatDateForDisplay(dateString), className: 'text-gray-500 dark:text-gray-400', isOverdue: false, isToday: false, daysUntilDue: daysUntil };
}

// ---------------------------------------------------------------------------
// Natural-language date parsing — the heart of friction-free quick capture.
// "call dentist tomorrow", "report by july 1", "groceries in 3 days", "2w".
// ---------------------------------------------------------------------------

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7, september: 8,
  sep: 8, october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11,
};

export function parseNaturalDate(input: string): Date | null {
  const s = input.toLowerCase().trim();
  const today = startOfDay(new Date());

  if (s === 'today') return today;
  if (s === 'tomorrow') return addDays(today, 1);
  if (s === 'yesterday') return addDays(today, -1);

  const nextDayMatch = s.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDayMatch) {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const target = weekdays.indexOf(nextDayMatch[1]);
    return nextDay(today, target as 0 | 1 | 2 | 3 | 4 | 5 | 6);
  }

  const inTimeMatch = s.match(/^in\s+(\d+)\s+(days?|weeks?|months?)$/);
  if (inTimeMatch) {
    const amount = parseInt(inTimeMatch[1], 10);
    const unit = inTimeMatch[2];
    if (unit.startsWith('day')) return addDays(today, amount);
    if (unit.startsWith('week')) return addWeeks(today, amount);
    if (unit.startsWith('month')) return addMonths(today, amount);
  }

  const shorthandMatch = s.match(/^(\d+)([dwm])$/);
  if (shorthandMatch) {
    const amount = parseInt(shorthandMatch[1], 10);
    const unit = shorthandMatch[2];
    if (unit === 'd') return addDays(today, amount);
    if (unit === 'w') return addWeeks(today, amount);
    if (unit === 'm') return addMonths(today, amount);
  }

  const monthNames = Object.keys(MONTH_MAP).join('|');

  const byMonthDay = s.match(new RegExp(`^by\\s+(${monthNames})\\s+(\\d{1,2})$`));
  if (byMonthDay) {
    const month = MONTH_MAP[byMonthDay[1]];
    const day = parseInt(byMonthDay[2], 10);
    let target = new Date(today.getFullYear(), month, day);
    if (target < today) target = new Date(today.getFullYear() + 1, month, day);
    if (isValid(target) && target.getDate() === day) return startOfDay(target);
  }

  const byMonth = s.match(new RegExp(`^by\\s+(${monthNames})$`));
  if (byMonth) {
    const month = MONTH_MAP[byMonth[1]];
    let target = new Date(today.getFullYear(), month, 1);
    if (month < today.getMonth()) target = new Date(today.getFullYear() + 1, month, 1);
    return lastDayOfMonth(target);
  }

  if (s === 'end of month' || s === 'eom') return lastDayOfMonth(today);

  const monthDay = s.match(new RegExp(`^(${monthNames})\\s+(\\d{1,2})$`));
  if (monthDay) {
    const month = MONTH_MAP[monthDay[1]];
    const day = parseInt(monthDay[2], 10);
    let target = new Date(today.getFullYear(), month, day);
    if (target < today) target = new Date(today.getFullYear() + 1, month, day);
    if (isValid(target) && target.getDate() === day) return startOfDay(target);
  }

  const numeric = s.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (numeric) {
    const month = parseInt(numeric[1], 10) - 1;
    const day = parseInt(numeric[2], 10);
    let target = new Date(today.getFullYear(), month, day);
    if (target < today) target = new Date(today.getFullYear() + 1, month, day);
    if (isValid(target) && target.getMonth() === month && target.getDate() === day) return startOfDay(target);
  }

  return null;
}

// Find a date pattern anywhere in free text, returning the date and the text
// with that fragment removed (so "call mom tomorrow" -> title "call mom").
export function extractDateFromText(text: string): { cleanedText: string; date: Date | null } {
  const monthNames =
    'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec';
  const patterns = [
    /\b(today|tomorrow|yesterday)\b/i,
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\bin\s+\d+\s+(days?|weeks?|months?)\b/i,
    /\b\d+[dwm]\b/i,
    new RegExp(`\\bby\\s+(${monthNames})\\s+\\d{1,2}\\b`, 'i'),
    new RegExp(`\\bby\\s+(${monthNames})\\b`, 'i'),
    new RegExp(`\\b(${monthNames})\\s+\\d{1,2}\\b`, 'i'),
    /\b\d{1,2}[/-]\d{1,2}\b/,
    /\bend\s+of\s+month\b/i,
    /\beom\b/i,
  ];

  let cleanedText = text;
  let foundDate: Date | null = null;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = parseNaturalDate(match[0].trim());
      if (parsed) {
        foundDate = parsed;
        cleanedText = text.replace(pattern, '').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  return { cleanedText, date: foundDate };
}
