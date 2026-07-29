import { useMemo, useState } from "react";
import { useShoes } from "../api/client";
import type { Shoe } from "../types/garmin";
import ShoeArc from "../components/ShoeArc";

const SHOE_COLORS = [
  "oklch(0.72 0.18 255)",
  "oklch(0.78 0.18 55)",
  "oklch(0.78 0.16 125)",
  "oklch(0.72 0.22 340)",
  "oklch(0.78 0.04 240)",
  "oklch(0.65 0.12 180)",
];

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

function ShoeCard({ shoe, rank, color }: { shoe: Shoe; rank: number; color: string }) {
  const overLimit = shoe.max_mi !== null && shoe.total_mi >= shoe.max_mi;
  const pct = shoe.max_mi ? (shoe.total_mi / shoe.max_mi) * 100 : 0;
  const lastUsed = shoe.last_used ? new Date(shoe.last_used) : null;
  // Sampled once per mount: reading the clock during render is impure.
  const [now] = useState(() => Date.now());
  const daysAgo = lastUsed ? Math.round((now - lastUsed.getTime()) / 86_400_000) : null;
  const started = shoe.date_begin
    ? new Date(shoe.date_begin).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  let badge: { label: string; cls: string } | null = null;
  if (overLimit && pct >= 110) badge = { label: "Retired", cls: "" };
  else if (overLimit)          badge = { label: "Replace soon", cls: "pill-bad" };
  else if (pct >= 85)          badge = { label: "Wearing in", cls: "pill-warn" };
  else if (rank === 0)         badge = { label: "Daily driver", cls: "pill-accent" };

  const barBg = overLimit ? "var(--bad)" : pct >= 80 ? "var(--warn)" : color;

  return (
    <div className="card" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center" }}>
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <ShoeArc pct={pct} color={color} over={overLimit} />
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: color, border: "2px solid var(--card)" }} />
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <h3 className="h-2" style={{ margin: 0 }}>{shoe.name}</h3>
          {badge && <span className={`pill ${badge.cls}`} style={{ whiteSpace: "nowrap" }}>{badge.label}</span>}
        </div>
        {shoe.make_model !== shoe.name && (
          <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 10 }}>{shoe.make_model}</div>
        )}
        <div style={{ display: "flex", gap: 20, font: "500 11px/1 var(--font-mono)", color: "var(--fg-faint)", flexWrap: "wrap" }}>
          <span><span style={{ color: "var(--fg-muted)" }}>{shoe.total_activities}</span> runs</span>
          {daysAgo !== null && (
            <span>last run <span style={{ color: "var(--fg-muted)" }}>
              {daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo}d ago`}
            </span></span>
          )}
          {started && <span>since <span style={{ color: "var(--fg-muted)" }}>{started}</span></span>}
        </div>
      </div>

      <div style={{ textAlign: "right", minWidth: 180 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 6 }}>
          <span className="num" style={{ font: "600 36px/1 var(--font-display)", letterSpacing: "-0.02em", color: overLimit ? "var(--bad)" : "var(--fg)" }}>
            {shoe.total_mi.toFixed(0)}
          </span>
          <span style={{ fontSize: 12, color: "var(--fg-faint)", fontFamily: "var(--font-mono)" }}>mi</span>
        </div>
        <div style={{ font: "500 10px var(--font-mono)", color: "var(--fg-faint)", marginTop: 2 }}>
          {shoe.max_mi !== null
            ? overLimit
              ? `${(shoe.total_mi - shoe.max_mi).toFixed(0)} over ${shoe.max_mi}`
              : `of ${shoe.max_mi}`
            : "no limit"}
        </div>
        {shoe.max_mi !== null && (
          <div className="bar" style={{ width: 160, marginTop: 10, marginLeft: "auto" }}>
            <i style={{ width: `${Math.min(100, pct)}%`, background: barBg }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Gear() {
  const { data, isLoading, error } = useShoes();

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const at = a.last_used ? new Date(a.last_used).getTime() : 0;
      const bt = b.last_used ? new Date(b.last_used).getTime() : 0;
      return bt - at;
    });
  }, [data]);

  const totalMi = sorted.reduce((s, x) => s + x.total_mi, 0);
  const avgMi = sorted.length ? totalMi / sorted.length : 0;

  return (
    <div className="fade-in" style={{ display: "grid", gap: 16 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">Closet</div>
          <h1 className="h-1">Gear</h1>
        </div>
      </header>

      {sorted.length > 0 && (
        <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, padding: 0 }}>
          <SummaryCell label="Pairs" value={sorted.length} />
          <SummaryCell label="Active" value={sorted.length} />
          <SummaryCell label="Lifetime" value={totalMi.toFixed(0)} unit="mi" />
          <SummaryCell label="Avg lifespan" value={avgMi.toFixed(0)} unit="mi" last />
        </div>
      )}

      {error && <p style={{ color: "var(--bad)", fontSize: 13 }}>Failed to load gear: {error.message}</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card skeleton-box" style={{ height: 120 }} />
            ))
          : sorted.map((shoe, i) => (
              <ShoeCard
                key={shoe.uuid}
                shoe={shoe}
                rank={i}
                color={SHOE_COLORS[i % SHOE_COLORS.length]}
              />
            ))
        }
      </div>

      {!isLoading && sorted.length === 0 && !error && (
        <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>No active shoes found in Garmin Connect.</p>
      )}
    </div>
  );
}
