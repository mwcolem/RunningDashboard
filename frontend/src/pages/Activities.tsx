import { useState } from "react";
import { useActivities } from "../api/client";
import ActivityCard from "../components/ActivityCard";
import { Skeleton } from "../components/Skeleton";

const PAGE_SIZE = 20;

function SkeletonActivityCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-5">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function Activities() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useActivities(page * PAGE_SIZE, PAGE_SIZE);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Activities</h1>

      {error && <p className="text-sm text-red-500 mb-4">Failed to load activities: {error.message}</p>}

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonActivityCard key={i} />)
          : data?.map((a) => <ActivityCard key={a.activityId} activity={a} />)
        }
      </div>

      {data && (
        <div className="flex gap-3 mt-6">
          {page > 0 && (
            <button
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          {data.length === PAGE_SIZE && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
