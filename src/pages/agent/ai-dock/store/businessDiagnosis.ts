import {
  getAvailabilityStatus,
  getLatencyStatus,
  getLevelByScore,
  getLossStatus,
  getScoreStatus,
} from './metricSemantics';
import type { BusinessDiagnosisReportPayload, BusinessDiagnosisResult, BusinessDiagnosisTarget } from './aiDockTypes';

const parseMetricNumber = (raw: unknown): number => {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return Number.NaN;
  const normalized = raw.replace(/[^\d.-]/g, '');
  return Number.parseFloat(normalized);
};

export const normalizeBusinessDiagnosisReportPayload = (payload: any) => {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.results)) return payload;
  const results = payload.results.map((item: any) => {
    const score = typeof item?.score === 'number' ? item.score : parseMetricNumber(item?.score);
    const normalizedLevel = Number.isFinite(score) ? getLevelByScore(score) : item?.level;
    const normalizedMetrics = Array.isArray(item?.metrics)
      ? item.metrics.map((metric: any) => {
          const value = parseMetricNumber(metric?.value);
          if (!Number.isFinite(value) || typeof metric?.label !== 'string') return metric;
          if (metric.label === '可用率') return { ...metric, status: getAvailabilityStatus(value) };
          if (metric.label === '时延') return { ...metric, status: getLatencyStatus(value) };
          if (metric.label === '丢包') return { ...metric, status: getLossStatus(value) };
          if (metric.label === '健康评分') return { ...metric, status: getScoreStatus(value) };
          return metric;
        })
      : item?.metrics;
    return {
      ...item,
      level: normalizedLevel,
      metrics: normalizedMetrics,
    };
  });
  return {
    ...payload,
    results,
  };
};

export const buildBusinessDiagnosisReport = (targets: BusinessDiagnosisTarget[]): BusinessDiagnosisReportPayload => {
  const results: BusinessDiagnosisResult[] = targets.map((target, index) => {
    const seed = target.item.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + index * 7;
    const riskSeed = seed % 40;
    const level: BusinessDiagnosisResult['level'] =
      riskSeed < 1 ? '异常' : riskSeed < 7 ? '关注' : '健康';

    const score =
      level === '健康'
        ? 89 + (seed % 9)
        : level === '关注'
          ? 80 + (seed % 8)
          : 72 + (seed % 6);

    const latency =
      level === '健康'
        ? 12 + (seed % 13)
        : level === '关注'
          ? 26 + (seed % 17)
          : 46 + (seed % 27);

    const loss = Number(
      (
        level === '健康'
          ? 0.03 + (seed % 10) / 100
          : level === '关注'
            ? 0.12 + (seed % 17) / 100
            : 0.32 + (seed % 27) / 100
      ).toFixed(2)
    );

    const availability = Number(
      (
        level === '健康'
          ? 99.82 + (seed % 15) / 100
          : level === '关注'
            ? 99.55 + (seed % 25) / 100
            : 99.2 + (seed % 35) / 100
      ).toFixed(2)
    );

    const riskText =
      level === '健康'
        ? '核心指标稳定，当前未发现明显风险。'
        : level === '关注'
          ? '存在轻微波动，建议纳入重点观察。'
          : '存在质量异常，需要尽快排查处理。';

    return {
      id: target.item.id,
      name: target.item.name,
      type: target.label,
      region: target.item.region,
      site: target.item.site,
      score,
      level,
      summary: `${target.label}「${target.item.name}」诊断完成，${riskText}`,
      metrics: [
        { label: '可用率', value: `${availability}%`, status: getAvailabilityStatus(availability) },
        { label: '时延', value: `${latency}ms`, status: getLatencyStatus(latency) },
        { label: '丢包', value: `${loss}%`, status: getLossStatus(loss) },
        { label: '健康评分', value: `${score}`, status: getScoreStatus(score) },
      ],
      findings: [
        level === '健康' ? '近24小时关键指标处于稳定区间' : '近24小时存在指标波动，峰值集中在业务高峰时段',
        `${target.item.region} 接入侧链路质量${level === '异常' ? '低于基线' : '符合当前业务基线'}`,
        `业务安装点「${target.item.site}」最近一次资料更新时间为 ${target.item.updatedAt}`,
      ],
      suggestions: [
        level === '异常' ? '建议立即发起报障并关联本次诊断结果' : '建议保持当前巡检策略并持续观察趋势',
        level === '健康' ? '可纳入低频巡检清单' : '建议提高该业务未来7天巡检频次',
        '如需进一步定位，可继续发起单业务深度诊断',
      ],
    };
  });

  const averageScore = Math.round(results.reduce((sum, item) => sum + item.score, 0) / Math.max(1, results.length));
  const abnormalCount = results.filter((item) => item.level === '异常').length;
  const warningCount = results.filter((item) => item.level === '关注').length;
  const typeSummary = Array.from(new Set(results.map((item) => item.type))).join('、') || '业务';

  return {
    title: '业务诊断报告',
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    total: results.length,
    averageScore,
    summary: `本次共诊断 ${results.length} 条业务，覆盖 ${typeSummary}。平均健康评分 ${averageScore} 分，${abnormalCount} 条异常，${warningCount} 条需要关注。`,
    results,
    nextActions: [
      abnormalCount > 0 ? '优先处理异常业务，建议直接发起报障并附带诊断结果。' : '当前未发现严重异常，可保持日常巡检节奏。',
      warningCount > 0 ? '对关注业务设置未来7天重点观察，跟踪时延、丢包和可用率变化。' : '关注业务数量较少，可按现有服务等级继续运营。',
      '如客户需要汇报材料，可基于本次诊断结果继续生成运行说明。',
    ],
  };
};

