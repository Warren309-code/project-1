/**
 * countdown.test.js — plain-Node test harness, zero dependencies.
 *
 * Run with: `node assets/js/countdown.test.js` (or `npm test`).
 * No framework, no build step — matches the project's "lightweight, easy to
 * merge" constraint. Exits non-zero on any failure so it's CI-friendly too.
 */
import { computeEventTarget, formatEventDateLine, isLiveNow, msUntilStart, weekdayName } from "./webinar-countdown.js";

const DEFAULT_CONFIG = {
  EVENT_WEEKDAY: 3, // Wednesday
  EVENT_HOUR: 19,
  EVENT_MINUTE: 0,
  ROLLOVER_MINUTES_AFTER_START: 30,
  EVENT_TIMEZONE: "Europe/London",
};

let failures = 0;
let count = 0;

function assertEqual(label, actual, expected) {
  count++;
  const a = actual instanceof Date ? actual.toISOString() : actual;
  const e = expected instanceof Date ? expected.toISOString() : expected;
  if (a !== e) {
    failures++;
    console.error(`✗ FAIL  ${label}\n    expected: ${e}\n    actual:   ${a}`);
  } else {
    console.log(`✓ pass  ${label}`);
  }
}

// ---------------------------------------------------------------------
// 1. Basic case: a Monday in late-August 2026 (BST, UTC+1). This is the
//    real "today" this project was scoped on — cross-checked by hand
//    against what the live reference funnel showed for the same week
//    ("This Wednesday, 2nd September · 7:00 PM UK Time").
// ---------------------------------------------------------------------
{
  const now = new Date("2026-08-31T09:00:00Z"); // Monday
  const target = computeEventTarget(now, DEFAULT_CONFIG);
  assertEqual("Mon Aug 31 2026 -> target date", `${target.year}-${String(target.month).padStart(2,"0")}-${String(target.day).padStart(2,"0")}`, "2026-09-02");
  assertEqual("Mon Aug 31 2026 -> target startUtc (BST, 19:00 local = 18:00Z)", target.startUtc, new Date("2026-09-02T18:00:00.000Z"));
  assertEqual("Mon Aug 31 2026 -> label", target.label, "this");
  assertEqual("Mon Aug 31 2026 -> formatted date line", formatEventDateLine(target, DEFAULT_CONFIG), "This Wednesday, 2nd September · 7:00 PM UK Time");
}

// ---------------------------------------------------------------------
// 2. On event day, before start: still "this" week, countdown still ticking.
// ---------------------------------------------------------------------
{
  const now = new Date("2026-09-02T17:00:00Z"); // Wed, 18:00 BST — 1h before start
  const target = computeEventTarget(now, DEFAULT_CONFIG);
  assertEqual("Wed 18:00 BST (pre-event) -> label", target.label, "this");
  assertEqual("Wed 18:00 BST (pre-event) -> msUntilStart", msUntilStart(target, now), 60 * 60 * 1000);
  assertEqual("Wed 18:00 BST (pre-event) -> isLiveNow", isLiveNow(target, now), false);
}

// ---------------------------------------------------------------------
// 3. Mid-event, inside the 30-minute grace window: still advertises today,
//    and reads as "live" — this is the window the spec calls out explicitly.
// ---------------------------------------------------------------------
{
  const now = new Date("2026-09-02T18:15:00Z"); // Wed, 19:15 BST — 15 min into event
  const target = computeEventTarget(now, DEFAULT_CONFIG);
  assertEqual("Wed 19:15 BST (mid-event) -> label", target.label, "this");
  assertEqual("Wed 19:15 BST (mid-event) -> isLiveNow", isLiveNow(target, now), true);
}

// ---------------------------------------------------------------------
// 4. Just past the 7:30 PM rollover: flips to next week, per spec exactly.
// ---------------------------------------------------------------------
{
  const now = new Date("2026-09-02T18:31:00Z"); // Wed, 19:31 BST — 1 min past rollover
  const target = computeEventTarget(now, DEFAULT_CONFIG);
  assertEqual("Wed 19:31 BST (past rollover) -> target date", `${target.year}-${String(target.month).padStart(2,"0")}-${String(target.day).padStart(2,"0")}`, "2026-09-09");
  assertEqual("Wed 19:31 BST (past rollover) -> label", target.label, "next");
  assertEqual("Wed 19:31 BST (past rollover) -> formatted date line", formatEventDateLine(target, DEFAULT_CONFIG), "Next Wednesday, 9th September · 7:00 PM UK Time");
}

// ---------------------------------------------------------------------
// 5. DST boundary — UK clocks go back 25 Oct 2026 at 02:00 BST -> 01:00 GMT.
//    Two "now" values either side of that Sunday must each resolve to the
//    correct UTC instant for their own week's Wednesday, with NO code
//    change and NO hardcoded offset. This is the case CLAUDE.md explicitly
//    calls out as the thing most likely to break silently if done wrong.
// ---------------------------------------------------------------------
{
  const beforeTransition = new Date("2026-10-19T09:00:00Z"); // Mon, still BST
  const targetBefore = computeEventTarget(beforeTransition, DEFAULT_CONFIG);
  assertEqual("DST: Mon 19 Oct (BST) -> target date", `${targetBefore.year}-${String(targetBefore.month).padStart(2,"0")}-${String(targetBefore.day).padStart(2,"0")}`, "2026-10-21");
  assertEqual("DST: Mon 19 Oct (BST) -> startUtc is 18:00Z (19:00 BST)", targetBefore.startUtc, new Date("2026-10-21T18:00:00.000Z"));

  const afterTransition = new Date("2026-10-26T09:00:00Z"); // Mon, now GMT
  const targetAfter = computeEventTarget(afterTransition, DEFAULT_CONFIG);
  assertEqual("DST: Mon 26 Oct (GMT) -> target date", `${targetAfter.year}-${String(targetAfter.month).padStart(2,"0")}-${String(targetAfter.day).padStart(2,"0")}`, "2026-10-28");
  assertEqual("DST: Mon 26 Oct (GMT) -> startUtc is 19:00Z (19:00 GMT, no +1 offset anymore)", targetAfter.startUtc, new Date("2026-10-28T19:00:00.000Z"));
}

// ---------------------------------------------------------------------
// 6. weekdayName sanity check, used by the urgency strip.
// ---------------------------------------------------------------------
assertEqual("weekdayName(3)", weekdayName(3), "Wednesday");

console.log(`\n${count - failures}/${count} passed.`);
if (failures > 0) {
  console.error(`${failures} test(s) FAILED.`);
  process.exit(1);
}
