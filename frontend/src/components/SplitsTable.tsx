import type { ActivitySplits } from "../types/garmin";

function formatPace(speedMs: number): string {
  if (!speedMs) return "—";
  const secsPerKm = 1000 / speedMs;
  const mins = Math.floor(secsPerKm / 60);
  const secs = Math.round(secsPerKm % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

interface Props {
  data: ActivitySplits;
}

export default function SplitsTable({ data }: Props) {
  const laps = data.lapDTOs ?? [];

  if (laps.length === 0) {
    return <p className="text-xs text-gray-400 px-4 pb-3">No split data available.</p>;
  }

  return (
    <table className="w-full text-xs text-gray-600 border-t border-gray-100">
      <thead>
        <tr className="text-gray-400 text-left">
          <th className="px-4 py-2 font-medium">Lap</th>
          <th className="px-4 py-2 font-medium">Dist (km)</th>
          <th className="px-4 py-2 font-medium">Pace /km</th>
          <th className="px-4 py-2 font-medium">Avg HR</th>
          <th className="px-4 py-2 font-medium">Elev +m</th>
        </tr>
      </thead>
      <tbody>
        {laps.map((lap, i) => (
          <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
            <td className="px-4 py-1.5">{i + 1}</td>
            <td className="px-4 py-1.5">{((lap.distance ?? 0) / 1000).toFixed(2)}</td>
            <td className="px-4 py-1.5">{formatPace(lap.averageSpeed ?? 0)}</td>
            <td className="px-4 py-1.5">{lap.averageHR ? `${Math.round(lap.averageHR)} bpm` : "—"}</td>
            <td className="px-4 py-1.5">{lap.totalElevationGain ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
