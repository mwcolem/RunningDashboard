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
