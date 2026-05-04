import type { TicketItem } from '../../../../mock/assistant';
import { TICKET_TEXT, TICKET_URGE_LIMIT_MINUTES } from './ticketText';

type TicketCustomerAction = 'supplement' | 'urge' | 'confirm' | 'reopen';

type ReduceTicketActionInput = {
  ticket: TicketItem;
  action: TicketCustomerAction;
  now: number;
  timeText: string;
  note?: string;
};

type ReduceTicketActionResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      ticket: TicketItem;
      actionText: string;
      followupText: string;
    };

export const reduceTicketCustomerAction = (
  input: ReduceTicketActionInput
): ReduceTicketActionResult => {
  const { ticket, action, now, timeText, note } = input;
  const isPendingCustomerConfirm = ticket.status === TICKET_TEXT.pendingConfirmStatus;

  if (action === 'confirm' && !isPendingCustomerConfirm) {
    return { ok: false, reason: '当前状态不可确认完成，请先等待责任人处理回传。' };
  }
  if (action === 'reopen' && !isPendingCustomerConfirm) {
    return { ok: false, reason: '当前状态不可发起二次受理。' };
  }
  if ((action === 'supplement' || action === 'urge') && isPendingCustomerConfirm) {
    return { ok: false, reason: '当前工单待客户确认，请执行确认完成或二次受理。' };
  }

  if (action === 'urge') {
    const remainMs = (ticket.lastUrgedAt || 0) + TICKET_URGE_LIMIT_MINUTES * 60 * 1000 - now;
    if (remainMs > 0) {
      return { ok: false, reason: `催办限频中，请 ${Math.ceil(remainMs / 60000)} 分钟后再试。` };
    }
    const actionText = `已对工单 ${ticket.id} 发起催办`;
    return {
      ok: true,
      actionText,
      followupText: `已通知责任人和当班主管，预计 ${TICKET_URGE_LIMIT_MINUTES} 分钟内反馈进展。`,
      ticket: {
        ...ticket,
        lastUrgedAt: now,
        updatedAt: `${new Date().toISOString().slice(0, 10)} ${timeText}`,
        timeline: [...ticket.timeline, { time: timeText, text: note ? `${actionText}：${note}` : actionText }],
      },
    };
  }

  if (action === 'supplement') {
    const actionText = `已补充工单 ${ticket.id} 现场信息`;
    return {
      ok: true,
      actionText,
      followupText: '补充信息已同步到处理队列，可加速根因定位。',
      ticket: {
        ...ticket,
        updatedAt: `${new Date().toISOString().slice(0, 10)} ${timeText}`,
        timeline: [...ticket.timeline, { time: timeText, text: note ? `${actionText}：${note}` : actionText }],
      },
    };
  }

  if (action === 'confirm') {
    const actionText = `已确认工单 ${ticket.id} 处理完成`;
    return {
      ok: true,
      actionText,
      followupText: '该工单将进入归档，可在历史中查看处置记录。',
      ticket: {
        ...ticket,
        status: TICKET_TEXT.doneStatus,
        updatedAt: `${new Date().toISOString().slice(0, 10)} ${timeText}`,
        timeline: [...ticket.timeline, { time: timeText, text: note ? `${actionText}：${note}` : actionText }],
      },
    };
  }

  const actionText = `已申请工单 ${ticket.id} 二次受理`;
  return {
    ok: true,
    actionText,
    followupText: '已重新派单，责任人将复核并回传结果。',
    ticket: {
      ...ticket,
      status: TICKET_TEXT.processingStatus,
      updatedAt: `${new Date().toISOString().slice(0, 10)} ${timeText}`,
      timeline: [...ticket.timeline, { time: timeText, text: note ? `${actionText}：${note}` : actionText }],
    },
  };
};

export type { ReduceTicketActionInput, ReduceTicketActionResult, TicketCustomerAction };
