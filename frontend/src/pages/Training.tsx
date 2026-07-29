import { useMemo } from "react";
import { useDailyMileage } from "../api/client";
import {
  CELEBRATION,
  PEAK_MI,
  PLAN,
  PLAN_END,
  PLAN_START,
  RACE_DATE,
  WEEKDAYS,
  parseDate,
  toISO,
  weekFor,
} from "../data/trainingPlan";
import type { Cycle, Effort, PlanDay, PlanWeek } from "../data/trainingPlan";
import type { DailyMileage } from "../types/garmin";

const CYCLE_PILL: Record<Cycle, string> = {
  BUILD: "",
  CUTBACK: "pill-accent",
  TAPER: "pill-warn",
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

function WeekRow({ week, today, daily }: { week: PlanWeek; today: string; daily?: DailyMileage }) {
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
              width: `${(week.totalMi / PEAK_MI) * 100}%`,
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
        <span className={`pill ${CYCLE_PILL[week.cycle]}`}>{week.cycle}</span>
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

export default function Training() {
  const today = useMemo(() => toISO(new Date()), []);
  const current = weekFor(today);
  const toRace = daysBetween(today, RACE_DATE);
  const done = PLAN.filter((w) => w.days[6].date < today).length;

  // Actual mileage only exists up to today, so never ask Garmin past it.
  const { data: daily } = useDailyMileage(
    PLAN_START,
    today < PLAN_END ? today : PLAN_END,
    today >= PLAN_START,
  );

  return (
    <div className="fade-in" style={{ display: "grid", gap: 16 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">50-mile ultramarathon · 24 weeks</div>
          <h1 className="h-1">Training</h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {toRace > 0 ? "Race day" : toRace === 0 ? "Today" : "Raced"}
          </div>
          <div className="num" style={{ font: "600 20px/1 var(--font-display)" }}>
            {parseDate(RACE_DATE).toLocaleDateString("en-US", {
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
          sub={current ? `of ${PLAN.length}` : "outside plan"}
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
          sub={`days · ${done} of ${PLAN.length} weeks done`}
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

            {PLAN.map((week) => (
              <WeekRow key={week.week} week={week} today={today} daily={daily} />
            ))}

            <div className="cal-celebrate">
              <span className="pill pill-accent">{CELEBRATION.label}</span>
              <span style={{ font: "500 11px var(--font-mono)", color: "var(--fg-muted)" }}>
                {parseDate(CELEBRATION.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
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

        <p style={{ font: "500 11px/1.6 var(--font-mono)", color: "var(--fg-faint)", marginTop: 10, marginBottom: 0 }}>
          Plan by Relentless Forward Commotion / Hart Strength &amp; Endurance Coaching. Workouts are
          shifted one day earlier than the source sheet so rest falls on Thursday and Sunday, which
          puts the long run on Friday. Both races stay on Saturday, with the Friday before as rest.
          Weeks 8 and 9 carry the sheet's week 9 and 8 workouts, so the cutback falls during work
          travel.
        </p>
      </section>
    </div>
  );
}
