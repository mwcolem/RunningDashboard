import { useMemo } from "react";
import {
  CELEBRATION,
  PEAK_MI,
  PLAN,
  RACE_DATE,
  WEEKDAYS,
  parseDate,
  toISO,
  weekFor,
} from "../data/trainingPlan";
import type { Cycle, Effort, PlanDay, PlanWeek } from "../data/trainingPlan";

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

/** A single calendar cell. `state` drives whether it reads as done, live, or upcoming. */
function DayCell({ day, state }: { day: PlanDay; state: "past" | "today" | "future" }) {
  const rest = day.effort === "rest";
  return (
    <div className={`cal-cell is-${state} eff-${day.effort}`}>
      <div className="cal-date">{parseDate(day.date).getDate()}</div>
      <div className={`cal-work${rest ? " is-rest" : ""}`}>{day.label}</div>
    </div>
  );
}

function WeekRow({ week, today }: { week: PlanWeek; today: string }) {
  const isCurrent = today >= week.days[0].date && today <= week.days[6].date;

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
              <WeekRow key={week.week} week={week} today={today} />
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
