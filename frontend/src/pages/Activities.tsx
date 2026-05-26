import { useState } from "react";
import { useActivities } from "../api/client";
import ActivityCard from "../components/ActivityCard";

const PAGE_SIZE = 20;

export default function Activities() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useActivities(page * PAGE_SIZE, PAGE_SIZE);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Activities</h1>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-500">Failed to load activities: {error.message}</p>}

      <div className="space-y-2">
        {data?.map((a) => <ActivityCard key={a.activityId} activity={a} />)}
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
