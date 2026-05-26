import { useActivities } from "../api/client";
import type { Activity } from "../types/garmin";

function formatPace(speedMs: number): string {
  if (!speedMs) return "—";
  const secsPerKm = 1000 / speedMs;
  const mins = Math.floor(secsPerKm / 60);
  const secs = Math.round(secsPerKm % 60).toString().padStart(2, "0");
  return `${mins}:${secs}/km`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ActivityRow({ activity }: { activity: Activity }) {
  const date = new Date(activity.startTimeLocal).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const km = (activity.distance / 1000).toFixed(2);

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{activity.activityName}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <div className="flex gap-6 text-sm text-gray-600">
        <span>{km} km</span>
        <span>{formatPace(activity.averageSpeed)}</span>
        <span>{formatDuration(activity.duration)}</span>
        <span>{Math.round(activity.averageHR)} bpm</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, error } = useActivities(0, 10);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Runs
        </h2>

        {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
        {error && (
          <p className="text-sm text-red-500">
            Failed to load activities: {error.message}
          </p>
        )}
        {data?.map((a) => <ActivityRow key={a.activityId} activity={a} />)}
      </div>
    </div>
  );
}
