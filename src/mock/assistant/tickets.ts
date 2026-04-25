export type TicketStatus = '待受理' | '处理中' | '待验证' | '已完成';

export type TicketItem = {
  id: string;
  title: string;
  business: string;
  status: TicketStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  detail: string;
  timeline: { time: string; text: string }[];
};

export const TICKETS: TicketItem[] = [
  {
    id: 'TKT-20260423-1021',
    title: '阜阳分支专线抖动告警处置',
    business: '政企专线',
    status: '处理中',
    owner: '王工',
    createdAt: '2026-04-23 10:21',
    updatedAt: '2026-04-23 10:43',
    detail: '链路抖动导致语音质量下降，已进入QoS策略优化阶段。',
    timeline: [
      { time: '10:21', text: '工单创建，自动关联诊断报告。' },
      { time: '10:26', text: '一线工程师受理并启动远程排查。' },
      { time: '10:43', text: '定位QoS队列拥塞，处理中。' },
    ],
  },
  {
    id: 'TKT-20260422-0897',
    title: 'IDC高热区预警处置',
    business: 'IDC动环',
    status: '待验证',
    owner: '赵工',
    createdAt: '2026-04-22 17:03',
    updatedAt: '2026-04-22 18:20',
    detail: '空调送风角度已调整，等待温度回落验证。',
    timeline: [
      { time: '17:03', text: '工单创建。' },
      { time: '17:35', text: '完成现场调整。' },
      { time: '18:20', text: '进入待验证。' },
    ],
  },
];
