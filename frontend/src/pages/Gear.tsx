import { useShoes } from "../api/client";
import type { Shoe } from "../types/garmin";
import { Skeleton } from "../components/Skeleton";

function ShoeCard({ shoe, recentRank }: { shoe: Shoe; recentRank?: number }) {
  const { name, make_model, total_mi, total_activities, max_mi, date_begin, last_used } = shoe;
  const overLimit = max_mi !== null && total_mi >= max_mi;
  const pct = max_mi ? Math.min(100, (total_mi / max_mi) * 100) : null;

  const barColor = overLimit ? "bg-red-500" : pct !== null && pct >= 80 ? "bg-orange-400" : "bg-blue-500";

  const started = date_begin
    ? new Date(date_begin).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const lastUsedLabel = last_used
    ? new Date(last_used).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-800">{name}</p>
            {recentRank === 1 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Last used</span>
            )}
            {recentRank === 2 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">2nd last</span>
            )}
          </div>
          {make_model !== name && (
            <p className="text-xs text-gray-400 mt-0.5">{make_model}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-800">
            {total_mi.toFixed(1)}
            <span className="text-sm font-normal text-gray-400 ml-1">mi</span>
          </p>
          {max_mi !== null && (
            <p className={`text-xs mt-0.5 ${overLimit ? "text-red-500 font-medium" : "text-gray-400"}`}>
              {overLimit ? `${(total_mi - max_mi).toFixed(0)} mi over limit` : `of ${max_mi} mi`}
            </p>
          )}
        </div>
      </div>

      {pct !== null && (
        <div className="mb-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-400">
        <span>{total_activities} runs</span>
        {lastUsedLabel && <span>Last run {lastUsedLabel}</span>}
        {started && <span>Since {started}</span>}
      </div>
    </div>
  );
}

function SkeletonShoeCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex justify-between mb-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-1.5 items-end flex flex-col">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-3" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export default function Gear() {
  const { data, isLoading, error } = useShoes();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Gear</h1>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Shoes</h2>

      {error && <p className="text-sm text-red-500 mb-4">Failed to load gear: {error.message}</p>}

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonShoeCard key={i} />)
          : data && data.length > 0
            ? data.map((shoe, i) => (
                <ShoeCard
                  key={shoe.uuid}
                  shoe={shoe}
                  recentRank={shoe.last_used ? i + 1 : undefined}
                />
              ))
            : !isLoading && <p className="text-sm text-gray-400">No active shoes found in Garmin Connect.</p>
        }
      </div>
    </div>
  );
}
