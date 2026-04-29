import { format, parseISO, differenceInCalendarDays, eachDayOfInterval, isWeekend, isToday as dfnsIsToday } from 'date-fns';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

export function getDaysLeft(endDate: string): number {
  try {
    const diff = differenceInCalendarDays(parseISO(endDate), new Date());
    return Math.max(0, diff);
  } catch {
    return 0;
  }
}

export function getWorkingDaysBetween(start: string, end: string): number {
  try {
    const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
    return days.filter((d) => !isWeekend(d)).length;
  } catch {
    return 0;
  }
}

export function getWorkingDaysArray(start: string, end: string): string[] {
  try {
    const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
    return days.filter((d) => !isWeekend(d)).map((d) => format(d, 'yyyy-MM-dd'));
  } catch {
    return [];
  }
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isToday(dateStr: string): boolean {
  try {
    return dfnsIsToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

export function sprintProgress(startDate: string, endDate: string): number {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const now = new Date();
    const total = differenceInCalendarDays(end, start);
    if (total <= 0) return 100;
    const elapsed = differenceInCalendarDays(now, start);
    const pct = (elapsed / total) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  } catch {
    return 0;
  }
}
