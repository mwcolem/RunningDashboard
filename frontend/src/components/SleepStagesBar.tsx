import type { SleepData } from "../types/garmin";
import { sleep } from "../utils/fmt";

type SleepDTO = NonNullable<SleepData["dailySleepDTO"]>;

interface Props {
  dto: SleepDTO;
}

const STAGES = [
  { key: "deep",  color: "oklch(0.45 0.10 260)", label: "Deep",  field: "deepSleepSeconds"  as const },
  { key: "rem",   color: "oklch(0.62 0.12 280)", label: "REM",   field: "remSleepSeconds"   as const },
  { key: "light", color: "oklch(0.78 0.08 260)", label: "Light", field: "lightSleepSeconds" as const },
  { key: "awake", color: "oklch(0.85 0.04 50)",  label: "Awake", field: "awakeSleepSeconds" as const },
];

export default function SleepStagesBar({ dto }: Props) {
  const total = STAGES.reduce((s, st) => s + (dto[st.field] || 0), 0);
  if (!total) return <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>No sleep data available.</p>;

  return (
    <div>
      <div style={{ display: "flex", height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
        {STAGES.map((st) => (
          <div
            key={st.key}
            title={`${st.label}: ${sleep(dto[st.field])}`}
            style={{ width: `${((dto[st.field] || 0) / total) * 100}%`, background: st.color }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 14 }}>
        {STAGES.map((st) => {
          const secs = dto[st.field] || 0;
          return (
            <div key={st.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: st.color, flexShrink: 0 }} />
                <span className="eyebrow">{st.label}</span>
              </div>
              <div className="num" style={{ font: "600 18px/1.1 var(--font-display)", marginTop: 6 }}>{sleep(secs)}</div>
              <div style={{ font: "500 11px/1 var(--font-mono)", color: "var(--fg-faint)", marginTop: 2 }}>
                {((secs / total) * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
