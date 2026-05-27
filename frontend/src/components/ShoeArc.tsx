interface Props {
  pct: number;
  color?: string;
  over?: boolean;
}

export default function ShoeArc({ pct, color = "var(--accent-deep)", over }: Props) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const cap = Math.min(100, pct);
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={over ? "var(--bad)" : color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(cap / 100) * c} ${c}`}
      />
    </svg>
  );
}
