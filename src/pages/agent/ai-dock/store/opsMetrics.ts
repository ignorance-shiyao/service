type KnowledgeFeedbackType = 'useful' | 'useless' | 'old';
type IntentMetricKey =
  | 'qa'
  | 'knowledge'
  | 'report'
  | 'business'
  | 'ticket'
  | 'fault'
  | 'diagnosis'
  | 'fallback'
  | 'other';

type AiDockOpsMetrics = {
  totalQueries: number;
  fallbackCount: number;
  intentHits: Record<IntentMetricKey, number>;
  knowledgeFeedback: Record<KnowledgeFeedbackType, number>;
  updatedAt: number;
};

const STORAGE_KEY = 'ai_dock_ops_metrics_v1';

const EMPTY_METRICS: AiDockOpsMetrics = {
  totalQueries: 0,
  fallbackCount: 0,
  intentHits: {
    qa: 0,
    knowledge: 0,
    report: 0,
    business: 0,
    ticket: 0,
    fault: 0,
    diagnosis: 0,
    fallback: 0,
    other: 0,
  },
  knowledgeFeedback: {
    useful: 0,
    useless: 0,
    old: 0,
  },
  updatedAt: 0,
};

const readMetrics = (): AiDockOpsMetrics => {
  if (typeof window === 'undefined') return { ...EMPTY_METRICS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_METRICS };
    const parsed = JSON.parse(raw) as Partial<AiDockOpsMetrics>;
    return {
      totalQueries: Number(parsed.totalQueries) || 0,
      fallbackCount: Number(parsed.fallbackCount) || 0,
      intentHits: {
        ...EMPTY_METRICS.intentHits,
        ...(parsed.intentHits || {}),
      },
      knowledgeFeedback: {
        ...EMPTY_METRICS.knowledgeFeedback,
        ...(parsed.knowledgeFeedback || {}),
      },
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch (_error) {
    return { ...EMPTY_METRICS };
  }
};

const writeMetrics = (payload: AiDockOpsMetrics) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const updateMetrics = (updater: (current: AiDockOpsMetrics) => AiDockOpsMetrics) => {
  const next = updater(readMetrics());
  writeMetrics({ ...next, updatedAt: Date.now() });
};

export const trackIntentHit = (key: IntentMetricKey, queryCount = 1) => {
  updateMetrics((current) => ({
    ...current,
    totalQueries: current.totalQueries + Math.max(0, queryCount),
    intentHits: {
      ...current.intentHits,
      [key]: (current.intentHits[key] || 0) + 1,
    },
  }));
};

export const trackFallback = () => {
  updateMetrics((current) => ({
    ...current,
    fallbackCount: current.fallbackCount + 1,
    intentHits: {
      ...current.intentHits,
      fallback: current.intentHits.fallback + 1,
    },
  }));
};

export const trackKnowledgeFeedback = (type: KnowledgeFeedbackType) => {
  updateMetrics((current) => ({
    ...current,
    knowledgeFeedback: {
      ...current.knowledgeFeedback,
      [type]: current.knowledgeFeedback[type] + 1,
    },
  }));
};

export type { KnowledgeFeedbackType, IntentMetricKey, AiDockOpsMetrics };
