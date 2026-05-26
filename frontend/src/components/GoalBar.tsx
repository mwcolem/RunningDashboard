import type { Goal } from "../types/garmin";

interface Props {
  goal: Goal;
}

export default function GoalBar({ goal }: Props) {
  const { name, current_mi, target_mi, pct } = goal;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm text-gray-700">{name}</span>
        <span className="text-xs text-gray-400">
          {current_mi.toFixed(1)} / {target_mi} mi — {Math.max(0, target_mi - current_mi).toFixed(2)} remaining
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-0.5">{pct.toFixed(0)}%</p>
    </div>
  );
}
