import { TicketItem } from '../types/ticket';

export const INITIAL_TICKETS: TicketItem[] = [
  {
    id: 'TK20260401',
    bizName: '专线',
    title: '合肥总部到阜阳专线告警',
    status: 'processing',
    owner: '安徽省运维值守组',
    eta: '预计 20 分钟',
    updatedAt: '11:20'
  },
  {
    id: 'TK20260387',
    bizName: 'IDC 动环',
    title: '合肥滨湖机房湿度预警',
    status: 'restored',
    owner: '机房运维组',
    eta: '已恢复',
    updatedAt: '10:48'
  }
];
