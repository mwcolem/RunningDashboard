export interface BarData {
  day: string;
  mi: number;
  kind: string;
  projected?: boolean;
}

interface Props {
  data: BarData[];
  goalMi: number;
}

export default function WeeklyBars({ data, goalMi }: Props) {
  const max = Math.max((goalMi / 7) * 2, ...data.map((d) => d.mi), 1);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
      {data.map((d) => {
        const h = (d.mi / max) * 100;
        const tone =
          d.kind === "intervals" ? "var(--t-intervals)" :
          d.kind === "tempo"     ? "var(--t-tempo)" :
          d.kind === "long"      ? "var(--accent-deep)" :
          d.kind === "easy"      ? "var(--t-easy)" :
          "var(--line)";
        return (
          <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div style={{ height: 92, display: "flex", alignItems: "flex-end" }}>
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(h, d.mi > 0 ? 6 : 2)}%`,
                  background: d.mi > 0 ? tone : "var(--line-soft)",
                  borderRadius: 4,
                  opacity: d.projected ? 0.35 : 1,
                  border: d.projected ? "1px dashed var(--line)" : "none",
                  transition: "height 600ms cubic-bezier(.2,.7,.3,1)",
                }}
              />
            </div>
            <div style={{ textAlign: "center", display: "grid", gap: 2 }}>
              <span style={{ font: "500 10px/1 var(--font-ui)", color: "var(--fg-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{d.day}</span>
              <span className="num" style={{ fontSize: 11, color: d.mi > 0 ? "var(--fg)" : "var(--fg-faint)" }}>{d.mi.toFixed(1)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
