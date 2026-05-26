import { useActivities, useTrainingReadiness, useMaxMetrics, useTrainingStatus, useRacePredictions } from "../api/client";
import type { Activity, RacePrediction } from "../types/garmin";
import MetricCard from "../components/MetricCard";

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

function formatRaceTime(seconds: number | undefined): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function readinessColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
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

function RacePredictionRow({ pred }: { pred: RacePrediction }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{pred.raceName}</span>
      <span className="text-sm font-medium text-gray-800">{formatRaceTime(pred.time)}</span>
    </div>
  );
}

export default function Dashboard() {
  const activities = useActivities(0, 10);
  const readiness = useTrainingReadiness();
  const maxMetrics = useMaxMetrics();
  const trainingStatus = useTrainingStatus();
  const racePreds = useRacePredictions();

  const score = readiness.data?.score;
  const qualifier = readiness.data?.scoreQualifier?.replace(/_/g, " ");
  const vo2Max = maxMetrics.data?.generic?.vo2MaxPreciseValue;
  const statusKey = trainingStatus.data?.latestTrainingStatusData?.trainingStatusPhraseKey?.replace(/_/g, " ");
  const predictions = racePreds.data?.racePredictions ?? [];

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>

      {/* Training overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-5 col-span-1 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Readiness</p>
          {score !== undefined ? (
            <>
              <p className={`text-4xl font-bold ${readinessColor(score)}`}>{score}</p>
              {qualifier && <p className="text-xs text-gray-400 mt-1 capitalize">{qualifier.toLowerCase()}</p>}
            </>
          ) : (
            <p className="text-2xl font-semibold text-gray-300">—</p>
          )}
        </div>
        <MetricCard
          label="VO2 Max"
          value={vo2Max !== undefined ? vo2Max.toFixed(1) : undefined}
          unit="mL/kg/min"
        />
        <MetricCard
          label="Training Status"
          value={statusKey ? statusKey.charAt(0) + statusKey.slice(1).toLowerCase() : undefined}
        />
      </div>

      {/* Recent runs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Runs</h2>
        {activities.isLoading && <p className="text-sm text-gray-400">Loading...</p>}
        {activities.error && <p className="text-sm text-red-500">Failed to load activities: {activities.error.message}</p>}
        {activities.data?.map((a) => <ActivityRow key={a.activityId} activity={a} />)}
      </div>

      {/* Race predictions */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Race Predictions</h2>
          {predictions.map((p, i) => <RacePredictionRow key={i} pred={p} />)}
        </div>
      )}
    </div>
  );
}
