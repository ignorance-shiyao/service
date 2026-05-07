export type HealthMetricStatus = 'normal' | 'warning' | 'danger';

type HigherBetterThreshold = {
  normalMin: number;
  warningMin: number;
};

type LowerBetterThreshold = {
  normalMax: number;
  warningMax: number;
};

const byHigherBetter = (value: number, threshold: HigherBetterThreshold): HealthMetricStatus => {
  if (value >= threshold.normalMin) return 'normal';
  if (value >= threshold.warningMin) return 'warning';
  return 'danger';
};

const byLowerBetter = (value: number, threshold: LowerBetterThreshold): HealthMetricStatus => {
  if (value <= threshold.normalMax) return 'normal';
  if (value <= threshold.warningMax) return 'warning';
  return 'danger';
};

export const getAvailabilityStatus = (value: number): HealthMetricStatus =>
  byHigherBetter(value, { normalMin: 99.8, warningMin: 99.5 });

export const getLatencyStatus = (value: number): HealthMetricStatus =>
  byLowerBetter(value, { normalMax: 25, warningMax: 45 });

export const getLossStatus = (value: number): HealthMetricStatus =>
  byLowerBetter(value, { normalMax: 0.1, warningMax: 0.3 });

export const getScoreStatus = (value: number): HealthMetricStatus =>
  byHigherBetter(value, { normalMin: 98, warningMin: 90 });

export const getLevelByScore = (value: number): '健康' | '关注' | '异常' => {
  const status = getScoreStatus(value);
  if (status === 'normal') return '健康';
  if (status === 'warning') return '关注';
  return '异常';
};

export const mergeWorstStatus = (list: HealthMetricStatus[]): HealthMetricStatus => {
  if (list.includes('danger')) return 'danger';
  if (list.includes('warning')) return 'warning';
  return 'normal';
};

export const getManagedBusinessStatus = (input: {
  onlineRate: number;
  latency: number;
  loss: number;
}): HealthMetricStatus =>
  mergeWorstStatus([
    getAvailabilityStatus(input.onlineRate),
    getLatencyStatus(input.latency),
    getLossStatus(input.loss),
  ]);
