import { TICKET_TEXT } from './ticketText';

type ReceiptAction = {
  key: string;
  label: string;
  ask: string;
  tone?: 'primary';
};

type ReceiptData = {
  title: string;
  fields: Array<{ label: string; value: string }>;
  nextSteps: string[];
  actions: ReceiptAction[];
};

export const buildTicketCustomerActionReceipt = (payload: {
  ticketId: string;
  actionText: string;
  timeText: string;
  followupText: string;
}): ReceiptData => ({
  title: TICKET_TEXT.customerActionReceiptTitle,
  fields: [
    { label: '工单号', value: payload.ticketId },
    { label: '处理内容', value: payload.actionText },
    { label: '操作时间', value: payload.timeText },
  ],
  nextSteps: [payload.followupText],
  actions: [{ key: 'track', label: '查看工单进度', ask: '查一下我最近的工单进度', tone: 'primary' }],
});

export const buildTicketCustomerConfirmGuideReceipt = (ticketId: string): ReceiptData => ({
  title: TICKET_TEXT.customerConfirmGuideTitle,
  fields: [
    { label: '工单号', value: ticketId },
    { label: '当前状态', value: TICKET_TEXT.pendingConfirmStatus },
    { label: '下一步', value: '确认完成 / 二次受理' },
  ],
  nextSteps: [
    '若问题已恢复：点击确认完成并归档',
    '若仍有影响：点击二次受理并补充现象',
  ],
  actions: [{ key: 'open', label: '打开工单详情', ask: '查一下我最近的工单进度', tone: 'primary' }],
});

export const buildTicketFaultReceipt = (payload: {
  ticketId: string;
  responseMinutes: number;
  restoreHours: number;
  owner: string;
  ticketCount: number;
}): ReceiptData => ({
  title: TICKET_TEXT.faultReceiptTitle,
  fields: [
    { label: '工单号', value: payload.ticketId || '已生成' },
    { label: '承诺响应', value: `${payload.responseMinutes}分钟` },
    { label: '预计恢复', value: `${payload.restoreHours}小时` },
    { label: '当前跟进', value: payload.owner },
    { label: '影响业务', value: `${payload.ticketCount}条` },
  ],
  nextSteps: [
    '继续补充现象截图/日志（可加速定位）',
    '在工单追踪中实时查看状态变化',
    '若超时未响应，可直接发送“催办工单”',
  ],
  actions: [
    { key: 'urge', label: '立即催办', ask: '催办工单', tone: 'primary' },
    { key: 'track', label: '查看工单进度', ask: '查一下我最近的工单进度' },
  ],
});
