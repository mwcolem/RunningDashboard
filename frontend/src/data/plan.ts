/**
 * Generic training-plan model.
 *
 * A plan is a list of week rows, each holding a cycle label, seven day cells in
 * calendar order (Sunday → Saturday), and the weekly total exactly as printed.
 * `buildPlan` turns those rows plus a start date into the dated, classified
 * structure the calendar renders.
 *
 * Cells are free text — the label is shown verbatim and everything derived from
 * it (effort colour, mileage target) comes from the two classifiers below. That
 * keeps a transcribed sheet readable next to its source.
 *
 * `scripts/new-plan.mjs` generates a data module in this shape from a TSV.
 */

export type Cycle = string;

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
  /**
   * Miles that count as hitting this day, or null when the cell prescribes no
   * distance — rest, `Active Recovery`, and the time-based recovery runs. Those
   * days show actual mileage but are never marked hit or missed.
   */
  targetMi: number | null;
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

/** One week of a plan, before dates are applied. */
export interface PlanRow {
  cycle: Cycle;
  /** 7 cells, Sunday → Saturday. */
  cells: string[];
  total: string;
}

export interface PlanSpec {
  /** Page heading. */
  title: string;
  /** Kicker above the heading, e.g. "50-mile ultramarathon · 24 weeks". */
  eyebrow: string;
  rows: PlanRow[];
  /** Sunday of week 1, as YYYY-MM-DD. See `startFromEnd`. */
  start: string;
  /** Cell index carrying the week's long run. Default 5 (Friday). */
  longIndex?: number;
  /** Cell index carrying the week's recovery run. Default 6 (Saturday). */
  recoveryIndex?: number;
  /** A cell that falls past the end of the grid, e.g. a celebration day. */
  celebration?: PlanDay | null;
  /** Plan-specific footnotes rendered under the calendar. */
  notes?: string[];
}

/** A built plan: everything the calendar page needs to render itself. */
export interface TrainingPlan {
  title: string;
  eyebrow: string;
  weeks: PlanWeek[];
  /** First and last dates covered by the grid, for range-fetching mileage. */
  start: string;
  end: string;
  /** Last race cell in the plan, falling back to the final day. */
  raceDate: string;
  peakMi: number;
  celebration: PlanDay | null;
  notes: string[];
}

/** Weekday headers, matching the Sunday → Saturday cell order. */
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

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

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/**
 * Sunday of week 1 for a plan of `weeks` weeks whose last cell falls on `end`.
 *
 * This is the anchor a plan is usually written against: the race date is fixed
 * and everything else counts backwards from it, so adding or removing a week
 * shifts the start rather than the finish.
 */
export function startFromEnd(end: string, weeks: number): string {
  return toISO(addDays(parseDate(end), -(weeks * 7 - 1)));
}

/**
 * Race cells. `(race)` is the explicit marker; the distance names are there so
 * a sheet that just says `31 (50K)` or `50 miles` classifies without editing.
 */
const RACE_RE = /\(race\)|\b(?:50K|100K|50 miles|100 miles|marathon|half)\b/i;

function effortFor(cell: string, index: number, longIndex: number, recoveryIndex: number): Effort {
  if (cell === "REST") return "rest";
  if (cell === "CELEBRATE!") return "celebrate";
  if (RACE_RE.test(cell)) return "race";
  if (/speed/i.test(cell)) return "speed";
  if (/hills/i.test(cell)) return "hills";
  if (index === longIndex) return "long";
  if (index === recoveryIndex) return "recovery";
  return "easy";
}

/**
 * Miles a cell asks for, or null if it prescribes none.
 *
 * Time-based cells ("60 minutes", "2.5 hours") lead with a number that is not a
 * distance, so they are excluded first. Range cells ("10-12") resolve to their
 * lower bound: the plan reads as a floor, so 10 miles hits "10-12".
 */
function targetFor(cell: string): number | null {
  if (/hour|minute/i.test(cell)) return null;
  const m = /^(\d+(?:\.\d+)?)/.exec(cell);
  return m ? Number(m[1]) : null;
}

/**
 * Date and classify a plan's rows.
 *
 * Week number and date both come from a row's position in `rows`, so a plan is
 * always numbered 1…n consecutively — to reorder it, move a row and its number
 * follows.
 */
export function buildPlan(spec: PlanSpec): TrainingPlan {
  const longIndex = spec.longIndex ?? 5;
  const recoveryIndex = spec.recoveryIndex ?? 6;
  const start = parseDate(spec.start);

  const weeks: PlanWeek[] = spec.rows.map((row, i) => {
    const weekStart = addDays(start, i * 7);
    return {
      week: i + 1,
      cycle: row.cycle,
      total: row.total,
      totalMi: parseInt(row.total, 10),
      start: toISO(weekStart),
      days: row.cells.map((label, j) => ({
        label,
        effort: effortFor(label, j, longIndex, recoveryIndex),
        date: toISO(addDays(weekStart, j)),
        targetMi: targetFor(label),
      })),
    };
  });

  const last = weeks[weeks.length - 1];
  const races = weeks.flatMap((w) => w.days).filter((d) => d.effort === "race");

  return {
    title: spec.title,
    eyebrow: spec.eyebrow,
    weeks,
    start: weeks[0].days[0].date,
    end: last.days[6].date,
    raceDate: races.length ? races[races.length - 1].date : last.days[6].date,
    peakMi: Math.max(...weeks.map((w) => w.totalMi)),
    celebration: spec.celebration ?? null,
    notes: spec.notes ?? [],
  };
}

/** The week containing `today`, or null if today falls outside the plan. */
export function weekFor(plan: TrainingPlan, today: string): PlanWeek | null {
  return plan.weeks.find((w) => today >= w.days[0].date && today <= w.days[6].date) ?? null;
}
