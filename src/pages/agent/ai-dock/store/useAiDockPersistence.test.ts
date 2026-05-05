import { describe, expect, it } from 'vitest';
import {
  buildImpactSupplementPayload,
  buildQaExpansionPayload,
  buildSlaCheckPayload,
  normalizeCustomerContext,
  parsePersistedSessions,
} from './useAiDock';
import type { TicketItem } from '../../../../mock/assistant';

describe('ai dock persisted session hardening', () => {
  it('fills missing customer fields from a stable fallback', () => {
    const customer = normalizeCustomerContext({ name: '测试客户', code: 'CUST-TEST' }, 0);

    expect(customer.name).toBe('测试客户');
    expect(customer.code).toBe('CUST-TEST');
    expect(customer.businessTypes.length).toBeGreaterThan(0);
    expect(customer.accountManager.name).toBeTruthy();
    expect(customer.accountManager.phone).toBeTruthy();
    expect(customer.slas.responseMinutes).toBeGreaterThan(0);
    expect(customer.slas.restoreHours).toBeGreaterThan(0);
  });

  it('normalizes old persisted sessions without account manager or SLA fields', () => {
    const parsed = parsePersistedSessions({
      activeSessionId: 'session_old',
      sessions: [
        {
          id: 'session_old',
          title: '旧会话',
          createdAt: 0,
          updatedAt: 1,
          customer: { name: '旧客户', code: 'CUST-OLD' },
          messages: [],
          tickets: [],
        },
      ],
    });

    expect(parsed?.activeSessionId).toBe('session_old');
    expect(parsed?.sessions[0].customer.name).toBe('旧客户');
    expect(parsed?.sessions[0].customer.accountManager.name).toBeTruthy();
    expect(parsed?.sessions[0].customer.slas.responseMinutes).toBeGreaterThan(0);
  });
});

describe('ai dock qa expansion payload', () => {
  it('does not append citation marks into the generated title body', () => {
    const payload = buildQaExpansionPayload(
      {
        conclusion: '量子链路安全建议 [1]',
        explanation: '建议先小范围验证 [1]',
        sourceId: 'sdwan_1',
        sourceIds: ['sdwan_1'],
        sources: [{ id: 'sdwan_1', title: '量子加密保护是什么' }],
      },
      '生成实施清单'
    );

    expect(payload.conclusion).toBe('量子链路安全建议实施清单 [1]');
    expect(payload.conclusion).not.toContain('[1]实施');
    expect(payload.explanation).toContain('1. 先确认适用业务范围');
    expect(payload.sources?.[0].title).toBe('量子加密保护是什么');
  });

  it('returns a distinct risk-point response for risk followups', () => {
    const payload = buildQaExpansionPayload(
      {
        conclusion: '量子链路安全建议 [1]',
        explanation: '建议先小范围验证 [1]',
        sourceId: 'sdwan_1',
      },
      '列出风险点'
    );

    expect(payload.conclusion).toBe('量子链路安全建议风险点 [1]');
    expect(payload.explanation).toContain('主要风险包括');
    expect(payload.suggestions).toContain('生成实施清单');
  });
});

describe('ai dock action payload completeness', () => {
  const ticket: TicketItem = {
    id: 'TKT-TEST-1',
    title: '测试工单',
    business: '政企专线',
    status: '处理中',
    owner: '王工',
    createdAt: '2026-05-01 10:00',
    updatedAt: '2026-05-01 10:10',
    detail: '测试详情',
    timeline: [],
  };

  it('builds an actionable SLA check payload', () => {
    const customer = normalizeCustomerContext({ name: '测试客户', code: 'CUST-TEST' }, 0);
    const payload = buildSlaCheckPayload(ticket, customer);

    expect(payload.conclusion).toContain(ticket.id);
    expect(payload.explanation).toContain('SLA承诺');
    expect(payload.suggestions).toContain('催办工单');
    expect(payload.suggestions).toContain('查看工单详情');
  });

  it('builds impact supplement guidance with next actions', () => {
    const payload = buildImpactSupplementPayload();

    expect(payload.explanation).toContain('受影响业务或站点');
    expect(payload.explanation).toContain('是否可复现');
    expect(payload.suggestions).toContain('发起报障');
    expect(payload.suggestions).toContain('联系客户经理');
  });
});
