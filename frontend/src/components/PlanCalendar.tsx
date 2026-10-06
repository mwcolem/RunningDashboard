import { useMemo } from "react";
import { useDailyMileage } from "../api/client";
import { WEEKDAYS, parseDate, toISO, weekFor } from "../data/plan";
import type { Effort, PlanDay, PlanWeek, TrainingPlan } from "../data/plan";
import type { DailyMileage } from "../types/garmin";

/**
 * Pill styling per cycle label. Unknown labels fall through to the plain pill,
 * so a generated plan can name its cycles whatever the source sheet does.
 */
const CYCLE_PILL: Record<string, string> = {
  BUILD: "",
  BASE: "",
  PEAK: "",
  CUTBACK: "pill-accent",
  RECOVERY: "pill-accent",
  TAPER: "pill-warn",
  RACE: "pill-bad",
  "RACE WEEK": "pill-bad",
};

function monthDay(iso: string): string {
  return parseDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseDate(toIso).getTime() - parseDate(fromIso).getTime()) / 86_400_000);
}

/**
 * A single calendar cell. `state` drives whether it reads as done, live, or
 * upcoming. `actual` is the miles logged that day, or undefined if nothing was
 * run; it is only rendered once `daily` has loaded and the day has arrived.
 */
function DayCell({
  day,
  state,
  actual,
  loaded,
}: {
  day: PlanDay;
  state: "past" | "today" | "future";
  actual?: number;
  loaded: boolean;
}) {
  const rest = day.effort === "rest";
  // A day with no prescribed distance is never judged — it just reports miles.
  const hit = day.targetMi != null && actual != null && actual >= day.targetMi;
  const show = loaded && state !== "future" && (actual != null || day.targetMi != null);

  return (
    <div className={`cal-cell is-${state} eff-${day.effort}`}>
      <div className="cal-date">{parseDate(day.date).getDate()}</div>
      <div className={`cal-work${rest ? " is-rest" : ""}`}>{day.label}</div>
      {show && (
        <div
          className={`cal-act${hit ? " is-hit" : ""}`}
          title={
            actual != null
              ? `Ran ${actual.toFixed(2)} mi${day.targetMi != null ? ` · target ${day.targetMi} mi` : ""}`
              : `Nothing logged · target ${day.targetMi} mi`
          }
        >
          {hit && <span className="cal-act-tick">✓</span>}
          {actual != null ? actual.toFixed(1) : "—"}
        </div>
      )}
    </div>
  );
}

function WeekRow({
  week,
  today,
  daily,
  peakMi,
}: {
  week: PlanWeek;
  today: string;
  daily?: DailyMileage;
  peakMi: number;
}) {
  const isCurrent = today >= week.days[0].date && today <= week.days[6].date;
  const started = week.days[0].date <= today;
  const complete = week.days[6].date < today;

  const actualMi = daily
    ? week.days.reduce((sum, d) => sum + (daily[d.date] ?? 0), 0)
    : 0;
  // Mid-week totals are always short of plan, so only a finished week is judged.
  const hitWeek = complete && actualMi >= week.totalMi;

  return (
    <div className={`cal-row${isCurrent ? " is-current" : ""}`}>
      <div className="cal-wk">
        <div className="cal-wk-n num">{week.week}</div>
        <div className="cal-wk-d">{monthDay(week.start)}</div>
      </div>

      {week.days.map((day) => (
        <DayCell
          key={day.date}
          day={day}
          state={day.date === today ? "today" : day.date < today ? "past" : "future"}
          actual={daily?.[day.date]}
          loaded={daily != null}
        />
      ))}

      <div className="cal-total">
        <div className="num cal-total-n">{week.total}</div>
        <div className="bar thin" style={{ marginTop: 6, width: "100%" }}>
          <i
            style={{
              width: `${(week.totalMi / peakMi) * 100}%`,
              background: week.cycle === "BUILD" ? "var(--accent-deep)" : "var(--fg-faint)",
            }}
          />
        </div>
        {daily && started && (
          <div
            className={`cal-act${hitWeek ? " is-hit" : ""}`}
            title={`Ran ${actualMi.toFixed(2)} mi of ${week.totalMi} planned${complete ? "" : " so far"}`}
          >
            {hitWeek && <span className="cal-act-tick">✓</span>}
            {actualMi.toFixed(1)} mi
          </div>
        )}
      </div>

      <div className="cal-cycle">
        <span className={`pill ${CYCLE_PILL[week.cycle.toUpperCase()] ?? ""}`}>{week.cycle}</span>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  sub,
  last,
}: {
  label: string;
  value: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div style={{ padding: 20, borderRight: last ? "none" : "1px solid var(--line-soft)" }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div className="num" style={{ font: "600 26px/1 var(--font-display)", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && (
        <div style={{ font: "500 11px var(--font-mono)", color: "var(--fg-faint)", marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

const LEGEND: { effort: Effort; label: string }[] = [
  { effort: "easy", label: "Easy" },
  { effort: "speed", label: "Speed" },
  { effort: "hills", label: "Hills" },
  { effort: "long", label: "Long" },
  { effort: "recovery", label: "Recovery" },
  { effort: "race", label: "Race" },
  { effort: "rest", label: "Rest" },
];

/**
 * The training calendar for one plan: summary strip, current-week hero, and the
 * full week-by-week grid with actual mileage from Garmin overlaid. Every plan
 * tab renders through here — the plan module is the only thing that differs.
 */
export default function PlanCalendar({ plan }: { plan: TrainingPlan }) {
  const today = useMemo(() => toISO(new Date()), []);
  const current = weekFor(plan, today);
  const toRace = daysBetween(today, plan.raceDate);
  const done = plan.weeks.filter((w) => w.days[6].date < today).length;

  // Actual mileage only exists up to today, so never ask Garmin past it.
  const { data: daily } = useDailyMileage(
    plan.start,
    today < plan.end ? today : plan.end,
    today >= plan.start,
  );

  return (
    <div className="fade-in" style={{ display: "grid", gap: 16 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">{plan.eyebrow}</div>
          <h1 className="h-1">{plan.title}</h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {toRace > 0 ? "Race day" : toRace === 0 ? "Today" : "Raced"}
          </div>
          <div className="num" style={{ font: "600 20px/1 var(--font-display)" }}>
            {parseDate(plan.raceDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </header>

      <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: 0 }}>
        <SummaryCell
          label="Current week"
          value={current ? `${current.week}` : "—"}
          sub={current ? `of ${plan.weeks.length}` : "outside plan"}
        />
        <SummaryCell
          label="Phase"
          value={current ? current.cycle : "—"}
          sub={current ? `${monthDay(current.start)} – ${monthDay(current.days[6].date)}` : undefined}
        />
        <SummaryCell
          label="This week"
          value={current ? current.total : "—"}
          sub="planned miles"
        />
        <SummaryCell
          label="To race"
          value={toRace > 0 ? `${toRace}` : "0"}
          sub={`days · ${done} of ${plan.weeks.length} weeks done`}
          last
        />
      </div>

      {current && (
        <section className="card">
          <div className="card-hd">
            <h2 className="h-section">This week · {current.cycle}</h2>
            <span className="card-tag">
              Week {current.week} — {current.total} mi
            </span>
          </div>
          <div className="cal-week-hero">
            {current.days.map((day) => (
              <div
                key={day.date}
                className={`hero-day eff-${day.effort}${day.date === today ? " is-today" : ""}${
                  day.date < today ? " is-past" : ""
                }`}
              >
                <div className="eyebrow">{WEEKDAYS[parseDate(day.date).getDay()]}</div>
                <div className="hero-date num">{monthDay(day.date)}</div>
                <div className={`hero-work${day.effort === "rest" ? " is-rest" : ""}`}>{day.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-hd">
          <h2 className="h-section">Full plan</h2>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {LEGEND.map((l) => (
              <span key={l.effort} className={`type-chip eff-${l.effort}`}>
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="cal-scroll">
          <div className="cal">
            <div className="cal-row cal-head">
              <div className="cal-wk">
                <div className="eyebrow">Wk</div>
              </div>
              {WEEKDAYS.map((d) => (
                <div key={d} className="eyebrow" style={{ padding: "0 8px" }}>
                  {d}
                </div>
              ))}
              <div className="eyebrow" style={{ textAlign: "right" }}>
                Total
              </div>
              <div className="eyebrow" style={{ textAlign: "right" }}>
                Cycle
              </div>
            </div>

            {plan.weeks.map((week) => (
              <WeekRow key={week.week} week={week} today={today} daily={daily} peakMi={plan.peakMi} />
            ))}

            {plan.celebration && (
              <div className="cal-celebrate">
                <span className="pill pill-accent">{plan.celebration.label}</span>
                <span style={{ font: "500 11px var(--font-mono)", color: "var(--fg-muted)" }}>
                  {parseDate(plan.celebration.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <p style={{ font: "500 11px/1.6 var(--font-mono)", color: "var(--fg-faint)", marginTop: 16, marginBottom: 0 }}>
          The figure under each past day is what you actually ran, from Garmin. A{" "}
          <span className="cal-act is-hit" style={{ display: "inline-flex" }}>
            <span className="cal-act-tick">✓</span>
          </span>{" "}
          marks a day that met its mileage target — ranges like 10-12 count at the lower end, and
          rest, Active Recovery, and the time-based recovery runs prescribe no distance, so they
          report miles without a verdict. Weekly totals are ticked only once the week is complete.
        </p>

        {plan.notes.map((note) => (
          <p
            key={note}
            style={{ font: "500 11px/1.6 var(--font-mono)", color: "var(--fg-faint)", marginTop: 10, marginBottom: 0 }}
          >
            {note}
          </p>
        ))}
      </section>
    </div>
  );
}
