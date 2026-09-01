/**
 * countdown.js — pure event-date logic. No DOM access, no side effects.
 *
 * This module is intentionally isolated from rendering (see webinar-register.js) so it's
 * trivially unit-testable (countdown.test.js) and trivially portable into
 * another codebase — it's plain JS, zero dependencies.
 *
 * The one rule that matters: "UK time" is the IANA zone Europe/London, which
 * is UTC+0 (GMT) in winter and UTC+1 (BST) in summer. We never hardcode an
 * offset — every conversion below asks Intl for the real offset at the
 * instant in question, so this stays correct across the March/October
 * DST transitions with no code change.
 */

const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/**
 * Returns the IANA-timezone offset, in minutes, that should be ADDED to a
 * local wall-clock time in `timeZone` to get UTC (i.e. UTC = wallClockAsUTC -
 * offset). Computed by asking Intl what the wall-clock time in `timeZone` is
 * at a given real UTC instant, then diffing.
 */
function getTimeZoneOffsetMinutes(utcMillis, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = {};
  for (const p of dtf.formatToParts(new Date(utcMillis))) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  // Treat the timeZone's wall-clock reading as if it were itself a UTC
  // timestamp, then compare to the real UTC instant we asked about.
  const asIfUtc = Date.UTC(
    +parts.year, +parts.month - 1, +parts.day,
    +parts.hour, +parts.minute, +parts.second
  );
  return (asIfUtc - utcMillis) / 60000;
}

/**
 * Converts a wall-clock date/time in `timeZone` (e.g. "19:00 in
 * Europe/London on 2 Sept 2026") into the real UTC Date it represents.
 * Two-pass correction handles the (extremely rare, and for this project's
 * fixed 19:00/19:30 event times, never-occurring) case where the initial
 * guess lands on the other side of a DST transition than the target itself.
 */
function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset1 = getTimeZoneOffsetMinutes(guessUtc, timeZone);
  let utc = guessUtc - offset1 * 60000;
  const offset2 = getTimeZoneOffsetMinutes(utc, timeZone);
  if (offset2 !== offset1) {
    utc = guessUtc - offset2 * 60000;
  }
  return new Date(utc);
}

/**
 * Returns { year, month, day, hour, minute, second, weekday } describing
 * `date` as wall-clock values in `timeZone`. `weekday` is 0=Sun..6=Sat.
 */
function getZonedParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const year = +parts.year, month = +parts.month, day = +parts.day;
  // Calendar-only math (no timezone involved) to get the weekday index —
  // safe once we already have the correct local Y/M/D.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return {
    year, month, day,
    hour: +parts.hour, minute: +parts.minute, second: +parts.second,
    weekday,
  };
}

function addDays(year, month, day, days) {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/**
 * The core function. Given `now` (a real Date) and the event config, returns
 * the event occurrence that should currently be advertised on the page:
 *
 *   { startUtc: Date, rolloverUtc: Date, label: "this" | "next",
 *     year, month, day, weekday }
 *
 * Rule: always the next upcoming Wednesday (or whichever EVENT_WEEKDAY) at
 * EVENT_HOUR:EVENT_MINUTE — EXCEPT that if "now" is on event day itself and
 * at or past the rollover point (EVENT start + ROLLOVER_MINUTES_AFTER_START),
 * we've already moved past this week's grace window, so we advertise next
 * week's occurrence instead.
 */
export function computeEventTarget(now, config) {
  const tz = config.EVENT_TIMEZONE;
  const nowParts = getZonedParts(now, tz);

  const daysUntil = (config.EVENT_WEEKDAY - nowParts.weekday + 7) % 7;
  let target = daysUntil === 0
    ? { year: nowParts.year, month: nowParts.month, day: nowParts.day }
    : addDays(nowParts.year, nowParts.month, nowParts.day, daysUntil);

  let startUtc = zonedTimeToUtc(target.year, target.month, target.day, config.EVENT_HOUR, config.EVENT_MINUTE, tz);
  let rolloverUtc = addMinutesZoned(target, config.EVENT_HOUR, config.EVENT_MINUTE, config.ROLLOVER_MINUTES_AFTER_START, tz);

  // daysUntil is always 0..6, so every occurrence found so far falls inside
  // the current 7-day cycle ("this" week) — the only way to become "next" is
  // the rollover push immediately below.
  let label = "this";

  if (daysUntil === 0 && now.getTime() >= rolloverUtc.getTime()) {
    // Today IS event day, and we're past the grace window — push to next week.
    target = addDays(nowParts.year, nowParts.month, nowParts.day, 7);
    startUtc = zonedTimeToUtc(target.year, target.month, target.day, config.EVENT_HOUR, config.EVENT_MINUTE, tz);
    rolloverUtc = addMinutesZoned(target, config.EVENT_HOUR, config.EVENT_MINUTE, config.ROLLOVER_MINUTES_AFTER_START, tz);
    label = "next";
  }

  return {
    startUtc,
    rolloverUtc,
    label,
    year: target.year,
    month: target.month,
    day: target.day,
    weekday: config.EVENT_WEEKDAY,
  };
}

function addMinutesZoned(dateYmd, hour, minute, minutesToAdd, timeZone) {
  const totalMinutes = hour * 60 + minute + minutesToAdd;
  const h = Math.floor(totalMinutes / 60) % 24;
  const overflowDays = Math.floor(totalMinutes / (24 * 60));
  const m = totalMinutes % 60;
  const d = overflowDays > 0 ? addDays(dateYmd.year, dateYmd.month, dateYmd.day, overflowDays) : dateYmd;
  return zonedTimeToUtc(d.year, d.month, d.day, h, m, timeZone);
}

/** Milliseconds remaining until `target.startUtc`, floored at 0. */
export function msUntilStart(target, now) {
  return Math.max(0, target.startUtc.getTime() - now.getTime());
}

/** True while `now` is between event start and the rollover cutoff (live). */
export function isLiveNow(target, now) {
  const t = now.getTime();
  return t >= target.startUtc.getTime() && t < target.rolloverUtc.getTime();
}

export function weekdayName(weekdayIndex) {
  return WEEKDAY_NAMES[weekdayIndex];
}

const ORDINAL_SUFFIX = (n) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Human-readable date line, e.g. "This Wednesday, 2nd September · 7:00 PM UK Time".
 */
export function formatEventDateLine(target, config) {
  const weekday = weekdayName(target.weekday);
  const dayNum = target.day;
  const monthName = MONTH_NAMES[target.month - 1];
  const labelWord = target.label === "this" ? "This" : "Next";
  const hour12 = ((config.EVENT_HOUR + 11) % 12) + 1;
  const ampm = config.EVENT_HOUR >= 12 ? "PM" : "AM";
  const minuteStr = String(config.EVENT_MINUTE).padStart(2, "0");
  return `${labelWord} ${weekday}, ${dayNum}${ORDINAL_SUFFIX(dayNum)} ${monthName} · ${hour12}:${minuteStr} ${ampm} UK Time`;
}

/** Breaks a millisecond duration into whole days/hours/minutes/seconds. */
export function breakdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export const _internal = { zonedTimeToUtc, getZonedParts, getTimeZoneOffsetMinutes };
