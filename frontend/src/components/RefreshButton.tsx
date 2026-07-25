import { useRefreshAll } from "../api/client";

export default function RefreshButton() {
  const refresh = useRefreshAll();
  const spinning = refresh.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        className="btn"
        onClick={() => refresh.mutate()}
        disabled={spinning}
        aria-label="Refresh data from Garmin"
        title="Clear cached data and refetch from Garmin"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={spinning ? "spin" : undefined}
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
        {spinning ? "Refreshing…" : "Refresh"}
      </button>
      {refresh.isError && (
        <span style={{ font: "500 11px var(--font-mono)", color: "var(--bad)" }}>
          Refresh failed
        </span>
      )}
    </div>
  );
}
