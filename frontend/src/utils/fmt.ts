export const M_PER_MI = 1609.344;

export function mi(meters: number): string {
  return (meters / M_PER_MI).toFixed(1);
}

export function pace(speedMs: number): string {
  if (!speedMs) return "—";
  const secsPerMi = M_PER_MI / speedMs;
  const mins = Math.floor(secsPerMi / 60);
  const secs = Math.round(secsPerMi % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function paceFromSec(secPerMi: number): string {
  if (!secPerMi) return "—";
  const mins = Math.floor(secPerMi / 60);
  const secs = Math.round(secPerMi % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function duration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function raceTime(seconds: number | undefined): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function dayShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function sleep(seconds: number | undefined): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
