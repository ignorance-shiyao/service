export type ReportMetric = { label: string; value: string };
export type ReportStatus = '正常' | '关注' | '异常';

export type ReportItem = {
  id: string;
  periodType: 'month' | 'week' | 'quarter';
  title: string;
  summary: string;
  metrics: ReportMetric[];
  sections?: { title: string; items: string[] }[];
  serviceQuality?: { name: string; availability: string; latency: string; loss: string; status: ReportStatus; note: string }[];
  risks?: { level: '高' | '中' | '低'; title: string; detail: string; owner: string; due: string }[];
  tickets?: { label: string; value: string; note: string }[];
  capacity?: { label: string; value: string; note: string }[];
  events: { time: string; text: string }[];
  suggestions: string[];
  nextActions?: { priority: 'P0' | 'P1' | 'P2'; action: string; owner: string; due: string }[];
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
    summary: '本月整体运行平稳，核心业务可用性保持在高位；出现 3 起需要关注的波动事件，均已完成处置并进入观察期。',
    metrics: [
      { label: '业务在线率', value: '99.2%' },
      { label: '告警', value: '12次' },
      { label: '自助报障', value: '2次' },
      { label: '平均恢复时长', value: '24min' },
    ],
    sections: [
      {
        title: '总体结论',
        items: [
          '专线、SD-WAN、5G 与智算业务整体稳定，月内未出现跨区域连续中断。',
          '告警主要集中在高峰期链路抖动、5G 接入成功率波动和智算队列拥塞三类场景。',
          '客户侧可感知影响均已在 SLA 范围内闭环，建议继续保留高峰窗口专项观察。',
        ],
      },
      {
        title: '客户影响',
        items: [
          '2 起事件存在短时访问变慢反馈，未形成持续业务不可用。',
          '合肥核心专线抖动涉及总部到分支访问体验，恢复后 24 小时未复现。',
          '智算队列拥塞影响批处理任务排队时长，扩容后峰值排队下降。',
        ],
      },
    ],
    serviceQuality: [
      { name: '总部-分支专线', availability: '99.35%', latency: '18ms', loss: '0.05%', status: '正常', note: '关键链路冗余切换正常' },
      { name: 'SD-WAN 互联', availability: '99.18%', latency: '24ms', loss: '0.08%', status: '关注', note: '晚高峰存在轻微抖动' },
      { name: '5G 接入', availability: '98.92%', latency: '32ms', loss: '0.12%', status: '关注', note: '接入成功率短时波动已修正' },
      { name: '智算资源池', availability: '99.41%', latency: '队列 11min', loss: '-', status: '正常', note: '扩容后排队恢复到目标区间' },
    ],
    risks: [
      { level: '中', title: '5G 高峰接入波动', detail: '晚高峰切片策略阈值偏保守，存在接入成功率再次波动风险。', owner: '无线优化组', due: '05-10 前复核' },
      { level: '中', title: '智算任务排队峰值', detail: '月末批量任务集中提交时，预留资源池不足会推高等待时间。', owner: '智算资源组', due: '05-15 前补齐预案' },
      { level: '低', title: '专线演练覆盖不足', detail: '个别分支仍未纳入周度切换演练，故障恢复路径验证不完整。', owner: '政企交付组', due: '05-20 前完成' },
    ],
    tickets: [
      { label: '客户反馈', value: '2 起', note: '均已回访确认恢复' },
      { label: '主动发现', value: '10 起', note: '告警平台自动识别并派发' },
      { label: 'SLA 内闭环', value: '100%', note: '本月无超时工单' },
      { label: '待观察项', value: '3 项', note: '进入下月跟踪清单' },
    ],
    capacity: [
      { label: '专线带宽峰值', value: '72%', note: '距离扩容阈值仍有余量' },
      { label: '5G 活跃终端峰值', value: '+8.4%', note: '建议继续观察晚高峰' },
      { label: '智算 GPU 利用率峰值', value: '86%', note: '批处理窗口需保留资源池' },
    ],
    events: [
      { time: '04-05 10:16', text: '合肥核心专线抖动告警，8分钟恢复' },
      { time: '04-12 21:40', text: '5G接入成功率短时波动，策略修正后恢复' },
      { time: '04-21 09:03', text: '智算调度队列拥塞，扩容后恢复正常' },
    ],
    suggestions: ['优化5G高峰切片策略阈值。', '为智算任务增加预留资源池。', '专线关键链路继续执行周度演练。'],
    nextActions: [
      { priority: 'P1', action: '完成 5G 高峰切片阈值复核并固化回退策略', owner: '无线优化组', due: '05-10' },
      { priority: 'P1', action: '为智算批处理任务建立预留资源池和触发阈值', owner: '智算资源组', due: '05-15' },
      { priority: 'P2', action: '补齐未覆盖分支的专线切换演练记录', owner: '政企交付组', due: '05-20' },
    ],
    trend,
  },
  {
    id: 'r_2026_w16',
    periodType: 'week',
    title: '2026 年第 16 周运行周报',
    summary: '周内运行稳定，告警处置效率提升；主要波动来自分支链路切换和 IDC 环境告警，均已完成处理。',
    metrics: [
      { label: '业务在线率', value: '99.4%' },
      { label: '告警', value: '4次' },
      { label: '自助报障', value: '1次' },
      { label: '平均恢复时长', value: '18min' },
    ],
    sections: [
      {
        title: '周度结论',
        items: [
          '本周没有持续性业务中断，客户反馈集中在短时访问变慢。',
          '链路切换流程有效，IDC 温控告警已完成现场复核。',
        ],
      },
    ],
    serviceQuality: [
      { name: '分支互联', availability: '99.46%', latency: '21ms', loss: '0.06%', status: '正常', note: '切换后稳定' },
      { name: 'IDC 托管', availability: '99.31%', latency: '内网 3ms', loss: '-', status: '关注', note: '温控需连续观察' },
    ],
    risks: [
      { level: '低', title: 'IDC 温控重复告警', detail: '机房局部温度波动仍需确认是否与空调策略相关。', owner: 'IDC 运维组', due: '本周五前复盘' },
    ],
    tickets: [
      { label: '本周工单', value: '1 起', note: '已处理完成' },
      { label: '主动告警', value: '4 次', note: '无升级事件' },
    ],
    capacity: [
      { label: '链路峰值利用率', value: '68%', note: '容量安全' },
      { label: 'IDC 环境余量', value: '正常', note: '温控策略待复核' },
    ],
    events: [
      { time: '周二 14:12', text: '芜湖分支链路切换成功' },
      { time: '周四 09:56', text: 'IDC温控越阈告警处置完成' },
    ],
    suggestions: ['保持专线巡检频率。', '继续观测5G终端活跃波动。'],
    nextActions: [
      { priority: 'P2', action: '复盘 IDC 温控告警原因并更新巡检项', owner: 'IDC 运维组', due: '周五' },
      { priority: 'P2', action: '继续跟踪 5G 终端活跃峰值变化', owner: '无线优化组', due: '下周一' },
    ],
    trend,
  },
  {
    id: 'r_2026_q1',
    periodType: 'quarter',
    title: '2026 年一季度运行季报',
    summary: '季度整体向好，重点业务可用性持续改善；量子链路覆盖、智算排队效率和告警闭环能力均有提升。',
    metrics: [
      { label: '业务在线率', value: '99.1%' },
      { label: '告警', value: '41次' },
      { label: '自助报障', value: '9次' },
      { label: '平均恢复时长', value: '27min' },
    ],
    sections: [
      {
        title: '季度结论',
        items: [
          '重点业务可用性较上季度提升，客户侧连续影响事件下降。',
          '量子链路覆盖扩展到 12 个地市，安全能力具备更大范围落地基础。',
          '智算排队峰值下降 18%，但月末资源集中使用仍需提前预约和容量预测。',
        ],
      },
    ],
    serviceQuality: [
      { name: '量子安全链路', availability: '99.22%', latency: '20ms', loss: '0.04%', status: '正常', note: '覆盖范围提升' },
      { name: '智算调度', availability: '99.08%', latency: '队列 14min', loss: '-', status: '关注', note: '月末峰值仍需治理' },
      { name: '政企专线', availability: '99.16%', latency: '19ms', loss: '0.07%', status: '正常', note: '恢复效率提升' },
    ],
    risks: [
      { level: '中', title: '告警噪声影响派单效率', detail: '低价值告警仍占比较高，影响值班人员定位关键事件。', owner: '网管平台组', due: 'Q2 首月完成分级' },
      { level: '中', title: '高峰容量预测不足', detail: '智算和 5G 高峰重叠时，资源预约与切片保障需要提前联动。', owner: '资源运营组', due: 'Q2 建立预测机制' },
    ],
    tickets: [
      { label: '季度工单', value: '9 起', note: '客户侧反馈下降' },
      { label: '告警总量', value: '41 次', note: '需继续降噪' },
      { label: '平均恢复', value: '27min', note: '较上季改善' },
    ],
    capacity: [
      { label: '量子链路覆盖', value: '12 地市', note: '具备推广条件' },
      { label: '智算排队峰值', value: '-18%', note: '扩容效果明显' },
      { label: '关键链路容量', value: '安全', note: '暂不触发扩容' },
    ],
    events: [
      { time: 'Q1', text: '量子链路覆盖提升至12个地市' },
      { time: 'Q1', text: '智算任务排队峰值下降18%' },
    ],
    suggestions: ['推进告警分级降噪。', '强化高峰期容量预测机制。'],
    nextActions: [
      { priority: 'P1', action: '建立告警分级规则，压降低价值告警占比', owner: '网管平台组', due: 'Q2 首月' },
      { priority: 'P1', action: '上线高峰容量预测和资源预约联动机制', owner: '资源运营组', due: 'Q2' },
      { priority: 'P2', action: '选择 2 个地市进行量子安全链路推广复盘', owner: '政企产品组', due: 'Q2' },
    ],
    trend,
  },
];
