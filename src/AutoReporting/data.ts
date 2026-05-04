
import { REPORTS } from '../mock/assistant';
import { ReportItem } from './types';

const parseMetric = (raw: string) => {
  const value = raw.match(/[\d.]+/)?.[0] || raw;
  const unit = raw.replace(value, '').trim();
  return { value, unit };
};

export const MOCK_REPORTS: ReportItem[] = REPORTS.map((report, index) => {
  const overallScore = 92 + (index % 5);
  return {
    id: report.id,
    title: report.title,
    period: report.periodType,
    createTime: `${new Date().getFullYear()}-${String(index + 1).padStart(2, '0')}-01 09:00:00`,
    status: 'published',
    smsSent: index % 2 === 0,
    overallScore,
    aiInterpretation: report.summary,
    highlights: report.metrics.slice(0, 4).map((metric, metricIndex) => {
      const parsed = parseMetric(metric.value);
      return {
        label: metric.label,
        value: parsed.value,
        unit: parsed.unit,
        trend: metricIndex % 2 === 0 ? 'up' : 'down',
      };
    }),
    recommendations: report.suggestions.map((suggestion, suggestionIndex) => ({
      type: suggestionIndex % 3 === 0 ? 'optimization' : suggestionIndex % 3 === 1 ? 'maintenance' : 'risk',
      title: `建议 ${suggestionIndex + 1}`,
      content: suggestion,
    })),
    regionalStats: [
      { region: '合肥', score: overallScore + 2, status: 'excellent' },
      { region: '芜湖', score: overallScore, status: 'good' },
      { region: '蚌埠', score: overallScore - 6, status: 'warning' },
    ],
    data: [
      {
        businessType: '政企业务',
        metrics: report.metrics.map((metric, metricIndex) => {
          const parsed = parseMetric(metric.value);
          return {
            name: metric.label,
            value: parsed.value,
            unit: parsed.unit || '',
            trend: metricIndex % 3 === 0 ? 'stable' : metricIndex % 2 === 0 ? 'up' : 'down',
            changeRate: metricIndex % 2 === 0 ? '3%' : '1.5%',
            status: metricIndex === 0 ? 'normal' : metricIndex === 1 ? 'warning' : 'normal',
          };
        }),
      },
    ],
  };
});
