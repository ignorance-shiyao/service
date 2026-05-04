import { describe, expect, it } from 'vitest';
import { decideAutoMoveToCustomerConfirm } from './ticketFlowPolicy';

describe('decideAutoMoveToCustomerConfirm', () => {
  it('allows normal single ticket', () => {
    const result = decideAutoMoveToCustomerConfirm({
      ticketCount: 1,
      severity: '中',
      desc: '链路有轻微抖动',
    });
    expect(result.allow).toBe(true);
  });

  it('blocks high severity', () => {
    const result = decideAutoMoveToCustomerConfirm({
      ticketCount: 1,
      severity: '高',
      desc: '核心专线异常',
    });
    expect(result.allow).toBe(false);
    expect(result.reason).toContain('高严重度');
  });

  it('blocks batch tickets', () => {
    const result = decideAutoMoveToCustomerConfirm({
      ticketCount: 3,
      severity: '中',
      desc: '批量业务波动',
    });
    expect(result.allow).toBe(false);
    expect(result.reason).toContain('批量报障');
  });
});
