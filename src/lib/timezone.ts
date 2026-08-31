/**
 * Timezone utilities for Bangladesh (Asia/Dhaka, UTC+6)
 * All times are stored in UTC in the database. Display them in Dhaka time.
 */

const DHAKA_TZ = "Asia/Dhaka";

/**
 * Get a Date object representing a specific date in Asia/Dhaka timezone.
 * Returns the UTC Date that corresponds to the start of the day in Dhaka.
 *
 * For example, "2026-09-05" in Dhaka = "2026-09-04T18:00:00.000Z" in UTC
 */
export function dhakaDateToUTC(dhakaDateString: string): Date {
  return new Date(`${dhakaDateString}T00:00:00.000Z`);
}

/**
 * Convert a UTC Date to a Date object representing the same instant
 * in Asia/Dhaka timezone. Returns a Date whose UTC fields represent
 * the Dhaka local time.
 */
export function utcToDhaka(utcDate: Date): Date {
  // Get Dhaka time string
  const dhakaString = utcDate.toLocaleString("en-US", {
    timeZone: DHAKA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Parse "MM/DD/YYYY, HH:MM:SS" format
  const match = dhakaString.match(/(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return utcDate;

  const [, mm, dd, yyyy, hh, min, ss] = match;
  // Return a Date with these values as if they were UTC
  return new Date(Date.UTC(
    parseInt(yyyy),
    parseInt(mm) - 1,
    parseInt(dd),
    parseInt(hh) === 24 ? 0 : parseInt(hh),
    parseInt(min),
    parseInt(ss)
  ));
}

/**
 * Get the YYYY-MM-DD date string in Dhaka timezone
 */
export function getDhakaDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = d.toLocaleDateString("en-CA", { timeZone: DHAKA_TZ });
  return parts; // Returns YYYY-MM-DD
}

/**
 * Get the start of day (00:00:00) in Dhaka timezone as a UTC Date
 */
export function startOfDayDhaka(date: Date | string): Date {
  const dhakaDateString = getDhakaDateString(date);
  return dhakaDateToUTC(dhakaDateString);
}

/**
 * Get the end of day (23:59:59) in Dhaka timezone as a UTC Date
 */
export function endOfDayDhaka(date: Date | string): Date {
  const start = startOfDayDhaka(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Get today's date in Dhaka timezone (YYYY-MM-DD)
 */
export function getTodayDhaka(): string {
  return getDhakaDateString(new Date());
}

/**
 * Format a UTC Date as a Dhaka timezone date string
 */
export function formatDhakaDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    timeZone: DHAKA_TZ,
    ...options,
  });
}

/**
 * Format a UTC Date as a Dhaka timezone time string (e.g., "05:00 PM")
 */
export function formatDhakaTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    timeZone: DHAKA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a UTC Date as a Dhaka timezone datetime string
 */
export function formatDhakaDateTime(date: Date | string): string {
  return `${formatDhakaDate(date, { weekday: "short", day: "numeric", month: "short" })} at ${formatDhakaTime(date)}`;
}

/**
 * Get the day of week in Dhaka timezone (0=Sunday, 6=Saturday)
 */
export function getDhakaDayOfWeek(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const dayString = d.toLocaleDateString("en-US", {
    timeZone: DHAKA_TZ,
    weekday: "short",
  });
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[dayString] ?? d.getDay();
}

/**
 * Get array of date strings for next N days in Dhaka timezone
 */
export function getNextNDaysDhaka(n: number): Array<{ date: string; label: string; dayOfWeek: number }> {
  const days: Array<{ date: string; label: string; dayOfWeek: number }> = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const future = new Date(now);
    future.setDate(now.getDate() + i);

    // Get the Dhaka date string for this UTC date
    const dhakaDateString = getDhakaDateString(future);
    // Calculate Dhaka day of week
    const tempDate = new Date(future.toLocaleString("en-US"));
    const dhakaDow = getDhakaDayOfWeek(future);

    const dayLabel = future.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: DHAKA_TZ,
    });

    days.push({
      date: dhakaDateString,
      label: dayLabel,
      dayOfWeek: dhakaDow,
    });
  }

  return days;
}

/**
 * Check if a date string is today in Dhaka timezone
 */
export function isTodayDhaka(date: Date | string): boolean {
  return getDhakaDateString(date) === getTodayDhaka();
}

/**
 * Check if a date string is in the past (before today in Dhaka timezone)
 */
export function isPastDateDhaka(date: Date | string): boolean {
  return getDhakaDateString(date) < getTodayDhaka();
}

/**
 * Check if a date string is in the future (after today in Dhaka timezone)
 */
export function isFutureDateDhaka(date: Date | string): boolean {
  return getDhakaDateString(date) > getTodayDhaka();
}

/**
 * Get array of date strings between two dates in Dhaka timezone
 */
export function getDateRangeDhaka(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = dhakaDateToUTC(startDate);
  const end = dhakaDateToUTC(endDate);

  const current = new Date(start);
  while (current <= end) {
    dates.push(getDhakaDateString(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Convert a YYYY-MM-DD string to a Date for use in HTML date inputs
 * Treats the string as a Dhaka date
 */
export function dhakaDateStringToDate(dateString: string): Date {
  return dhakaDateToUTC(dateString);
}
