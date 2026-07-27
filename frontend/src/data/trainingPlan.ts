/**
 * 50-mile ultramarathon training plan — 24 weeks.
 * Source: Relentless Forward Commotion / Hart Strength & Endurance Coaching (2019).
 *
 * Cells are transcribed verbatim from the sheet, then shifted one day earlier
 * so the plan's two REST days land on Thursday and Sunday rather than Monday
 * and Friday. That uniform −1 shift means a plan week runs Sunday → Saturday,
 * so `cells` below is already in calendar order: index 0 is Sunday, index 6 is
 * Saturday. The long run consequently sits on Friday.
 *
 * The two race weeks are the deviations — races stay on Saturday rather than
 * being shifted onto Friday, and the freed Friday becomes a race-eve rest day:
 *
 *   - Week 20 (tune-up 50K): the sheet's Sunday recovery run is displaced by
 *     the race and dropped rather than pushed into week 21, so the weekly total
 *     is 53 rather than the sheet's 59.
 *   - Week 24 (the 50-miler): nothing is dropped; the sheet's `CELEBRATE!` cell
 *     spills past the end of the grid — see CELEBRATION.
 */

export type Cycle = "BUILD" | "CUTBACK" | "TAPER" | "RACE WEEK";

export type Effort =
  | "rest"
  | "easy"
  | "speed"
  | "hills"
  | "long"
  | "recovery"
  | "race"
  | "celebrate";

export interface PlanDay {
  /** Cell text exactly as printed in the source plan. */
  label: string;
  effort: Effort;
  /** Calendar date this cell falls on, as YYYY-MM-DD. */
  date: string;
}

export interface PlanWeek {
  week: number;
  cycle: Cycle;
  /** Weekly total exactly as printed ("34", "25 +AR"). */
  total: string;
  /** Leading number of `total`, for sizing the volume bar. */
  totalMi: number;
  /** 7 days, Sunday → Saturday. */
  days: PlanDay[];
  /** Sunday of this week, as YYYY-MM-DD. */
  start: string;
}

/**
 * Anchor: the 8th calendar slot begins on Sun Jul 26, 2026 — fixed by week 8's
 * Tuesday cell being Mon Jul 27, 2026, which the −1 shift moves to that slot's
 * first cell.
 *
 * Dates come from a row's position in ROWS, not its `week` number, so the two
 * can diverge where the plan is reordered (see the 8/9 swap below).
 */
export const ANCHOR_SLOT = 7;
export const ANCHOR_START = "2026-07-26";

/** Weekday headers, matching the shifted Sunday → Saturday cell order. */
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Row = [week: number, cycle: Cycle, cells: string[], total: string];

const ROWS: Row[] = [
  [1,  "BUILD",     ["REST", "6",  "4 (speed)", "6",          "REST", "10-12",     "60 minutes"],         "34"],
  [2,  "BUILD",     ["REST", "6",  "4 (hills)", "6",          "REST", "12-14",     "1 hour 10 minutes"],  "37"],
  [3,  "BUILD",     ["REST", "6",  "5 (speed)", "7",          "REST", "14-16",     "1 hour 10 minutes"],  "41"],
  [4,  "CUTBACK",   ["REST", "4",  "3",         "5",          "REST", "10",        "Active Recovery"],    "22 +AR"],
  [5,  "BUILD",     ["REST", "7",  "5 (hills)", "7",          "REST", "16-18",     "1 hour 20 minutes"],  "45"],
  [6,  "BUILD",     ["REST", "7",  "6 (speed)", "7",          "REST", "16-18",     "1 hour 20 minutes"],  "46"],
  [7,  "BUILD",     ["REST", "7",  "6 (hills)", "7",          "REST", "18-20",     "1 hour 30 minutes"],  "49"],
  // Weeks 8 and 9 are swapped against the sheet: work travel falls on the
  // second of the two, so the cutback is the week that gets missed.
  [9,  "BUILD",     ["REST", "8",  "6 (speed)", "8",          "REST", "22",        "1 hour 45 minutes"],  "54"],
  [8,  "CUTBACK",   ["REST", "5",  "3",         "5",          "REST", "12",        "Active Recovery"],    "25 +AR"],
  [10, "BUILD",     ["REST", "10", "6 (hills)", "8",          "REST", "12",        "2 hours"],            "58"],
  [11, "BUILD",     ["REST", "8",  "6 (speed)", "8",          "REST", "24",        "1 hour 45 minutes"],  "56"],
  [12, "CUTBACK",   ["REST", "6",  "4",         "6",          "REST", "14",        "Active Recovery"],    "28 + AR"],
  [13, "BUILD",     ["REST", "10", "6 (hills)", "8",          "REST", "22",        "2 hours"],            "58"],
  [14, "BUILD",     ["REST", "12", "6 (speed)", "10",         "REST", "14",        "2.5 hours"],          "57"],
  [15, "BUILD",     ["REST", "10", "7 (hills)", "8",          "REST", "26",        "2 hours"],            "63"],
  [16, "CUTBACK",   ["REST", "7",  "4",         "7",          "REST", "14",        "Active Recovery"],    "32 + AR"],
  [17, "BUILD",     ["REST", "10", "5",         "8",          "REST", "20",        "3 hours"],            "63"],
  [18, "BUILD",     ["REST", "12", "8",         "10",         "REST", "24",        "1 hour 45 minutes"],  "64"],
  [19, "CUTBACK",   ["REST", "8",  "4",         "8",          "REST", "14",        "Active Recovery"],    "34 + AR"],
  // 50K pinned to Saturday; the sheet's Friday slot becomes rest and its
  // Sunday recovery run is dropped (total 59 → 53).
  [20, "BUILD",     ["REST", "12", "4",         "6",          "REST", "REST",      "31 (50K)"],           "53"],
  [21, "BUILD",     ["REST", "14", "8",         "10",         "REST", "16",        "2.5 hours"],          "63"],
  [22, "TAPER",     ["REST", "10", "6",         "8",          "REST", "18",        "60 minutes"],         "48"],
  [23, "TAPER",     ["REST", "8",  "4",         "8",          "REST", "10",        "60 minutes"],         "36"],
  // Race pinned to Saturday; the sheet's Friday long-run slot becomes rest.
  [24, "RACE WEEK", ["REST", "4",  "REST",      "30 minutes", "REST", "REST",      "50 miles"],           "57"],
];

/** Local-midnight Date from YYYY-MM-DD. Avoids the UTC shift of `new Date(str)`. */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function effortFor(cell: string, index: number): Effort {
  if (cell === "REST") return "rest";
  if (cell === "CELEBRATE!") return "celebrate";
  if (/50 miles|50K/.test(cell)) return "race";
  if (/speed/.test(cell)) return "speed";
  if (/hills/.test(cell)) return "hills";
  if (index === 5) return "long";
  if (index === 6) return "recovery";
  return "easy";
}

const anchor = parseDate(ANCHOR_START);

export const PLAN: PlanWeek[] = ROWS.map(([week, cycle, cells, total], slot) => {
  const start = addDays(anchor, (slot - ANCHOR_SLOT) * 7);
  return {
    week,
    cycle,
    total,
    totalMi: parseInt(total, 10),
    start: toISO(start),
    days: cells.map((label, i) => ({
      label,
      effort: effortFor(label, i),
      date: toISO(addDays(start, i)),
    })),
  };
});

/** Race day — the 50-mile cell in the final week. Saturday by design. */
export const RACE_DATE =
  PLAN[PLAN.length - 1].days.find((d) => d.effort === "race")?.date ?? ANCHOR_START;

/** The sheet's `CELEBRATE!` cell, pushed past the end of the grid by the Saturday race. */
export const CELEBRATION: PlanDay = {
  label: "CELEBRATE!",
  effort: "celebrate",
  date: toISO(addDays(parseDate(RACE_DATE), 1)),
};

export const PEAK_MI = Math.max(...PLAN.map((w) => w.totalMi));

/** The week containing `today`, or null if today falls outside the plan. */
export function weekFor(today: string): PlanWeek | null {
  return PLAN.find((w) => today >= w.days[0].date && today <= w.days[6].date) ?? null;
}
