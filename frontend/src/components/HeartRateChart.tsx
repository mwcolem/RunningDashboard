import { useRef, useState, useEffect } from "react";
import type { HeartRateData } from "../types/garmin";

interface Props {
  data: HeartRateData;
  height?: number;
}

export default function HeartRateChart({ data, height = 220 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [w, setW] = useState(800);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const padL = 36, padR = 12, padT = 16, padB = 28;
  const innerW = Math.max(50, w - padL - padR);
  const innerH = height - padT - padB;

  const values = ((data.heartRateValues ?? []) as [number, number | null][])
    .filter((pt): pt is [number, number] => pt[1] != null && pt[1] > 0);

  if (values.length === 0) {
    return <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>No heart rate data available.</p>;
  }

  const xs = values.map(([t]) => t);
  const ys = values.map(([, v]) => v);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.max(35, Math.min(...ys) - 5);
  const yMax = Math.max(...ys) + 5;

  const xc = (t: number) => padL + ((t - xMin) / (xMax - xMin)) * innerW;
  const yc = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const linePath = values.map(([t, v], i) => `${i === 0 ? "M" : "L"} ${xc(t).toFixed(1)} ${yc(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xc(xMax).toFixed(1)} ${padT + innerH} L ${xc(xMin).toFixed(1)} ${padT + innerH} Z`;

  const yTicks = [60, 100, 140, 180].filter((t) => t > yMin && t < yMax);
  const xTicks = [0, 6, 12, 18].map((h) => {
    const d = new Date(xMin);
    d.setHours(h, 0, 0, 0);
    return d.getTime();
  }).filter((t) => t >= xMin && t <= xMax);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    if (xPos < padL || xPos > padL + innerW) { setHover(null); return; }
    const t = xMin + ((xPos - padL) / innerW) * (xMax - xMin);
    let nearest = values[0], best = Infinity;
    for (const p of values) {
      const d = Math.abs(p[0] - t);
      if (d < best) { best = d; nearest = p; }
    }
    setHover(nearest);
  };

  const tooltipLeft = hover ? Math.min(Math.max(xc(hover[0]) - 60, 8), w - 130) : 0;
  const tooltipTop = hover ? Math.max(yc(hover[1]) - 48, 4) : 0;

  return (
    <div ref={ref} style={{ position: "relative" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg width="100%" height={height}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w - padR} y1={yc(t)} y2={yc(t)} stroke="var(--line-soft)" strokeDasharray="2 4" />
            <text x={padL - 8} y={yc(t) + 3} textAnchor="end" style={{ font: "500 10px var(--font-mono)", fill: "var(--fg-faint)" }}>{t}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={xc(t)} y={height - 8} textAnchor="middle" style={{ font: "500 10px var(--font-mono)", fill: "var(--fg-faint)" }}>
            {new Date(t).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).replace(" ", "")}
          </text>
        ))}
        {data.restingHeartRate && (
          <line x1={padL} x2={w - padR} y1={yc(data.restingHeartRate)} y2={yc(data.restingHeartRate)} stroke="var(--fg-faint)" strokeDasharray="3 3" opacity="0.5" />
        )}
        <defs>
          <linearGradient id="hrFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--hr-line)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--hr-line)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#hrFill)" />
        <path d={linePath} fill="none" stroke="var(--hr-line)" strokeWidth="1.5" />
        {hover && (
          <g>
            <line x1={xc(hover[0])} x2={xc(hover[0])} y1={padT} y2={padT + innerH} stroke="var(--fg)" opacity="0.3" />
            <circle cx={xc(hover[0])} cy={yc(hover[1])} r={4} fill="var(--card)" stroke="var(--hr-line)" strokeWidth="1.5" />
          </g>
        )}
      </svg>
      {hover && (
        <div style={{
          position: "absolute",
          left: tooltipLeft,
          top: tooltipTop,
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: "6px 10px",
          font: "500 11px/1.4 var(--font-ui)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          <div className="num" style={{ fontWeight: 600, fontSize: 14, color: "var(--hr-line)" }}>{hover[1]} bpm</div>
          <div style={{ color: "var(--fg-muted)" }}>
            {new Date(hover[0]).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
          </div>
        </div>
      )}
    </div>
  );
}
