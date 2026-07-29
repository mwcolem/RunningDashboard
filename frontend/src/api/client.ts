import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Activity,
  ActivitySplits,
  Goal,
  HeartRateData,
  HrvData,
  MaxMetrics,
  MileageSummary,
  RacePredictions,
  Shoe,
  SleepData,
  Spo2Data,
  StressData,
  TrainingReadiness,
  TrainingStatus,
  UserSummary,
} from "../types/garmin";

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Clears the backend TTL cache, then refetches every mounted query.
 * Without the backend clear, a refetch would just re-serve cached data.
 */
export function useRefreshAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Refresh failed: ${res.status} ${res.statusText}`);
      }
      return res.json() as Promise<{ cleared: number }>;
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useActivities(start = 0, limit = 20) {
  return useQuery({
    queryKey: ["activities", start, limit],
    queryFn: () => fetchApi<Activity[]>("/api/activities", { start: String(start), limit: String(limit) }),
    staleTime: 10 * 60 * 1000,
  });
}

export function useActivity(id: number) {
  return useQuery({
    queryKey: ["activity", id],
    queryFn: () => fetchApi<Activity>(`/api/activities/${id}`),
    staleTime: 60 * 60 * 1000,
  });
}

export function useActivitySplits(id: number, enabled = false) {
  return useQuery({
    queryKey: ["splits", id],
    queryFn: () => fetchApi<ActivitySplits>(`/api/activities/${id}/splits`),
    staleTime: 60 * 60 * 1000,
    enabled,
  });
}

const HEALTH_STALE = 5 * 60 * 1000;

export function useUserSummary(date?: string) {
  return useQuery({
    queryKey: ["health", "summary", date],
    queryFn: () => fetchApi<UserSummary>("/api/health/summary", date ? { date } : undefined),
    staleTime: HEALTH_STALE,
  });
}

export function useHeartRate(date?: string) {
  return useQuery({
    queryKey: ["health", "heart-rate", date],
    queryFn: () => fetchApi<HeartRateData>("/api/health/heart-rate", date ? { date } : undefined),
    staleTime: HEALTH_STALE,
  });
}

export function useHrv(date?: string) {
  return useQuery({
    queryKey: ["health", "hrv", date],
    queryFn: () => fetchApi<HrvData>("/api/health/hrv", date ? { date } : undefined),
    staleTime: HEALTH_STALE,
  });
}

export function useStress(date?: string) {
  return useQuery({
    queryKey: ["health", "stress", date],
    queryFn: () => fetchApi<StressData>("/api/health/stress", date ? { date } : undefined),
    staleTime: HEALTH_STALE,
  });
}

export function useSpo2(date?: string) {
  return useQuery({
    queryKey: ["health", "spo2", date],
    queryFn: () => fetchApi<Spo2Data>("/api/health/spo2", date ? { date } : undefined),
    staleTime: HEALTH_STALE,
  });
}

export function useSleep(date?: string) {
  return useQuery({
    queryKey: ["health", "sleep", date],
    queryFn: () => fetchApi<SleepData>("/api/health/sleep", date ? { date } : undefined),
    staleTime: HEALTH_STALE,
  });
}

const TRAINING_STALE = 10 * 60 * 1000;

export function useTrainingReadiness(date?: string) {
  return useQuery({
    queryKey: ["training", "readiness", date],
    queryFn: () => fetchApi<TrainingReadiness>("/api/training/readiness", date ? { date } : undefined),
    staleTime: TRAINING_STALE,
  });
}

export function useMaxMetrics(date?: string) {
  return useQuery({
    queryKey: ["training", "max-metrics", date],
    queryFn: () => fetchApi<MaxMetrics>("/api/training/max-metrics", date ? { date } : undefined),
    staleTime: TRAINING_STALE,
  });
}

export function useTrainingStatus(date?: string) {
  return useQuery({
    queryKey: ["training", "status", date],
    queryFn: () => fetchApi<TrainingStatus>("/api/training/status", date ? { date } : undefined),
    staleTime: TRAINING_STALE,
  });
}

export function useRacePredictions() {
  return useQuery({
    queryKey: ["training", "race-predictions"],
    queryFn: () => fetchApi<RacePredictions>("/api/training/race-predictions"),
    staleTime: TRAINING_STALE,
  });
}

export function useMileageSummary() {
  return useQuery({
    queryKey: ["stats", "mileage"],
    queryFn: () => fetchApi<MileageSummary>("/api/stats/mileage"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["stats", "goals"],
    queryFn: () => fetchApi<Goal[]>("/api/stats/goals"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useShoes() {
  return useQuery({
    queryKey: ["gear", "shoes"],
    queryFn: () => fetchApi<Shoe[]>("/api/gear/shoes"),
    staleTime: 60 * 60 * 1000,
  });
}
