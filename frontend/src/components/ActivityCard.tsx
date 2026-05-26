import { useState } from "react";
import { useActivitySplits } from "../api/client";
import type { Activity } from "../types/garmin";
import SplitsTable from "./SplitsTable";

function formatPace(speedMs: number): string {
  if (!speedMs) return "—";
  const secsPerMi = 1609.344 / speedMs;
  const mins = Math.floor(secsPerMi / 60);
  const secs = Math.round(secsPerMi % 60).toString().padStart(2, "0");
  return `${mins}:${secs}/mi`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface Props {
  activity: Activity;
}

export default function ActivityCard({ activity }: Props) {
  const [expanded, setExpanded] = useState(false);
  const splits = useActivitySplits(activity.activityId, expanded);

  const date = new Date(activity.startTimeLocal).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const mi = (activity.distance / 1609.344).toFixed(2);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-medium text-gray-800">{activity.activityName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 text-sm text-gray-600 flex-wrap justify-end">
          <span className="font-medium">{mi} mi</span>
          <span className="hidden sm:inline">{formatPace(activity.averageSpeed)}</span>
          <span>{formatDuration(activity.duration)}</span>
          <span className="hidden sm:inline">{Math.round(activity.averageHR)} bpm</span>
          <span className="text-gray-300 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div>
          {splits.isLoading && <p className="text-xs text-gray-400 px-4 pb-3">Loading splits...</p>}
          {splits.error && <p className="text-xs text-red-400 px-4 pb-3">Failed to load splits.</p>}
          {splits.data && <SplitsTable data={splits.data} />}
        </div>
      )}
    </div>
  );
}
