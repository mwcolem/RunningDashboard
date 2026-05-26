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
  scoreQualifier?: string;
  deviceId?: number;
}

export interface MaxMetrics {
  generic?: {
    vo2MaxPreciseValue?: number;
    fitnessAge?: number;
  };
}

export interface TrainingStatus {
  latestTrainingStatusData?: {
    trainingStatusPhraseKey?: string;
    latestTrainingLoadData?: {
      trainingLoadIndex?: number;
    };
  };
}

export interface RacePrediction {
  raceName?: string;
  time?: number;
  distance?: number;
}

export interface RacePredictions {
  racePredictions?: RacePrediction[];
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
