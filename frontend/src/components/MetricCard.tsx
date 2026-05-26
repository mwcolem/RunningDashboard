interface MetricCardProps {
  label: string;
  value: string | number | undefined;
  unit?: string;
  sub?: string;
}

export default function MetricCard({ label, value, unit, sub }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-800">
        {value ?? "—"}
        {value !== undefined && unit && (
          <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
        )}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
