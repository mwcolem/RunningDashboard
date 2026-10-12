/**
 * 50-mile ultramarathon training plan — 24 weeks.
 * Source: Relentless Forward Commotion / Hart Strength & Endurance Coaching (2019).
 *
 * Cells are transcribed verbatim from the sheet, Monday → Sunday. The plan
 * runs in two layouts:
 *
 *   - Weeks 1–18 shift every workout one day earlier, so rest falls on Sunday
 *     and Thursday and a week runs Sunday → Saturday with the long run on
 *     Friday. These are the weeks as they were actually run.
 *   - Weeks 19–24 follow the sheet's own days: rest on Monday and Friday, long
 *     run on Saturday, recovery run on Sunday, so a week runs Monday → Sunday.
 *     The switch leaves Sun Oct 11, 2026 between weeks 18 and 19 as an extra
 *     rest day (the `gap` on week 19).
 *
 * Because each shifted row is the sheet's Monday → Sunday cells laid on Sunday
 * → Saturday, rows read the same in both layouts — only their dates differ.
 * Both races land on Saturday as the sheet has them, and the 50-miler's
 * `CELEBRATE!` falls on the final Sunday, inside the grid.
 *
 * Weeks 8 and 9 also carry the sheet's week 9 and week 8 workouts respectively,
 * so the cutback falls during work travel, and weeks 18 and 19 likewise carry
 * the sheet's week 19 and week 18 workouts. Only the workouts moved: the plan
 * is still numbered 1…24 in calendar order.
 *
 * The shared model, classifiers, and date maths live in `./plan`.
 */

import { addDays, buildPlan, parseDate, toISO } from "./plan";
import type { Cycle, PlanRow, TrainingPlan } from "./plan";

/**
 * Anchor: week 8 begins on Sun Jul 26, 2026 — fixed by its Tuesday cell being
 * Mon Jul 27, 2026, which the −1 shift moves to that week's first cell. Later
 * weeks follow on from it, plus week 19's one-day gap.
 */
export const ANCHOR_WEEK = 8;
export const ANCHOR_START = "2026-07-26";

/**
 * One row per week, in calendar order. Week number and date both come from a
 * row's position here, so the plan is always numbered 1…24 consecutively — to
 * reorder the plan, move a row and its number follows.
 */
type Row = [cycle: Cycle, cells: string[], total: string, gap?: number];

const ROWS: Row[] = [
  ["BUILD",     ["REST", "6",  "4 (speed)", "6",          "REST", "10-12",     "60 minutes"],         "34"],
  ["BUILD",     ["REST", "6",  "4 (hills)", "6",          "REST", "12-14",     "1 hour 10 minutes"],  "37"],
  ["BUILD",     ["REST", "6",  "5 (speed)", "7",          "REST", "14-16",     "1 hour 10 minutes"],  "41"],
  ["CUTBACK",   ["REST", "4",  "3",         "5",          "REST", "10",        "Active Recovery"],    "22 +AR"],
  ["BUILD",     ["REST", "7",  "5 (hills)", "7",          "REST", "16-18",     "1 hour 20 minutes"],  "45"],
  ["BUILD",     ["REST", "7",  "6 (speed)", "7",          "REST", "16-18",     "1 hour 20 minutes"],  "46"],
  ["BUILD",     ["REST", "7",  "6 (hills)", "7",          "REST", "18-20",     "1 hour 30 minutes"],  "49"],
  // Weeks 8 and 9 carry the sheet's week 9 and 8 workouts respectively: work
  // travel falls on the second of the two, so the cutback is the week missed.
  ["BUILD",     ["REST", "8",  "6 (speed)", "8",          "REST", "22",        "1 hour 45 minutes"],  "54"],
  ["CUTBACK",   ["REST", "5",  "3",         "5",          "REST", "12",        "Active Recovery"],    "25 +AR"],
  ["BUILD",     ["REST", "10", "6 (hills)", "8",          "REST", "12",        "2 hours"],            "58"],
  ["BUILD",     ["REST", "8",  "6 (speed)", "8",          "REST", "24",        "1 hour 45 minutes"],  "56"],
  ["CUTBACK",   ["REST", "6",  "4",         "6",          "REST", "14",        "Active Recovery"],    "28 + AR"],
  ["BUILD",     ["REST", "10", "6 (hills)", "8",          "REST", "22",        "2 hours"],            "58"],
  ["BUILD",     ["REST", "12", "6 (speed)", "10",         "REST", "14",        "2.5 hours"],          "57"],
  ["BUILD",     ["REST", "10", "7 (hills)", "8",          "REST", "26",        "2 hours"],            "63"],
  ["CUTBACK",   ["REST", "7",  "4",         "7",          "REST", "14",        "Active Recovery"],    "32 + AR"],
  ["BUILD",     ["REST", "10", "5",         "8",          "REST", "20",        "3 hours"],            "63"],
  // Weeks 18 and 19 carry the sheet's week 19 and 18 workouts respectively,
  // moving the cutback a week earlier.
  ["CUTBACK",   ["REST", "8",  "4",         "8",          "REST", "14",        "Active Recovery"],    "34 + AR"],
  // From week 19 the weeks run Monday → Sunday, as on the sheet. The gap of 1
  // leaves Sun Oct 11 out of the grid as a rest day between the two layouts.
  ["BUILD",     ["REST", "12", "8",         "10",         "REST", "24",        "1 hour 45 minutes"],  "64", 1],
  ["BUILD",     ["REST", "12", "4",         "6",          "REST", "31 (50K)",  "60 minutes"],         "59"],
  ["BUILD",     ["REST", "14", "8",         "10",         "REST", "16",        "2.5 hours"],          "63"],
  ["TAPER",     ["REST", "10", "6",         "8",          "REST", "18",        "60 minutes"],         "48"],
  ["TAPER",     ["REST", "8",  "4",         "8",          "REST", "10",        "60 minutes"],         "36"],
  ["RACE WEEK", ["REST", "4",  "REST",      "30 minutes", "REST", "50 miles",  "CELEBRATE!"],         "57"],
];

const rows: PlanRow[] = ROWS.map(([cycle, cells, total, gap]) => ({ cycle, cells, total, gap }));

export const ULTRA_50: TrainingPlan = buildPlan({
  title: "Training",
  eyebrow: "50-mile ultramarathon · 24 weeks",
  rows,
  start: toISO(addDays(parseDate(ANCHOR_START), (1 - ANCHOR_WEEK) * 7)),
  notes: [
    "Plan by Relentless Forward Commotion / Hart Strength & Endurance Coaching. Weeks 1–18 are " +
      "shifted one day earlier than the source sheet, so rest falls on Sunday and Thursday and the " +
      "long run on Friday. From week 19 the plan follows the sheet's own days — rest on Monday and " +
      "Friday, long run on Saturday — with Sun Oct 11 as an extra rest day between the two layouts. " +
      "Weeks 8 and 9 carry the sheet's week 9 and 8 workouts, so the cutback falls during work travel.",
  ],
});
