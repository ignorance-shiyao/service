import { describe, expect, it } from 'vitest';
import {
  buildFaultDescriptionPayload,
  buildFaultPrecheckPayload,
  buildDiagnosisCompletionPayload,
  buildDiagnosisPriorityPayload,
  buildDiagnosisStagePayload,
  buildImpactSupplementPayload,
  buildQaExpansionPayload,
  buildQuantumKeyHealthPayload,
  buildQuantumTopologyPayload,
  buildReportCustomerBriefPayload,
  buildReportRiskCustomerEmailPayload,
  buildReportRiskCustomerExplanationPayload,
  buildReportRiskDowngradePayload,
  buildReportRiskSmsPayload,
  buildSlaCheckPayload,
  getPrimaryQaSourceId,
  getRelatedKnowledgeForQa,
  normalizeCustomerContext,
  parsePersistedSessions,
} from './useAiDock';
import type { TicketItem } from '../../../../mock/assistant';
import { FAQ_ITEMS, REPORTS } from '../../../../mock/assistant';

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

  it('resolves primary and related knowledge from qa sources', () => {
    const payload = {
      conclusion: '量子链路安全建议 [1]',
      explanation: '建议先小范围验证 [1]',
      sourceId: 'sdwan_1',
      sourceIds: ['sdwan_1'],
      sources: [{ id: 'sdwan_1', title: '量子加密保护是什么' }],
    };

    expect(getPrimaryQaSourceId(payload)).toBe('sdwan_1');
    const related = getRelatedKnowledgeForQa(payload);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((item) => item.business === 'SDWAN')).toBe(true);
    expect(related.some((item) => item.id === 'sdwan_1')).toBe(false);
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

  it('builds customer-facing report brief when no diagnosis report exists', () => {
    const customer = normalizeCustomerContext({ name: '测试客户', code: 'CUST-TEST' }, 0);
    const payload = buildReportCustomerBriefPayload(REPORTS[0], customer);

    expect(payload.conclusion).toContain('客户汇报话术');
    expect(payload.explanation).toContain('测试客户');
    expect(payload.explanation).toContain(REPORTS[0].summary);
    expect(payload.explanation).toContain('业务质量');
    expect(payload.explanation).toContain('需关注风险');
    expect(payload.explanation).toContain('建议下一步');
    expect(payload.suggestions).toContain('导出报告');
  });

  it('keeps report export guidance aligned with direct download formats', () => {
    const faq = FAQ_ITEMS.find((item) => item.id === 'faq_7');

    expect(faq?.conclusion).toContain('Word');
    expect(faq?.conclusion).toContain('PDF');
    expect(faq?.conclusion).toContain('长图');
    expect(faq?.explanation).toContain('直接下载');
    expect(faq?.explanation).not.toContain('返回下载链接');
  });

  it('builds customer-safe explanations for report risks', () => {
    const customer = normalizeCustomerContext({ name: '测试客户', code: 'CUST-TEST' }, 0);
    const payload = buildReportRiskCustomerExplanationPayload(REPORTS[0], customer);

    expect(payload.conclusion).toContain('测试客户');
    expect(payload.explanation).toContain('整体可控');
    expect(payload.explanation).toContain('暂未形成持续业务中断');
    expect(payload.explanation).toContain('目标时间');
    expect(payload.explanation).not.toContain('完成复核或优化');
    expect(payload.explanation).toContain(REPORTS[0].risks?.[0].owner);
    expect(payload.suggestions).toContain('导出Word报告');
  });

  it('builds a formal customer email draft for report risks', () => {
    const customer = normalizeCustomerContext({ name: '测试客户', code: 'CUST-TEST' }, 0);
    const payload = buildReportRiskCustomerEmailPayload(REPORTS[0], customer);

    expect(payload.conclusion).toContain('客户邮件草稿');
    expect(payload.explanation).toContain('主题：');
    expect(payload.explanation).toContain('尊敬的测试客户相关负责人');
    expect(payload.explanation).toContain('此致');
    expect(payload.suggestions).toContain('导出Word报告');
  });

  it('builds risk downgrade conditions from report risks', () => {
    const payload = buildReportRiskDowngradePayload(REPORTS[0]);

    expect(payload.conclusion).toContain('风险项降级');
    expect(payload.explanation).toContain('指标恢复');
    expect(payload.explanation).toContain('观察期');
    expect(payload.explanation).toContain(REPORTS[0].risks?.[0].owner);
  });

  it('builds a concise SMS version for report risks', () => {
    const customer = normalizeCustomerContext({ name: '测试客户', code: 'CUST-TEST' }, 0);
    const payload = buildReportRiskSmsPayload(REPORTS[0], customer);

    expect(payload.conclusion).toContain('短信版');
    expect(payload.explanation).toContain('整体运行平稳');
    expect(payload.explanation).toContain('当前重点关注');
    expect(payload.explanation.length).toBeLessThan(360);
    expect(payload.suggestions).toContain('联系客户经理');
  });

  it('builds a usable fault description template', () => {
    const customer = normalizeCustomerContext({ name: '测试客户', code: 'CUST-TEST' }, 0);
    const payload = buildFaultDescriptionPayload(customer);

    expect(payload.explanation).toContain('客户：测试客户');
    expect(payload.explanation).toContain('现象');
    expect(payload.explanation).toContain('诉求');
    expect(payload.suggestions).toContain('发起报障');
  });

  it('builds diagnosis priority guidance for customer business types', () => {
    const customer = normalizeCustomerContext({ name: '测试客户', code: 'CUST-TEST', businessTypes: ['SDWAN', 'AIC'] }, 0);
    const payload = buildDiagnosisPriorityPayload(customer);

    expect(payload.conclusion).toBe('推荐诊断优先级');
    expect(payload.explanation).toContain('建议优先诊断');
    expect(payload.suggestions?.some((item) => item.includes('诊断'))).toBe(true);
  });

  it('builds diagnosis stage explanation from progress text', () => {
    const payload = buildDiagnosisStagePayload('诊断正在进行：关联告警与日志事件，请解释这个阶段在做什么');

    expect(payload.conclusion).toBe('诊断阶段解读');
    expect(payload.explanation).toContain('关联告警与日志事件');
    expect(payload.suggestions).toContain('联系客户经理');
  });

  it('builds diagnosis completion next actions', () => {
    const payload = buildDiagnosisCompletionPayload('量子隧道与选路策略诊断');

    expect(payload.conclusion).toContain('后续处置建议');
    expect(payload.explanation).toContain('诊断报告');
    expect(payload.suggestions).toContain('发起报障');
    expect(payload.suggestions).toContain('查看诊断历史');
  });

  it('checks fault form completeness before submit', () => {
    const payload = buildFaultPrecheckPayload('请校验这次报障是否信息完整：标题=未填写；业务=未选择；紧急程度=中；描述=未填写');

    expect(payload.conclusion).toBe('报障信息仍需补充');
    expect(payload.explanation).toContain('工单标题');
    expect(payload.explanation).toContain('报障业务');
    expect(payload.suggestions).toContain('补充影响范围');
  });

  it('builds quantum key health details with knowledge sources', () => {
    const payload = buildQuantumKeyHealthPayload();

    expect(payload.conclusion).toContain('密钥健康');
    expect(payload.sources?.length).toBeGreaterThan(0);
    expect(payload.suggestions).toContain('查看量子链路拓扑');
    expect(payload.suggestions).toContain('发起SD-WAN诊断');
  });

  it('builds quantum topology guidance with diagnostic next action', () => {
    const payload = buildQuantumTopologyPayload();

    expect(payload.conclusion).toContain('量子链路拓扑');
    expect(payload.explanation).toContain('量子隧道覆盖');
    expect(payload.sources?.length).toBeGreaterThan(0);
    expect(payload.suggestions).toContain('发起SD-WAN诊断');
  });
});
