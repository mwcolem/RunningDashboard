export interface Activity {
  activityId: number;
  activityName: string;
  startTimeLocal: string;
  distance: number;        // meters
  duration: number;        // seconds
  averageSpeed: number;    // m/s
  averageHR: number;
  maxHR: number;
  calories: number;
  elevationGain: number;
}

export interface Split {
  splitSummaries?: SplitSummary[];
}

export interface SplitSummary {
  splitType: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  averageHR: number;
}

export interface HeartRateData {
  restingHeartRate?: number;
  maxHeartRate?: number;
  heartRateValues?: [number, number | null][];
}

export interface HrvData {
  hrvSummary?: {
    lastNight?: number;
    weeklyAvg?: number;
    status?: string;
  };
}

export interface StressData {
  avgStressLevel?: number;
  maxStressLevel?: number;
  stressValuesArray?: [number, number][];
}

export interface Spo2Data {
  averageSpO2?: number;
  lowestSpO2?: number;
}

export interface SleepData {
  dailySleepDTO?: {
    sleepTimeSeconds?: number;
    unmeasurableSleepSeconds?: number;
    deepSleepSeconds?: number;
    lightSleepSeconds?: number;
    remSleepSeconds?: number;
    awakeSleepSeconds?: number;
    averageSpO2Value?: number;
    avgSleepStress?: number;
    sleepScores?: { overall?: { value?: number } };
  };
}

export interface UserSummary {
  totalSteps?: number;
  totalKilocalories?: number;
  restingHeartRate?: number;
  averageStressLevel?: number;
  bodyBatteryChargedValue?: number;
  bodyBatteryDrainedValue?: number;
}

export interface TrainingReadiness {
  score?: number;
  level?: string;
  feedbackShort?: string;
}

export interface MaxMetrics {
  generic?: {
    vo2MaxPreciseValue?: number;
    fitnessAge?: number;
  };
}

export interface TrainingStatus {
  mostRecentVO2Max?: {
    generic?: {
      vo2MaxPreciseValue?: number;
      fitnessAge?: number | null;
    };
  };
  latestTrainingStatusData?: {
    trainingStatusFeedbackPhrase?: string;
  };
}

export interface RacePredictions {
  time5K?: number;
  time10K?: number;
  timeHalfMarathon?: number;
  timeMarathon?: number;
}

export interface SplitEntry {
  distance?: number;
  duration?: number;
  averageSpeed?: number;
  averageHR?: number;
  totalElevationGain?: number;
  splitType?: string;
}

export interface ActivitySplits {
  lapDTOs?: SplitEntry[];
}

export interface MileageSummary {
  year_mi: number;
  month_mi: number;
  week_mi: number;
}

export interface Goal {
  name: string;
  period: "year" | "month" | "week";
  target_mi: number;
  current_mi: number;
  pct: number;
}

export interface Shoe {
  uuid: string;
  name: string;
  make_model: string;
  total_mi: number;
  total_activities: number;
  max_mi: number | null;
  date_begin: string | null;
  last_used: string | null;
}
