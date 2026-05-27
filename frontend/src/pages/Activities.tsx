import { useState, useMemo, Fragment } from "react";
import { useActivities, useActivitySplits } from "../api/client";
import type { Activity } from "../types/garmin";
import { mi, pace, duration, dayShort, paceFromSec } from "../utils/fmt";

const M_PER_MI = 1609.344;
const PAGE_SIZE = 20;

function deriveType(a: Activity): string {
  const distMi = a.distance / M_PER_MI;
  const secPerMi = M_PER_MI / (a.averageSpeed || 1);
  if (distMi > 10) return "long";
  if (secPerMi < 450) return "tempo";
  return "easy";
}

function SummaryCell({ label, value, unit, last }: { label: string; value: string | number; unit?: string; last?: boolean }) {
  return (
    <div style={{ padding: 20, borderRight: last ? "none" : "1px solid var(--line-soft)" }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="num" style={{ font: "600 26px/1 var(--font-display)", letterSpacing: "-0.02em" }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: "var(--fg-faint)", fontFamily: "var(--font-mono)" }}>{unit}</span>}
      </div>
    </div>
  );
}

function Stat({ value, unit }: { value: string; unit?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
      <span className="num" style={{ font: "600 15px var(--font-display)", letterSpacing: "-0.01em" }}>{value}</span>
      {unit && <span style={{ fontSize: 10, color: "var(--fg-faint)", fontFamily: "var(--font-mono)" }}>{unit}</span>}
    </div>
  );
}

function SplitsDetail({ activityId }: { activityId: number }) {
  const { data, isLoading, error } = useActivitySplits(activityId, true);

  if (isLoading) {
    return (
      <div style={{ borderTop: "1px solid var(--line-soft)", padding: "16px 20px", background: "var(--bg-deep)", color: "var(--fg-muted)", fontSize: 13 }}>
        Loading splits…
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ borderTop: "1px solid var(--line-soft)", padding: "16px 20px", background: "var(--bg-deep)", color: "var(--bad)", fontSize: 13 }}>
        Failed to load splits.
      </div>
    );
  }

  const laps = data?.lapDTOs ?? [];
  if (laps.length === 0) {
    return (
      <div style={{ borderTop: "1px solid var(--line-soft)", padding: "16px 20px", background: "var(--bg-deep)", color: "var(--fg-muted)", fontSize: 13 }}>
        No split data available.
      </div>
    );
  }

  const paceSecs = laps
    .map((l) => (l.averageSpeed ? M_PER_MI / l.averageSpeed : 0))
    .filter(Boolean);
  const fastest = paceSecs.length ? Math.min(...paceSecs) : 0;
  const slowest = paceSecs.length ? Math.max(...paceSecs) : 0;

  return (
    <div style={{ borderTop: "1px solid var(--line-soft)", padding: "16px 20px", background: "var(--bg-deep)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <span className="eyebrow">Splits / mi</span>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--fg-muted)", flexWrap: "wrap" }}>
          {fastest > 0 && <span>Fastest <span className="num" style={{ color: "var(--fg)" }}>{paceFromSec(fastest)}</span></span>}
          {slowest > 0 && <span>Slowest <span className="num" style={{ color: "var(--fg)" }}>{paceFromSec(slowest)}</span></span>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 84px 84px", columnGap: 12, rowGap: 4 }}>
        <span className="eyebrow">Mi</span>
        <span className="eyebrow">Pace</span>
        <span className="eyebrow" style={{ textAlign: "right" }}>HR</span>
        <span className="eyebrow" style={{ textAlign: "right" }}>Elev</span>
        {laps.map((s, i) => {
          const secPerMi = s.averageSpeed ? M_PER_MI / s.averageSpeed : 0;
          const range = slowest - fastest || 1;
          const fillPct = secPerMi > 0 ? ((slowest - secPerMi) / range) * 100 : 0;
          const isFastest = secPerMi > 0 && secPerMi === fastest;
          return (
            <Fragment key={i}>
              <span className="num" style={{ fontSize: 12, color: "var(--fg-muted)" }}>{i + 1}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="num" style={{ font: "600 13px var(--font-display)", minWidth: 44, color: isFastest ? "var(--accent-deep)" : "var(--fg)" }}>
                  {secPerMi ? paceFromSec(secPerMi) : "—"}
                </span>
                <div style={{ flex: 1, height: 6, background: "var(--line-soft)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${fillPct}%`, height: "100%", background: isFastest ? "var(--accent)" : "var(--fg-muted)", borderRadius: 3, transition: "width 400ms" }} />
                </div>
              </div>
              <span className="num" style={{ fontSize: 12, textAlign: "right", color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
                {s.averageHR ? Math.round(s.averageHR) : "—"} <span style={{ color: "var(--fg-faint)" }}>bpm</span>
              </span>
              <span className="num" style={{ fontSize: 12, textAlign: "right", color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
                +{s.totalElevationGain ?? "—"} <span style={{ color: "var(--fg-faint)" }}>m</span>
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ActivityRow({ a, expanded, onToggle }: { a: Activity; expanded: boolean; onToggle: () => void }) {
  const type = deriveType(a);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        className="row-hover"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 90px 90px 90px 28px",
          gap: 18,
          padding: "16px 20px",
          alignItems: "center",
          width: "100%",
          textAlign: "left",
          borderRadius: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ font: "500 14px/1.2 var(--font-ui)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {a.activityName}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 11, color: "var(--fg-faint)" }}>{dayShort(a.startTimeLocal)}</span>
            <span className={`type-chip type-${type}`}>{type}</span>
          </div>
        </div>
        <Stat value={mi(a.distance)} unit="mi" />
        <Stat value={pace(a.averageSpeed)} unit="/mi" />
        <Stat value={duration(a.duration)} />
        <span style={{ font: "400 12px var(--font-mono)", color: "var(--fg-faint)", transition: "transform 200ms", transform: expanded ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {expanded && <SplitsDetail activityId={a.activityId} />}
    </div>
  );
}

export default function Activities() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading, error } = useActivities(page * PAGE_SIZE, PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data;
    return data.filter((a) => deriveType(a) === filter);
  }, [data, filter]);

  const totalMiVal = filtered.reduce((s, a) => s + a.distance / M_PER_MI, 0);
  const totalSec = filtered.reduce((s, a) => s + a.duration, 0);
  const avgHr = filtered.length
    ? Math.round(filtered.reduce((s, a) => s + (a.averageHR || 0), 0) / filtered.length)
    : 0;

  const filters = [
    { v: "all", l: "All" },
    { v: "easy", l: "Easy" },
    { v: "tempo", l: "Tempo" },
    { v: "long", l: "Long" },
  ];

  return (
    <div className="fade-in" style={{ display: "grid", gap: 16 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">Library</div>
          <h1 className="h-1">Activities</h1>
        </div>
      </header>

      {data && (
        <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, padding: 0 }}>
          <SummaryCell label="Runs" value={filtered.length} />
          <SummaryCell label="Distance" value={totalMiVal.toFixed(1)} unit="mi" />
          <SummaryCell label="Time" value={duration(totalSec)} />
          <SummaryCell label="Avg HR" value={avgHr || "—"} unit="bpm" last />
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {filters.map((c) => (
          <button
            key={c.v}
            onClick={() => setFilter(c.v)}
            className="pill"
            style={{
              background: filter === c.v ? "var(--fg)" : "var(--card)",
              color: filter === c.v ? "var(--bg)" : "var(--fg)",
              borderColor: filter === c.v ? "var(--fg)" : "var(--line)",
              cursor: "pointer",
              transition: "background 120ms, color 120ms",
            }}
          >
            {c.l}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {data && (
          <span style={{ font: "500 10px/1 var(--font-ui)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
            {filtered.length} results
          </span>
        )}
      </div>

      {error && <p style={{ color: "var(--bad)", fontSize: 13 }}>Failed to load activities: {error.message}</p>}

      <div style={{ display: "grid", gap: 2 }}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card skeleton-box" style={{ height: 72 }} />
            ))
          : filtered.map((a) => (
              <ActivityRow
                key={a.activityId}
                a={a}
                expanded={expanded === a.activityId}
                onToggle={() => setExpanded((x) => (x === a.activityId ? null : a.activityId))}
              />
            ))
        }
      </div>

      {data && (
        <div style={{ display: "flex", gap: 8 }}>
          {page > 0 && (
            <button className="btn" onClick={() => { setPage((p) => p - 1); setExpanded(null); }}>← Previous</button>
          )}
          {data.length === PAGE_SIZE && (
            <button className="btn" onClick={() => { setPage((p) => p + 1); setExpanded(null); }}>Next →</button>
          )}
        </div>
      )}
    </div>
  );
}
