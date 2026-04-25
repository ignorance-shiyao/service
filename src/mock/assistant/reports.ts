export type ReportMetric = { label: string; value: string };

export type ReportItem = {
  id: string;
  periodType: 'month' | 'week' | 'quarter';
  title: string;
  summary: string;
  metrics: ReportMetric[];
  events: { time: string; text: string }[];
  suggestions: string[];
  trend: { day: string; current: number; prev: number; yoy: number }[];
};

const trend = Array.from({ length: 30 }, (_, i) => {
  const day = `${i + 1}`.padStart(2, '0');
  return {
    day,
    current: 96 + Math.sin(i / 3) * 2.4 + (i % 5) * 0.08,
    prev: 95.2 + Math.cos(i / 4) * 2.0,
    yoy: 94.8 + Math.sin(i / 5) * 1.8,
  };
});

export const REPORTS: ReportItem[] = [
  {
    id: 'r_2026_04',
    periodType: 'month',
    title: '2026 年 4 月运行月报',
    summary: '本月整体运行平稳，关键事件 3 件。',
    metrics: [
      { label: '业务在线率', value: '99.2%' },
      { label: '告警', value: '12次' },
      { label: '自助报障', value: '2次' },
      { label: '平均恢复时长', value: '24min' },
    ],
    events: [
      { time: '04-05 10:16', text: '合肥核心专线抖动告警，8分钟恢复' },
      { time: '04-12 21:40', text: '5G接入成功率短时波动，策略修正后恢复' },
      { time: '04-21 09:03', text: '智算调度队列拥塞，扩容后恢复正常' },
    ],
    suggestions: ['优化5G高峰切片策略阈值。', '为智算任务增加预留资源池。', '专线关键链路继续执行周度演练。'],
    trend,
  },
  {
    id: 'r_2026_w16',
    periodType: 'week',
    title: '2026 年第 16 周运行周报',
    summary: '周内运行稳定，告警处置效率提升。',
    metrics: [
      { label: '业务在线率', value: '99.4%' },
      { label: '告警', value: '4次' },
      { label: '自助报障', value: '1次' },
      { label: '平均恢复时长', value: '18min' },
    ],
    events: [
      { time: '周二 14:12', text: '芜湖分支链路切换成功' },
      { time: '周四 09:56', text: 'IDC温控越阈告警处置完成' },
    ],
    suggestions: ['保持专线巡检频率。', '继续观测5G终端活跃波动。'],
    trend,
  },
  {
    id: 'r_2026_q1',
    periodType: 'quarter',
    title: '2026 年一季度运行季报',
    summary: '季度整体向好，重点业务可用性持续改善。',
    metrics: [
      { label: '业务在线率', value: '99.1%' },
      { label: '告警', value: '41次' },
      { label: '自助报障', value: '9次' },
      { label: '平均恢复时长', value: '27min' },
    ],
    events: [
      { time: 'Q1', text: '量子链路覆盖提升至12个地市' },
      { time: 'Q1', text: '智算任务排队峰值下降18%' },
    ],
    suggestions: ['推进告警分级降噪。', '强化高峰期容量预测机制。'],
    trend,
  },
];
