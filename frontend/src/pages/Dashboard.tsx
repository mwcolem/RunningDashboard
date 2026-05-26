import { useTrainingReadiness, useTrainingStatus, useRacePredictions, useMileageSummary, useGoals, useShoes } from "../api/client";
import type { RacePrediction, Shoe } from "../types/garmin";
import MetricCard from "../components/MetricCard";
import GoalBar from "../components/GoalBar";
import { Skeleton, SkeletonCard } from "../components/Skeleton";

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

function RecentShoeRow({ shoe, rank }: { shoe: Shoe; rank: number }) {
  const label = rank === 1 ? "Last used" : "2nd last";
  const lastUsedLabel = shoe.last_used
    ? new Date(shoe.last_used).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const pct = shoe.max_mi ? Math.min(100, (shoe.total_mi / shoe.max_mi) * 100) : null;
  const overLimit = shoe.max_mi !== null && shoe.total_mi >= shoe.max_mi;
  const barColor = overLimit ? "bg-red-500" : pct !== null && pct >= 80 ? "bg-orange-400" : "bg-blue-500";

  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{shoe.name}</span>
          {shoe.make_model !== shoe.name && (
            <span className="text-xs text-gray-400">{shoe.make_model}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {lastUsedLabel && <span>{lastUsedLabel}</span>}
          <span className="font-medium text-gray-600">{shoe.total_mi.toFixed(0)} mi</span>
          {pct !== null && (
            <span className={`font-medium ${overLimit ? "text-red-500" : "text-gray-500"}`}>
              {pct.toFixed(0)}%
            </span>
          )}
          <span className={`px-1.5 py-0.5 rounded ${rank === 1 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"} font-medium`}>{label}</span>
        </div>
      </div>
      {pct !== null && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      )}
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
  const readiness = useTrainingReadiness();
  const trainingStatus = useTrainingStatus();
  const racePreds = useRacePredictions();
  const mileage = useMileageSummary();
  const goals = useGoals();
  const shoes = useShoes();

  const score = readiness.data?.score;
  const qualifier = readiness.data?.level?.replace(/_/g, " ");
  const vo2Max = trainingStatus.data?.mostRecentVO2Max?.generic?.vo2MaxPreciseValue;
  const statusKey = trainingStatus.data?.latestTrainingStatusData?.trainingStatusFeedbackPhrase?.replace(/_/g, " ");
  const predictions = racePreds.data?.racePredictions ?? [];

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>

      {/* Training overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Readiness</p>
          {readiness.isLoading ? (
            <div className="space-y-2 flex flex-col items-center mt-1">
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          ) : score !== undefined ? (
            <>
              <p className={`text-4xl font-bold ${readinessColor(score)}`}>{score}</p>
              {qualifier && <p className="text-xs text-gray-400 mt-1 capitalize">{qualifier.toLowerCase()}</p>}
            </>
          ) : (
            <p className="text-2xl font-semibold text-gray-300">—</p>
          )}
        </div>
        {trainingStatus.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              label="VO2 Max"
              value={vo2Max !== undefined ? vo2Max.toFixed(1) : undefined}
              unit="mL/kg/min"
            />
            <MetricCard
              label="Training Status"
              value={statusKey ? statusKey.charAt(0) + statusKey.slice(1).toLowerCase() : undefined}
            />
          </>
        )}
      </div>

      {/* Mileage summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mileage</h2>
        {mileage.isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
        ) : mileage.error ? (
          <p className="text-sm text-red-400">Failed to load mileage data.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "This Week", value: mileage.data?.week_mi },
              { label: "This Month", value: mileage.data?.month_mi },
              { label: "This Year", value: mileage.data?.year_mi },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {value?.toFixed(1)}
                  <span className="text-sm font-normal text-gray-400 ml-1">mi</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Goals</h2>
        {goals.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : goals.error ? (
          <p className="text-sm text-red-400">Failed to load goals.</p>
        ) : goals.data && goals.data.length > 0 ? (
          <div className="space-y-4">
            {goals.data.map((g, i) => <GoalBar key={`${g.name}-${i}`} goal={g} />)}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No active goals found in Garmin Connect.</p>
        )}
      </div>

      {/* Recent shoes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Shoes</h2>
        {shoes.isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        ) : shoes.error ? (
          <p className="text-sm text-red-400">Failed to load gear.</p>
        ) : shoes.data && shoes.data.length > 0 ? (
          shoes.data.slice(0, 2).map((shoe, i) => <RecentShoeRow key={shoe.uuid} shoe={shoe} rank={i + 1} />)
        ) : (
          <p className="text-sm text-gray-400">No recent shoe data.</p>
        )}
      </div>

      {/* Race predictions */}
      {racePreds.isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Skeleton className="h-3 w-28 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <Skeleton className="h-3.5 w-8" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      ) : predictions.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Race Predictions</h2>
          {predictions.map((p, i) => <RacePredictionRow key={i} pred={p} />)}
        </div>
      ) : null}
    </div>
  );
}
