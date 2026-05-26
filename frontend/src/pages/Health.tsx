import { useState } from "react";
import { useHeartRate, useHrv, useSleep, useSpo2, useStress } from "../api/client";
import HeartRateChart from "../components/HeartRateChart";
import MetricCard from "../components/MetricCard";
import { SkeletonCard, SkeletonChart } from "../components/Skeleton";

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatSleep(seconds: number | undefined): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function Health() {
  const [date, setDate] = useState(toIso(new Date()));

  const hr = useHeartRate(date);
  const hrv = useHrv(date);
  const stress = useStress(date);
  const spo2 = useSpo2(date);
  const sleep = useSleep(date);

  const sleepDto = sleep.data?.dailySleepDTO;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Health</h1>
        <input
          type="date"
          value={date}
          max={toIso(new Date())}
          onChange={(e) => setDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Heart Rate Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Heart Rate</h2>
          {hr.data?.restingHeartRate && (
            <span className="text-sm text-gray-500">
              Resting: <span className="font-medium text-gray-800">{hr.data.restingHeartRate} bpm</span>
            </span>
          )}
        </div>
        {hr.isLoading && <SkeletonChart />}
        {hr.data && <HeartRateChart data={hr.data} />}
        {hr.error && <p className="text-sm text-red-400">Failed to load heart rate data.</p>}
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        {hrv.isLoading ? <SkeletonCard /> : (
          <MetricCard label="HRV" value={hrv.data?.hrvSummary?.lastNight} unit="ms" sub={hrv.data?.hrvSummary?.status} />
        )}
        {stress.isLoading ? <SkeletonCard /> : (
          <MetricCard label="Avg Stress" value={stress.data?.avgStressLevel} unit="/100" />
        )}
        {spo2.isLoading ? <SkeletonCard /> : (
          <MetricCard
            label="SpO2"
            value={spo2.data?.averageSpO2}
            unit="%"
            sub={spo2.data?.lowestSpO2 !== undefined ? `Low: ${spo2.data.lowestSpO2}%` : undefined}
          />
        )}
        {sleep.isLoading ? <SkeletonCard /> : (
          <MetricCard
            label="Sleep"
            value={formatSleep(sleepDto?.sleepTimeSeconds)}
            sub={sleepDto?.sleepScores?.overall?.value !== undefined ? `Score: ${sleepDto.sleepScores.overall.value}` : undefined}
          />
        )}
      </div>

      {/* Sleep breakdown */}
      {sleepDto && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sleep Stages</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Deep" value={formatSleep(sleepDto.deepSleepSeconds)} />
            <MetricCard label="Light" value={formatSleep(sleepDto.lightSleepSeconds)} />
            <MetricCard label="REM" value={formatSleep(sleepDto.remSleepSeconds)} />
            <MetricCard label="Awake" value={formatSleep(sleepDto.awakeSleepSeconds)} />
          </div>
        </div>
      )}
    </div>
  );
}
