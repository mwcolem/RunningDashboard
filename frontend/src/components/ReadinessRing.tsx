interface Factor {
  label: string;
  value: number;
}

interface Props {
  score: number;
  factors?: Factor[];
}

export default function ReadinessRing({ score, factors = [] }: Props) {
  const r = 84;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const tone = score >= 70 ? "var(--good)" : score >= 40 ? "var(--warn)" : "var(--bad)";
  const label = score >= 70 ? "PRIMED" : score >= 40 ? "READY" : "LOW";

  return (
    <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
      <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
          <circle
            cx="100" cy="100" r={r}
            fill="none"
            stroke={tone}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            style={{ transition: "stroke-dasharray 800ms cubic-bezier(.2,.7,.3,1)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Readiness</div>
            <div className="num" style={{ font: "600 64px/1 var(--font-display)", letterSpacing: "-0.03em" }}>{score}</div>
            <div className="eyebrow" style={{ marginTop: 6, color: tone }}>{label}</div>
          </div>
        </div>
      </div>
      {factors.length > 0 && (
        <div style={{ flex: 1, display: "grid", gap: 10 }}>
          {factors.map((f) => (
            <div key={f.label} style={{ display: "grid", gridTemplateColumns: "100px 1fr 36px", gap: 12, alignItems: "center" }}>
              <span style={{ font: "500 12px/1 var(--font-ui)", color: "var(--fg-muted)" }}>{f.label}</span>
              <div className="bar"><i style={{ width: `${f.value}%` }} /></div>
              <span className="num" style={{ fontSize: 12, color: "var(--fg-muted)", textAlign: "right" }}>{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
