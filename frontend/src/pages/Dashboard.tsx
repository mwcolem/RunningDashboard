import { useMemo } from "react";
import {
  useTrainingReadiness,
  useTrainingStatus,
  useRacePredictions,
  useMileageSummary,
  useGoals,
  useActivities,
  useShoes,
} from "../api/client";
import ReadinessRing from "../components/ReadinessRing";
import WeeklyBars, { type BarData } from "../components/WeeklyBars";
import { raceTime } from "../utils/fmt";
import type { Activity, Goal, Shoe } from "../types/garmin";

const M_PER_MI = 1609.344;

function deriveType(a: Activity): string {
  const distMi = a.distance / M_PER_MI;
  const secPerMi = M_PER_MI / (a.averageSpeed || 1);
  if (distMi > 10) return "long";
  if (secPerMi < 450) return "tempo";
  return "easy";
}

function computeWeekBars(activities: Activity[]): BarData[] {
  const today = new Date();
  const daysFromMon = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMon);
  weekStart.setHours(0, 0, 0, 0);

  const dayMap: Record<string, { mi: number; kind: string }> = {};
  for (const a of activities) {
    const d = new Date(a.startTimeLocal);
    if (d >= weekStart) {
      const key = d.toISOString().slice(0, 10);
      const existing = dayMap[key];
      const m = a.distance / M_PER_MI;
      dayMap[key] = { mi: (existing?.mi ?? 0) + m, kind: existing?.kind ?? deriveType(a) };
    }
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const entry = dayMap[key];
    const isFuture = d > today;
    return {
      day: dayNames[i],
      mi: entry?.mi ?? 0,
      kind: entry?.kind ?? "easy",
      projected: isFuture,
    };
  });
}

function weekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

const SHOE_COLORS = [
  "oklch(0.72 0.18 255)",
  "oklch(0.78 0.18 55)",
  "oklch(0.78 0.16 125)",
  "oklch(0.72 0.22 340)",
  "oklch(0.78 0.04 240)",
  "oklch(0.65 0.12 180)",
];

function RecentShoeRow({ shoe, rank, color }: { shoe: Shoe; rank: number; color: string }) {
  const overLimit = shoe.max_mi !== null && shoe.total_mi >= shoe.max_mi;
  const pct = shoe.max_mi ? (shoe.total_mi / shoe.max_mi) * 100 : null;
  const lastUsed = shoe.last_used ? new Date(shoe.last_used) : null;
  const daysAgo = lastUsed ? Math.round((Date.now() - lastUsed.getTime()) / 86_400_000) : null;
  const barBg = overLimit ? "var(--bad)" : pct !== null && pct >= 80 ? "var(--warn)" : color;
  const badgeLabel = rank === 0 ? "Daily driver" : "2nd pair";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", padding: "10px 8px", borderRadius: 8 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
          <span style={{ font: "500 13px var(--font-ui)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shoe.name}</span>
          <span className="pill pill-accent" style={{ fontSize: 10, whiteSpace: "nowrap" }}>{badgeLabel}</span>
        </div>
        <div style={{ font: "500 11px var(--font-mono)", color: "var(--fg-faint)" }}>
          {daysAgo === 0 ? "last run today" : daysAgo === 1 ? "last run yesterday" : daysAgo != null ? `last run ${daysAgo}d ago` : ""}
        </div>
        {pct !== null && (
          <div className="bar thin" style={{ marginTop: 6, width: "100%" }}>
            <i style={{ width: `${Math.min(100, pct)}%`, background: barBg }} />
          </div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="num" style={{ font: "600 18px/1 var(--font-display)", color: overLimit ? "var(--bad)" : "var(--fg)" }}>
          {shoe.total_mi.toFixed(0)}
        </div>
        <div style={{ font: "500 10px var(--font-mono)", color: "var(--fg-faint)" }}>
          {shoe.max_mi != null ? `/ ${shoe.max_mi} mi` : "mi"}
        </div>
      </div>
    </div>
  );
}


function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
    </span>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const pct = Math.min(100, (goal.current_mi / goal.target_mi) * 100);
  const done = pct >= 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{goal.name}</span>
        <div className="num" style={{ font: "500 12px var(--font-mono)", color: "var(--fg-muted)", whiteSpace: "nowrap", marginLeft: 8 }}>
          {goal.current_mi.toFixed(1)} / {goal.target_mi} mi
        </div>
      </div>
      <div className="bar">
        <i style={{ width: `${pct}%`, background: done ? "var(--good)" : "var(--accent-deep)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--fg-faint)" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>{goal.period}</span>
        <span className="num">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function SkeletonBox({ h, style }: { h: number; style?: React.CSSProperties }) {
  return <div className="skeleton-box" style={{ height: h, ...style }} />;
}

export default function Dashboard() {
  const readiness = useTrainingReadiness();
  const trainingStatus = useTrainingStatus();
  const racePreds = useRacePredictions();
  const mileage = useMileageSummary();
  const goals = useGoals();
  const shoes = useShoes();
  const recentActivities = useActivities(0, 20);

  const score = readiness.data?.score ?? 0;
  const level = readiness.data?.level?.replace(/_/g, " ") ?? "";
  const vo2Max = trainingStatus.data?.mostRecentVO2Max?.generic?.vo2MaxPreciseValue;
  const fitnessAge = trainingStatus.data?.mostRecentVO2Max?.generic?.fitnessAge;
  const statusPhrase = trainingStatus.data?.latestTrainingStatusData?.trainingStatusFeedbackPhrase
    ?.replace(/_/g, " ")
    ?.toLowerCase()
    ?.replace(/^\w/, (c) => c.toUpperCase());

  const predictions = racePreds.data
    ? [
        { label: "5K",          time: racePreds.data.time5K },
        { label: "10K",         time: racePreds.data.time10K },
        { label: "Half Marathon", time: racePreds.data.timeHalfMarathon },
        { label: "Marathon",    time: racePreds.data.timeMarathon },
      ].filter((p) => p.time != null)
    : [];
  const weekMi = mileage.data?.week_mi ?? 0;
  const weekGoal = goals.data?.find((g) => g.period === "week");
  const weekTarget = weekGoal?.target_mi ?? Math.max(Math.ceil(weekMi * 1.2), 30);
  const weekPct = Math.min(100, weekMi > 0 ? (weekMi / weekTarget) * 100 : 0);

  const weekBars = useMemo<BarData[]>(() => {
    if (!recentActivities.data) return [];
    return computeWeekBars(recentActivities.data);
  }, [recentActivities.data]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const readinessLevel = score >= 70 ? "good" : score >= 40 ? "warn" : "bad";

  return (
    <div className="fade-in" style={{ display: "grid", gap: 16 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">{todayLabel}</div>
          <h1 className="h-1">Dashboard</h1>
        </div>
      </header>

      {/* Readiness + Fitness + This Week */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "var(--gap)" }}>
        {/* Readiness */}
        <div className="card" style={{ padding: 28 }}>
          <div className="card-hd" style={{ marginBottom: 18 }}>
            <h3 className="h-section">Training Readiness</h3>
            {score > 0 && (
              <span className={`pill pill-${readinessLevel}`}>
                {level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()}
              </span>
            )}
          </div>
          {readiness.isLoading
            ? <SkeletonBox h={200} />
            : score > 0
              ? <ReadinessRing score={score} />
              : <div style={{ height: 200, display: "grid", placeItems: "center", color: "var(--fg-faint)", fontSize: 13 }}>No readiness data</div>
          }
        </div>

        {/* Fitness */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card-hd" style={{ marginBottom: 0 }}>
            <h3 className="h-section">Fitness</h3>
            {statusPhrase && !trainingStatus.isLoading && (
              <span className="pill pill-good" style={{ fontSize: 10 }}>{statusPhrase}</span>
            )}
          </div>
          {trainingStatus.isLoading ? (
            <SkeletonBox h={100} />
          ) : vo2Max !== undefined ? (
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>VO₂ Max</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="num" style={{ font: "600 52px/0.95 var(--font-display)", letterSpacing: "-0.03em" }}>
                  {vo2Max.toFixed(1)}
                </span>
                <span style={{ fontSize: 12, color: "var(--fg-faint)", fontFamily: "var(--font-mono)" }}>ml/kg/min</span>
              </div>
              {fitnessAge != null && (
                <div style={{ font: "500 12px var(--font-mono)", color: "var(--fg-muted)", marginTop: 8 }}>
                  Fitness age {fitnessAge}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: "var(--fg-faint)", fontSize: 13 }}>No fitness data</div>
          )}
        </div>

        {/* This Week */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="card-hd">
            <h3 className="h-section">This Week</h3>
            <span className="card-tag">Week {weekNumber()}</span>
          </div>
          {mileage.isLoading ? (
            <SkeletonBox h={60} />
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span className="h-display num">{weekMi.toFixed(1)}</span>
                <span style={{ font: "500 14px var(--font-mono)", color: "var(--fg-faint)", whiteSpace: "nowrap" }}>/ {weekTarget} mi</span>
              </div>
              <div className="bar" style={{ marginTop: 12 }}>
                <i style={{ width: `${weekPct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, font: "500 11px var(--font-mono)", color: "var(--fg-muted)", gap: 8 }}>
                <span>{weekPct.toFixed(0)}%</span>
                <span>{Math.max(0, weekTarget - weekMi).toFixed(1)} mi to go</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly mileage bars */}
      {(weekBars.length > 0 || recentActivities.isLoading) && (
        <div className="card">
          <div className="card-hd">
            <h3 className="h-section">Weekly Mileage</h3>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--fg-muted)" }}>
              <LegendDot color="var(--t-easy)" label="Easy" />
              <LegendDot color="var(--t-tempo)" label="Tempo" />
              <LegendDot color="var(--accent-deep)" label="Long" />
            </div>
          </div>
          {recentActivities.isLoading
            ? <SkeletonBox h={92} />
            : <WeeklyBars data={weekBars} goalMi={weekTarget} />
          }
        </div>
      )}

      {/* Goals + Race predictions */}
      <div className="grid grid-2-1">
        <div className="card">
          <div className="card-hd">
            <h3 className="h-section">Goals</h3>
            {goals.data && <span className="card-tag">{goals.data.length} active</span>}
          </div>
          {goals.isLoading
            ? <SkeletonBox h={80} />
            : goals.data && goals.data.length > 0
              ? <div style={{ display: "grid", gap: 18 }}>{goals.data.map((g, i) => <GoalRow key={i} goal={g} />)}</div>
              : <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>No active goals.</p>
          }
        </div>

        <div className="card">
          <div className="card-hd"><h3 className="h-section">Race Predictions</h3></div>
          {racePreds.isLoading
            ? <SkeletonBox h={80} />
            : predictions.length > 0
              ? (
                <>
                  <div style={{ display: "grid", gap: 4 }}>
                    {predictions.map((p) => (
                      <div key={p.label} className="row-hover" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 8px" }}>
                        <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>{p.label}</span>
                        <span className="num" style={{ font: "600 18px/1 var(--font-display)" }}>{raceTime(p.time)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid var(--line-soft)", marginTop: 8, paddingTop: 10, fontSize: 11, color: "var(--fg-faint)" }}>
                    Based on last 60 days of training.
                  </div>
                </>
              )
              : <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>No race predictions available.</p>
          }
        </div>
      </div>

      {/* Recent shoes */}
      {(shoes.isLoading || (shoes.data && shoes.data.length > 0)) && (
        <div className="card">
          <div className="card-hd">
            <h3 className="h-section">Recent Shoes</h3>
            {shoes.data && <span className="card-tag">{shoes.data.length} active</span>}
          </div>
          {shoes.isLoading
            ? <SkeletonBox h={80} />
            : shoes.data && shoes.data.slice(0, 2).map((shoe, i) => (
                <RecentShoeRow key={shoe.uuid} shoe={shoe} rank={i} color={SHOE_COLORS[i % SHOE_COLORS.length]} />
              ))
          }
        </div>
      )}

    </div>
  );
}
