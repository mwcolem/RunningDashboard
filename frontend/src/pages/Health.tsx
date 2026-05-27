import { useState } from "react";
import { useHeartRate, useHrv, useSleep, useSpo2, useStress } from "../api/client";
import HeartRateChart from "../components/HeartRateChart";
import SleepStagesBar from "../components/SleepStagesBar";
import { sleep } from "../utils/fmt";

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function BigMetric({
  label, value, unit, sub, pill,
}: {
  label: string;
  value: string | number | undefined;
  unit?: string;
  sub?: string;
  pill?: { label: string; tone: string };
}) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, minHeight: 22 }}>
        <span className="eyebrow">{label}</span>
        {pill && <span className={`pill pill-${pill.tone}`} style={{ fontSize: 10 }}>{pill.label}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="num" style={{ font: "600 36px/1 var(--font-display)", letterSpacing: "-0.02em" }}>
          {value ?? "—"}
        </span>
        {unit && <span style={{ fontSize: 12, color: "var(--fg-faint)", fontFamily: "var(--font-mono)" }}>{unit}</span>}
      </div>
      {sub && <div style={{ font: "500 11px var(--font-mono)", color: "var(--fg-muted)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Health() {
  const [offset, setOffset] = useState(0);
  const date = toIso(new Date(Date.now() - offset * 86_400_000));

  const hr = useHeartRate(date);
  const hrv = useHrv(date);
  const stress = useStress(date);
  const spo2 = useSpo2(date);
  const sl = useSleep(date);

  const dto = sl.data?.dailySleepDTO;
  const sleepScore = dto?.sleepScores?.overall?.value;
  const avgSpo2 = spo2.data?.averageSpO2;

  return (
    <div className="fade-in" style={{ display: "grid", gap: 16 }}>
      <header className="page-head">
        <div>
          <div className="eyebrow">Recovery</div>
          <h1 className="h-1">Health</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn" onClick={() => setOffset((o) => o + 1)} aria-label="Previous day">←</button>
          <div style={{ font: "500 12px/1 var(--font-mono)", padding: "0 12px", textAlign: "center", minWidth: 140 }}>
            {offset === 0 ? "Today" : offset === 1 ? "Yesterday" : `${offset} days ago`}
            <div style={{ fontSize: 10, color: "var(--fg-faint)", marginTop: 4 }}>
              {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
          <button className="btn" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Next day">→</button>
        </div>
      </header>

      {/* Top metric row */}
      <div className="grid grid-4">
        <BigMetric
          label="HRV"
          value={hrv.data?.hrvSummary?.lastNight}
          unit="ms"
          sub={hrv.data?.hrvSummary?.weeklyAvg != null ? `Weekly avg ${hrv.data.hrvSummary.weeklyAvg}` : undefined}
          pill={hrv.data?.hrvSummary?.status ? { label: hrv.data.hrvSummary.status, tone: "good" } : undefined}
        />
        <BigMetric
          label="Resting HR"
          value={hr.data?.restingHeartRate}
          unit="bpm"
        />
        <BigMetric
          label="Sleep"
          value={sleep(dto?.sleepTimeSeconds)}
          sub={sleepScore != null ? `Score ${sleepScore}` : undefined}
          pill={sleepScore != null ? { label: sleepScore >= 80 ? "Excellent" : "Good", tone: sleepScore >= 80 ? "good" : "warn" } : undefined}
        />
        <BigMetric
          label="Stress"
          value={stress.data?.avgStressLevel}
          unit="/100"
          sub={stress.data?.maxStressLevel != null ? `Peak ${stress.data.maxStressLevel}` : undefined}
        />
      </div>

      {/* Heart Rate Chart */}
      <div className="card">
        <div className="card-hd">
          <h3 className="h-section">Heart Rate</h3>
          <div style={{ display: "flex", gap: 14, font: "500 11px var(--font-mono)", color: "var(--fg-muted)" }}>
            {hr.data?.restingHeartRate != null && (
              <span>Rest <span style={{ color: "var(--fg)" }}>{hr.data.restingHeartRate}</span></span>
            )}
            {hr.data?.maxHeartRate != null && (
              <span>Peak <span style={{ color: "var(--fg)" }}>{hr.data.maxHeartRate}</span></span>
            )}
          </div>
        </div>
        {hr.isLoading && (
          <div className="skeleton-box" style={{ height: 220, borderRadius: 8 }} />
        )}
        {hr.error && <p style={{ color: "var(--bad)", fontSize: 13 }}>Failed to load heart rate data.</p>}
        {hr.data && <HeartRateChart data={hr.data} />}
      </div>

      {/* Sleep stages */}
      {(sl.isLoading || dto) && (
        <div className="card">
          <div className="card-hd">
            <h3 className="h-section">Sleep Stages</h3>
          </div>
          {sl.isLoading
            ? <div className="skeleton-box" style={{ height: 80, borderRadius: 8 }} />
            : dto
              ? <SleepStagesBar dto={dto} />
              : null
          }
        </div>
      )}

      {/* SpO2 */}
      {avgSpo2 != null && (
        <div className="card">
          <div className="card-hd">
            <h3 className="h-section">SpO₂ Overnight</h3>
            <span className={`pill ${avgSpo2 >= 95 ? "pill-good" : "pill-warn"}`}>
              {avgSpo2 >= 95 ? "Normal" : "Watch"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
            <span className="num" style={{ font: "600 56px/0.95 var(--font-display)", letterSpacing: "-0.03em" }}>{avgSpo2}</span>
            <span style={{ fontSize: 16, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>%</span>
          </div>
          <div className="bar"><i style={{ width: `${avgSpo2}%`, background: "var(--accent-deep)" }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, font: "500 11px var(--font-mono)", color: "var(--fg-muted)" }}>
            {spo2.data?.lowestSpO2 != null && (
              <span>Low <span style={{ color: "var(--fg)" }}>{spo2.data.lowestSpO2}%</span></span>
            )}
            <span>Avg <span style={{ color: "var(--fg)" }}>{avgSpo2}%</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
