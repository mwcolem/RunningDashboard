import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { HeartRateData } from "../types/garmin";

interface Props {
  data: HeartRateData;
}

export default function HeartRateChart({ data }: Props) {
  const points = (data.heartRateValues ?? [])
    .filter(([, v]) => v !== null && v > 0)
    .map(([ts, v]) => ({
      time: new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      hr: v,
    }));

  if (points.length === 0) {
    return <p className="text-sm text-gray-400">No heart rate data available.</p>;
  }

  // Sample down to ~200 points so the chart stays readable
  const step = Math.max(1, Math.floor(points.length / 200));
  const sampled = points.filter((_, i) => i % step === 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={sampled} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={32} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(v) => [`${v} bpm`, "HR"]}
        />
        <Line
          type="monotone"
          dataKey="hr"
          stroke="#ef4444"
          dot={false}
          strokeWidth={1.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
