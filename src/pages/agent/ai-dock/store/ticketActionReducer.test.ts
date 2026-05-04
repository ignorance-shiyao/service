import { describe, expect, it } from 'vitest';
import { reduceTicketCustomerAction } from './ticketActionReducer';
import type { TicketItem } from '../../../../mock/assistant';
import { TICKET_TEXT } from './ticketText';

const makeTicket = (overrides: Partial<TicketItem> = {}): TicketItem => ({
  id: 'TKT-TEST-1',
  title: '测试工单',
  business: '政企专线',
  status: '处理中',
  owner: '王工',
  createdAt: '2026-05-01 10:00',
  updatedAt: '2026-05-01 10:05',
  detail: '测试详情',
  timeline: [{ time: '10:00', text: '创建' }],
  ...overrides,
});

describe('reduceTicketCustomerAction', () => {
  it('blocks confirm when status is not pending confirm', () => {
    const result = reduceTicketCustomerAction({
      ticket: makeTicket({ status: '处理中' }),
      action: 'confirm',
      now: Date.now(),
      timeText: '10:10',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('不可确认完成');
    }
  });

  it('moves ticket to done on confirm from pending confirm', () => {
    const result = reduceTicketCustomerAction({
      ticket: makeTicket({ status: TICKET_TEXT.pendingConfirmStatus }),
      action: 'confirm',
      now: Date.now(),
      timeText: '10:12',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ticket.status).toBe(TICKET_TEXT.doneStatus);
      expect(result.actionText).toContain('确认');
    }
  });

  it('enforces urge rate limit', () => {
    const now = Date.now();
    const result = reduceTicketCustomerAction({
      ticket: makeTicket({ lastUrgedAt: now - 60 * 1000 }),
      action: 'urge',
      now,
      timeText: '10:15',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('催办限频');
    }
  });
});
