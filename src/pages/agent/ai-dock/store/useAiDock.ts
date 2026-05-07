import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showAppToast } from '../../../../components/AppFeedback';
import {
  KNOWLEDGE_ITEMS,
  KnowledgeItem,
  FaqItem,
  REPORTS,
  ReportItem,
  DIAGNOSIS_TEMPLATES,
  DiagnosisTemplate,
  TICKETS,
  TicketItem,
  MANAGED_BUSINESSES,
} from '../../../../mock/assistant';
import { createId } from '../utils/id';
import { delay } from '../utils/delay';
import { IntentType } from './mockIntent';
import { resolveIntent } from './intentRouter';
import { buildKnowledgeQaPayload, findFaq, matchKnowledge, searchKnowledge } from './knowledgeFlow';
import {
  normalizeBusinessDiagnosisReportPayload,
} from './businessDiagnosis';
import { runBusinessDiagnosisFlow as runBusinessDiagnosisFlowRunner, runDiagnosisFlow as runDiagnosisFlowRunner, submitFaultTicketFlow } from './aiDockFlows';
import { buildBusinessQueryData } from './businessQueryData';
import { buildSessionSnapshotTags, extractMessagePreview } from './sessionMeta';
import type {
  BusinessDiagnosisReportPayload,
  BusinessDiagnosisResult,
  BusinessDiagnosisTarget,
  BusinessQueryItem,
  FaultContext,
} from './aiDockTypes';
import {
  getPersistedStamp,
  readLocalPersisted,
  readRemotePersisted,
  writeLocalPersisted,
  writeRemotePersisted,
} from './sessionPersistence';
import {
  getManagedBusinessStatus,
} from './metricSemantics';
import { trackFallback, trackIntentHit, trackKnowledgeFeedback } from './opsMetrics';
import { decideAutoMoveToCustomerConfirm } from './ticketFlowPolicy';
import { TICKET_TEXT } from './ticketText';
import { buildTicketCustomerActionReceipt, buildTicketCustomerConfirmGuideReceipt, buildTicketFaultReceipt } from './ticketReceiptBuilders';
import { buildTicketPendingConfirmNotice, buildTicketStillProcessingNotice } from './ticketNoticeBuilders';
import { reduceTicketCustomerAction } from './ticketActionReducer';

export type MessageRole = 'assistant' | 'user' | 'system';
export type MessageKind =
  | 'text'
  | 'qa'
  | 'receiptCard'
  | 'businessQuery'
  | 'knowledgeCard'
  | 'reportCard'
  | 'diagnosisSelect'
  | 'diagnosisProgress'
  | 'diagnosisReport'
  | 'businessDiagnosisSelect'
  | 'businessDiagnosisReport'
  | 'faultForm'
  | 'ticketCard'
  | 'systemNotice'
  | 'fallback';

export type QaPayload = {
  conclusion: string;
  explanation: string;
  suggestions?: string[];
  sourceId?: string;
  sourceIds?: string[];
  sources?: Array<{ id: string; title: string; updatedAt?: string }>;
  sourceUpdatedAt?: string;
  followups?: string[];
};

export type AiMessage = {
  id: string;
  role: MessageRole;
  kind: MessageKind;
  text?: string;
  createdAt: number;
  data?: any;
};

export type DrawerState =
  | { type: 'knowledge'; item: KnowledgeItem }
  | { type: 'reportHistory'; list: ReportItem[] }
  | { type: 'diagnosisHistory'; list: DiagnosisTemplate[] }
  | { type: 'ticket'; item: TicketItem }
  | null;

export type QuickChip = {
  id: string;
  label: string;
  prompt: string;
};

type KnowledgeFeedbackType = 'useful' | 'useless' | 'old';

export type AiConversationSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  customer: CustomerContext;
  messages: AiMessage[];
  tickets: TicketItem[];
  activeReportId: string;
  ticketDraftFromDiagnosis: DiagnosisTemplate | null;
  faultContext: FaultContext | null;
  faultContexts: FaultContext[];
};

export type AiConversationSessionMeta = {
  id: string;
  title: string;
  updatedAt: number;
  lastText: string;
  messageCount: number;
  customerName: string;
  snapshotTags: Array<{ label: string; tone: 'blue' | 'cyan' | 'indigo' | 'green' | 'amber' }>;
};

type PersistedAiDockSessions = {
  sessions: AiConversationSession[];
  activeSessionId: string;
};

export type {
  BusinessDiagnosisReportPayload,
  BusinessDiagnosisResult,
  BusinessDiagnosisTarget,
  BusinessQueryItem,
  FaultContext,
} from './aiDockTypes';

export const AI_DOCK_SESSION_STORAGE_KEY = 'ai_dock_sessions_json_v1';
const AI_DOCK_SESSION_ENDPOINT = '/mock-api/ai-dock-sessions';

const welcomeMessages = (): AiMessage[] => [];

const pickDiagnosis = (input: string): DiagnosisTemplate | undefined => {
  if (input.includes('专线')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'LINE');
  if (input.includes('5g')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === '5G');
  if (input.includes('idc')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'IDC');
  if (input.includes('sdwan') || input.includes('量子')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'SDWAN');
  if (input.includes('智算')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'AIC');
  return undefined;
};

const STREAM_PACE = {
  initialDelay: 260,
  punctuationPause: 210,
  lineBreakPause: 260,
  introMin: 86,
  introSpan: 40,
  normalMin: 68,
  normalSpan: 52,
};

const buildKnowledgeSources = (ids: Array<string | undefined>) =>
  ids
    .filter((id): id is string => Boolean(id))
    .map((id) => KNOWLEDGE_ITEMS.find((item) => item.id === id))
    .filter((item): item is KnowledgeItem => Boolean(item))
    .map((item) => ({
      id: item.id,
      title: item.title,
      updatedAt: item.updatedAt,
    }));

type FlowStatus = 'running' | 'done' | 'stopped';
type FlowLogEntry = { time: string; text: string };

const nowFlowTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const appendFlowLog = (logs: FlowLogEntry[], text: string): FlowLogEntry[] => [
  ...logs,
  { time: nowFlowTime(), text },
];

type CustomerContext = {
  name: string;
  code: string;
  businessTypes: Array<'LINE' | '5G' | 'IDC' | 'SDWAN' | 'AIC'>;
  accountManager: { name: string; phone: string; email: string };
  slas: { responseMinutes: number; restoreHours: number };
};

const CUSTOMER_POOL: CustomerContext[] = [
  { name: '安徽交控集团', code: 'CUST-AHJT-0001', businessTypes: ['LINE', 'SDWAN', 'IDC'], accountManager: { name: '李明', phone: '13800005678', email: 'liming@ahjt.example.com' }, slas: { responseMinutes: 45, restoreHours: 8 } },
  { name: '合肥工业大学', code: 'CUST-HFUT-0002', businessTypes: ['LINE', '5G', 'IDC'], accountManager: { name: '王婷', phone: '13900002088', email: 'wangting@hfut.example.com' }, slas: { responseMinutes: 60, restoreHours: 8 } },
  { name: '奇瑞汽车股份', code: 'CUST-CHERY-0003', businessTypes: ['LINE', '5G', 'AIC', 'SDWAN'], accountManager: { name: '赵凯', phone: '13700009221', email: 'zhaokai@chery.example.com' }, slas: { responseMinutes: 45, restoreHours: 8 } },
  { name: '科大讯飞股份', code: 'CUST-IFLYTEK-0004', businessTypes: ['AIC', 'SDWAN', 'LINE'], accountManager: { name: '周宁', phone: '13600001123', email: 'zhouning@iflytek.example.com' }, slas: { responseMinutes: 45, restoreHours: 8 } },
  { name: '安徽电力公司', code: 'CUST-STATEGRID-0005', businessTypes: ['LINE', 'IDC', '5G'], accountManager: { name: '陈璐', phone: '13500000029', email: 'chenlu@stategrid.example.com' }, slas: { responseMinutes: 45, restoreHours: 8 } },
  { name: '中国声谷园区', code: 'CUST-SOUNDVALLEY-0006', businessTypes: ['5G', 'SDWAN', 'AIC'], accountManager: { name: '许航', phone: '18800008712', email: 'xuhang@soundvalley.example.com' }, slas: { responseMinutes: 60, restoreHours: 8 } },
  { name: '芜湖港航集团', code: 'CUST-WHPORT-0007', businessTypes: ['LINE', 'SDWAN'], accountManager: { name: '何晶', phone: '18900006619', email: 'hejing@whport.example.com' }, slas: { responseMinutes: 90, restoreHours: 12 } },
];

const randomCustomerContext = (seed?: number): CustomerContext => {
  const index = typeof seed === 'number' ? seed % CUSTOMER_POOL.length : Math.floor(Math.random() * CUSTOMER_POOL.length);
  return CUSTOMER_POOL[index];
};

export const normalizeCustomerContext = (value: unknown, seed?: number): CustomerContext => {
  const fallback = randomCustomerContext(seed);
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Partial<CustomerContext>;
  const businessTypes = Array.isArray(raw.businessTypes) && raw.businessTypes.length > 0
    ? raw.businessTypes.filter((type): type is CustomerContext['businessTypes'][number] =>
      ['LINE', '5G', 'IDC', 'SDWAN', 'AIC'].includes(type as string)
    )
    : fallback.businessTypes;

  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : fallback.name,
    code: typeof raw.code === 'string' && raw.code.trim() ? raw.code : fallback.code,
    businessTypes: businessTypes.length > 0 ? businessTypes : fallback.businessTypes,
    accountManager: {
      name: typeof raw.accountManager?.name === 'string' && raw.accountManager.name.trim()
        ? raw.accountManager.name
        : fallback.accountManager.name,
      phone: typeof raw.accountManager?.phone === 'string' && raw.accountManager.phone.trim()
        ? raw.accountManager.phone
        : fallback.accountManager.phone,
      email: typeof raw.accountManager?.email === 'string' && raw.accountManager.email.trim()
        ? raw.accountManager.email
        : fallback.accountManager.email,
    },
    slas: {
      responseMinutes: typeof raw.slas?.responseMinutes === 'number'
        ? raw.slas.responseMinutes
        : fallback.slas.responseMinutes,
      restoreHours: typeof raw.slas?.restoreHours === 'number'
        ? raw.slas.restoreHours
        : fallback.slas.restoreHours,
    },
  };
};


const createSession = (title?: string): AiConversationSession => {
  const now = Date.now();
  return {
    id: createId('session'),
    title: title || '新会话',
    createdAt: now,
    updatedAt: now,
    customer: randomCustomerContext(now),
    messages: welcomeMessages(),
    tickets: TICKETS,
    activeReportId: REPORTS[0].id,
    ticketDraftFromDiagnosis: null,
    faultContext: null,
    faultContexts: [],
  };
};

const formatSessionTitle = (input: string): string => {
  const t = input.replace(/\s+/g, ' ').trim();
  if (!t) return '新会话';
  return t.length > 14 ? `${t.slice(0, 14)}…` : t;
};

const parseSlashCommand = (input: string): { prompt: string; intent?: IntentType } | null => {
  const raw = input.trim();
  if (!raw.startsWith('/')) return null;
  const body = raw.slice(1).trim();
  if (!body) return null;
  const [cmd, ...rest] = body.split(/\s+/);
  const args = rest.join(' ').trim();
  const map: Record<string, { intent?: IntentType; base: string }> = {
    '诊断': { intent: 'diagnosis', base: '帮我做一次业务诊断' },
    '报障': { intent: 'fault', base: '我要发起报障' },
    '工单': { intent: 'ticket', base: '查一下我最近的工单进度' },
    '报告': { intent: 'report', base: '生成本月运行报告' },
    '知识库': { intent: 'knowledge', base: '基于当前业务类型推荐知识' },
    '业务': { intent: 'business', base: '帮我查一下我名下都有哪些业务' },
  };
  const hit = map[cmd];
  if (!hit) return null;
  return {
    prompt: args ? `${hit.base}：${args}` : hit.base,
    intent: hit.intent,
  };
};

const isExplicitFeedbackIntent = (input: string) =>
  input.includes('反馈') ||
  input.includes('意见') ||
  input.includes('投诉') ||
  input.includes('吐槽') ||
  input.includes('产品建议') ||
  input.includes('功能建议') ||
  input.includes('体验建议') ||
  input.includes('问题反馈');

const isQaExpansionIntent = (input: string) =>
  input.includes('深入了解') ||
  input.includes('继续展开') ||
  input.includes('实施清单') ||
  input.includes('风险点') ||
  input.includes('落地步骤') ||
  input.includes('落地建议') ||
  input.includes('适用场景') ||
  input.includes('注意事项');

const isContextAdviceIntent = (input: string) =>
  input.includes('下一步') ||
  input.includes('处理建议') ||
  input.includes('处置建议') ||
  input.includes('优化建议') ||
  input.includes('重点建议') ||
  input.includes('风险项') ||
  input.includes('实施清单') ||
  input.includes('风险点') ||
  input.includes('哪些指标') ||
  input.includes('持续观察') ||
  input.includes('客户侧怎么说明') ||
  input.includes('整理客户说明') ||
  input.includes('是否需要升级') ||
  input.includes('哪些业务最优先');

const stripCitationMarks = (text: string) => text.replace(/\s*\[\d+\]/g, '').trim();

const hasQaSources = (payload: QaPayload) => Boolean(payload.sources?.length || payload.sourceIds?.length || payload.sourceId);

export const buildQaExpansionPayload = (previous: QaPayload, input: string): QaPayload => {
  const title = stripCitationMarks(previous.conclusion);
  const citation = hasQaSources(previous) ? ' [1]' : '';
  const base = stripCitationMarks(previous.explanation);
  const shared = {
    sourceId: previous.sourceId,
    sourceIds: previous.sourceIds,
    sources: previous.sources,
    sourceUpdatedAt: previous.sourceUpdatedAt,
  };

  if (input.includes('实施清单')) {
    return {
      ...shared,
      conclusion: `${title}实施清单${citation}`,
      explanation: [
        `1. 先确认适用业务范围、关键分支和当前风险。`,
        `2. 建立密钥健康、链路时延、丢包和隧道状态的监测基线。`,
        `3. 选择一个关键分支小范围验证，观察至少一个业务高峰周期。`,
        `4. 验证通过后分批推广，并保留策略回退与人工确认入口。`,
        base ? `依据：${base}${citation}` : '',
      ].filter(Boolean).join(' '),
      suggestions: ['列出风险点', '转人工客户经理确认'],
      followups: ['需要哪些前置条件？', '如何判断落地效果？', '异常时怎么回退？'],
    };
  }

  if (input.includes('风险点')) {
    return {
      ...shared,
      conclusion: `${title}风险点${citation}`,
      explanation: [
        `主要风险包括：适用业务范围未确认、密钥健康监测缺失、小范围验证不足、回退策略未演练、异常指标无人确认。`,
        `建议把这些风险分别绑定到负责人、监测阈值和回退动作，避免只完成配置但无法证明效果。`,
        base ? `依据：${base}${citation}` : '',
      ].filter(Boolean).join(' '),
      suggestions: ['生成实施清单', '转人工客户经理确认'],
      followups: ['哪些风险优先级最高？', '需要客户确认什么？', '怎么做回退预案？'],
    };
  }

  return {
    ...shared,
    conclusion: `${title}的落地建议${citation}`,
    explanation: [
      base,
      `落地时建议先确认适用业务范围与当前风险，再按“先监测、再小范围验证、最后推广”的顺序执行。过程中保留回退方案，遇到指标持续异常时直接转人工客户经理确认。${citation}`,
    ].filter(Boolean).join(' '),
    suggestions: ['生成实施清单', '列出风险点', '转人工客户经理确认'],
    followups: ['需要哪些前置条件？', '如何判断落地效果？', '异常时怎么回退？'],
  };
};

const buildContextAdvicePayload = (message?: AiMessage): QaPayload | null => {
  if (!message?.data) return null;

  if (message.kind === 'diagnosisReport') {
    const data = message.data as DiagnosisTemplate;
    return {
      conclusion: `${data.title}处置建议`,
      explanation: [
        `当前结论为“${data.conclusion}”，健康评分 ${data.score}。`,
        data.findings.length ? `优先核对：${data.findings.join('；')}。` : '',
        data.suggestions.length ? `建议动作：${data.suggestions.join('；')}。` : '',
        '如影响仍在扩大，建议直接发起报障并携带本次诊断结果。',
      ].filter(Boolean).join(' '),
      suggestions: ['发起报障', '查看诊断历史', '联系客户经理'],
      followups: ['需要我整理给客户的话术吗？', '哪些指标需要持续观察？', '是否需要升级处理？'],
    };
  }

  if (message.kind === 'receiptCard') {
    const data = message.data as { title?: string; nextSteps?: string[] };
    return {
      conclusion: `${data.title || '服务进展'}的下一步处理建议`,
      explanation: data.nextSteps?.length
        ? `建议按当前回执的下一步继续推进：${data.nextSteps.join('；')}。如超过承诺时限仍未更新，可联系客户经理或触发升级提醒。`
        : '建议先确认当前责任人与承诺时限，再补充影响范围、发生时间和可复现现象，便于继续处理。',
      suggestions: ['继续追踪', '联系客户经理', '补充影响范围'],
      followups: ['需要催办吗？', '是否超过SLA？', '需要整理客户说明吗？'],
    };
  }

  if (message.kind === 'ticketCard') {
    const data = message.data as TicketItem;
    return {
      conclusion: `工单 ${data.id} 的处理建议`,
      explanation: `当前工单状态为“${data.status}”，责任人为 ${data.owner}。建议先确认最新处理进展与客户侧影响是否仍存在；如长时间未更新，可发起催办并同步SLA要求。`,
      suggestions: ['催办工单', '查看工单详情', '联系客户经理'],
      followups: ['是否需要二次升级？', '客户侧怎么说明？', '还需要补什么材料？'],
    };
  }

  if (message.kind === 'reportCard') {
    const data = message.data as ReportItem;
    return {
      conclusion: `《${data.title}》重点解读`,
      explanation: `报告摘要为“${data.summary}”。建议先向客户说明整体趋势，再突出异常指标、已采取措施和后续观察项，避免只罗列技术数据。`,
      suggestions: ['生成客户汇报话术', '导出报告', '列出风险项'],
      followups: ['哪些指标最需要关注？', '怎么给客户解释？', '是否需要生成月报摘要？'],
    };
  }

  if (message.kind === 'businessDiagnosisReport') {
    const data = message.data as BusinessDiagnosisReportPayload;
    const abnormal = data.results.filter((item) => item.level === '异常');
    const warning = data.results.filter((item) => item.level === '关注');
    return {
      conclusion: '业务诊断结果的处置建议',
      explanation: `本次共诊断 ${data.total} 条业务，平均健康评分 ${data.averageScore}。异常 ${abnormal.length} 条、关注 ${warning.length} 条。建议优先处理异常业务，再对关注业务设置7天观察，最后将健康业务维持常规巡检。`,
      suggestions: ['为异常业务发起报障', '生成汇报说明', '联系客户经理'],
      followups: ['哪些业务最优先？', '需要客户确认什么？', '怎么做回退预案？'],
    };
  }

  if (message.kind === 'businessQuery') {
    const categories = Array.isArray(message.data)
      ? (message.data as Array<{ label: string; items?: BusinessQueryItem[] }>)
      : [];
    const total = categories.reduce((sum, category) => sum + (category.items || []).length, 0);
    const riskItems = categories.flatMap((category) =>
      (category.items || [])
        .filter((item) => (item.details || []).some((detail) =>
          /状态|健康|风险/.test(detail.label) && !/正常|健康|稳定/.test(detail.value)
        ))
        .map((item) => `${category.label}-${item.name}`)
    );
    return {
      conclusion: '业务清单的重点建议',
      explanation: `当前客户名下共 ${total} 条业务。建议先按业务类型确认关键业务，再优先查看非正常状态业务${riskItems.length ? `：${riskItems.slice(0, 3).join('、')}` : ''}。如客户要自助处理，可从业务诊断或运行月报入口继续。`,
      suggestions: ['发起业务诊断', '生成运行月报', '查看非正常业务'],
      followups: ['哪些业务风险最高？', '需要生成客户汇报吗？', '怎么安排巡检优先级？'],
    };
  }

  return null;
};

export const buildSlaCheckPayload = (ticket: TicketItem, customer: CustomerContext): QaPayload => ({
  conclusion: `工单 ${ticket.id} SLA判断建议`,
  explanation: [
    `当前工单状态为“${ticket.status}”，客户SLA承诺为 ${customer.slas.responseMinutes} 分钟响应 / ${customer.slas.restoreHours} 小时恢复。`,
    '建议先核对最近一次工单更新时间、客户侧影响是否仍存在、责任人是否已给出恢复时间。',
    ticket.status === '处理中'
      ? '如果超过承诺响应时间仍无进展，可立即催办；如果影响扩大，建议升级至值班主管。'
      : '如果已进入待客户确认或已完成，应重点确认客户侧业务是否恢复，必要时申请二次受理。',
  ].join(' '),
  suggestions: ['催办工单', '查看工单详情', '联系客户经理'],
  followups: ['客户侧怎么说明？', '还需要补什么材料？', '是否需要二次升级？'],
});

export const buildImpactSupplementPayload = (): QaPayload => ({
  conclusion: '补充影响范围所需信息',
  explanation: [
    '建议补充四类信息：1. 受影响业务或站点；2. 开始时间和持续时长；3. 具体表现，例如慢、断、丢包、接入失败；4. 是否可复现及是否已有截图/日志。',
    '补充后可直接发起报障或同步给客户经理，便于责任人快速判断优先级。',
  ].join(' '),
  suggestions: ['发起报障', '联系客户经理'],
  followups: ['需要我生成报障描述吗？', '哪些材料最关键？', '客户侧怎么说明？'],
});

export const buildReportCustomerBriefPayload = (report: ReportItem, customer: CustomerContext): QaPayload => ({
  conclusion: `${report.title}客户汇报话术`,
  explanation: [
    `${customer.name}本期运行整体可概括为：${report.summary}`,
    report.metrics.length ? `核心指标：${report.metrics.map((item) => `${item.label}${item.value}`).join('，')}。` : '',
    report.serviceQuality?.length
      ? `业务质量：${report.serviceQuality.map((item) => `${item.name}${item.status}（可用性${item.availability}，${item.note}）`).join('；')}。`
      : '',
    report.events.length ? `重点事件：${report.events.slice(0, 2).map((item) => `${item.time} ${item.text}`).join('；')}。` : '',
    report.risks?.length
      ? `需关注风险：${report.risks.map((item) => `${item.level}风险-${item.title}，${item.detail}，责任${item.owner}`).join('；')}。`
      : '',
    report.tickets?.length ? `服务闭环：${report.tickets.map((item) => `${item.label}${item.value}，${item.note}`).join('；')}。` : '',
    report.suggestions.length ? `后续建议：${report.suggestions.join('；')}` : '',
    report.nextActions?.length ? `建议下一步：${report.nextActions.map((item) => `${item.priority} ${item.action}（${item.owner}，${item.due}）`).join('；')}。` : '',
    '对客户沟通时建议先说整体稳定性，再说明已处理事件和后续观察动作，避免直接堆叠内部技术指标。',
  ].filter(Boolean).join(' '),
  suggestions: ['导出报告', '列出风险项', '联系客户经理'],
  followups: ['怎么给客户解释？', '哪些指标最需要关注？', '是否需要生成月报摘要？'],
});

export const buildReportRiskCustomerExplanationPayload = (report: ReportItem, customer: CustomerContext): QaPayload => {
  const riskLines = (report.risks || []).map((risk, index) =>
    `${index + 1}. ${risk.title}：可对客户说明为“当前已识别到${risk.level}风险关注项，暂未形成持续业务中断，但可能影响高峰期体验或恢复效率。我们已安排${risk.owner}跟进，目标时间：${risk.due}。”`
  );
  const actionLines = (report.nextActions || []).slice(0, 3).map((action, index) =>
    `${index + 1}. ${action.action}（${action.owner}，${action.due}）。`
  );

  return {
    conclusion: `${customer.name}风险说明建议`,
    explanation: [
      '客户沟通建议采用“整体可控、明确影响、说明动作、给出期限”的顺序，避免直接抛出内部风险名造成误解。',
      `建议开场：${customer.name}本期整体运行平稳，当前风险项均已纳入跟踪清单，暂未发现持续性业务不可用。`,
      riskLines.length ? `风险说明：${riskLines.join(' ')}` : '当前报告未列出明确风险项，可重点说明持续观察和例行优化安排。',
      actionLines.length ? `后续动作：${actionLines.join(' ')}` : '',
      '结束语建议：我们会持续观察关键指标，如出现客户侧可感知影响，会第一时间同步处理进展并升级人工跟进。',
    ].filter(Boolean).join(' '),
    suggestions: ['导出Word报告', '生成客户汇报话术', '联系客户经理'],
    followups: ['需要更正式的客户邮件版本吗？', '风险项如何降级？', '能先生成报告预览吗？'],
  };
};

export const buildReportRiskCustomerEmailPayload = (report: ReportItem, customer: CustomerContext): QaPayload => {
  const riskSummary = (report.risks || []).map((risk) =>
    `- ${risk.title}：当前为${risk.level}风险关注项，责任团队/人员为${risk.owner}，目标时间为${risk.due}。`
  );
  const actionSummary = (report.nextActions || []).slice(0, 4).map((action) =>
    `- ${action.priority}：${action.action}（${action.owner}，${action.due}）`
  );

  return {
    conclusion: `${customer.name}客户邮件草稿`,
    explanation: [
      `主题：${report.title}运行情况及后续跟踪说明`,
      `尊敬的${customer.name}相关负责人：`,
      `您好！本期运行报告显示，${customer.name}整体运行平稳，核心业务未发现持续性不可用情况。${report.summary}`,
      '针对报告中列出的关注项，我们已纳入专项跟踪，不会仅停留在指标观察层面，会同步推进责任团队、目标时间和后续复核。',
      riskSummary.length ? `当前重点关注项如下：\n${riskSummary.join('\n')}` : '当前未识别到明确风险项，后续将保持例行巡检和指标观察。',
      actionSummary.length ? `后续计划如下：\n${actionSummary.join('\n')}` : '',
      '如后续出现客户侧可感知影响，我们会第一时间同步处理进展，并按需升级人工跟进。也欢迎您反馈现场体验或补充业务高峰窗口，便于我们进一步优化保障策略。',
      '此致',
      '运维服务团队',
    ].filter(Boolean).join('\n\n'),
    suggestions: ['导出Word报告', '导出PDF报告', '联系客户经理'],
    followups: ['需要更简短的短信版本吗？', '风险项如何降级？', '能先生成报告预览吗？'],
  };
};

export const buildReportRiskSmsPayload = (report: ReportItem, customer: CustomerContext): QaPayload => {
  const primaryRisks = (report.risks || []).slice(0, 2).map((risk) => `${risk.title}（${risk.owner}，${risk.due}）`);
  const primaryAction = report.nextActions?.[0];
  return {
    conclusion: `${customer.name}短信版风险说明`,
    explanation: [
      `${customer.name}本期业务整体运行平稳，暂未发现持续性业务不可用。`,
      primaryRisks.length ? `当前重点关注：${primaryRisks.join('；')}。` : '当前未识别到明确风险项，将保持例行巡检和指标观察。',
      primaryAction ? `下一步：${primaryAction.action}，由${primaryAction.owner}负责，目标${primaryAction.due}。` : '',
      '如出现客户侧可感知影响，我们会第一时间同步处理进展并升级人工跟进。',
    ].filter(Boolean).join(''),
    suggestions: ['复制回答', '导出Word报告', '联系客户经理'],
    followups: ['需要更正式的客户邮件版本吗？', '风险项如何降级？'],
  };
};

export const buildReportRiskDowngradePayload = (report: ReportItem): QaPayload => ({
  conclusion: '风险项降级条件与动作',
  explanation: [
    '风险项不建议只凭主观判断降级，应同时满足“指标恢复、客户无感知、责任动作完成、观察期通过”四类条件。',
    report.risks?.length
      ? `当前报告风险项建议逐项处理：${report.risks.map((risk) => `${risk.title}需由${risk.owner}在${risk.due}前完成复核，并保留指标截图或巡检记录`).join('；')}。`
      : '当前报告未列出明确风险项，可按例行巡检结果进行状态确认。',
    '建议降级口径：中风险连续 3 个高峰窗口无复现后可降为低风险；低风险完成责任动作并通过 7 天观察后可关闭。',
    '如果客户侧仍有慢、断、失败、排队变长等反馈，即使平台指标恢复，也不建议降级，应先补充客户侧影响确认。',
  ].join(' '),
  suggestions: ['生成客户汇报话术', '导出Word报告', '联系客户经理'],
  followups: ['客户侧怎么说明风险？', '需要更正式的客户邮件版本吗？'],
});

const sanitizeFileName = (name: string) => name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const dataUrlToBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const encodePdfText = (text: string) => new TextEncoder().encode(text);

const createPdfFromJpeg = (jpegBytes: Uint8Array, width: number, height: number) => {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
    `\nendstream\nendobj\n`,
    `5 0 obj\n<< /Length ${String(`q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`).length} >>\nstream\nq\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\nendstream\nendobj\n`,
  ];
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let cursor = 0;
  const push = (chunk: Uint8Array) => {
    chunks.push(chunk);
    cursor += chunk.length;
  };

  push(encodePdfText('%PDF-1.4\n% report\n'));
  offsets.push(cursor);
  push(encodePdfText(objects[0]));
  offsets.push(cursor);
  push(encodePdfText(objects[1]));
  offsets.push(cursor);
  push(encodePdfText(objects[2]));
  offsets.push(cursor);
  push(encodePdfText(objects[3]));
  push(jpegBytes);
  push(encodePdfText(objects[4]));
  offsets.push(cursor);
  push(encodePdfText(objects[5]));

  const xrefOffset = cursor;
  const xref = [
    'xref',
    `0 ${offsets.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${offsets.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n');
  push(encodePdfText(xref));

  const output = new Uint8Array(cursor);
  let writeOffset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, writeOffset);
    writeOffset += chunk.length;
  });
  return new Blob([output], { type: 'application/pdf' });
};

const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const lines: string[] = [];
  let current = '';
  Array.from(text).forEach((char) => {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
};

const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const lines = wrapCanvasText(ctx, text, maxWidth);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return lines.length * lineHeight;
};

const drawCanvasTable = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  widths: number[],
  headers: string[],
  rows: string[][],
  options: { fontSize?: number; lineHeight?: number } = {}
) => {
  const fontSize = options.fontSize || 20;
  const lineHeight = options.lineHeight || 30;
  const paddingX = 12;
  const headerHeight = 42;
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = '#edf3f8';
  ctx.strokeStyle = '#b9c8d8';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, tableWidth, headerHeight);
  ctx.strokeRect(x, y, tableWidth, headerHeight);
  let cursorX = x;
  headers.forEach((header, index) => {
    if (index > 0) {
      ctx.beginPath();
      ctx.moveTo(cursorX, y);
      ctx.lineTo(cursorX, y + headerHeight);
      ctx.stroke();
    }
    ctx.fillStyle = '#22435f';
    ctx.fillText(header, cursorX + paddingX, y + 28);
    cursorX += widths[index];
  });
  y += headerHeight;

  ctx.font = `${fontSize}px sans-serif`;
  rows.forEach((row, rowIndex) => {
    const cellLines = row.map((cell, index) => wrapCanvasText(ctx, cell, widths[index] - paddingX * 2));
    const rowHeight = Math.max(42, Math.max(...cellLines.map((lines) => lines.length)) * lineHeight + 18);
    ctx.fillStyle = rowIndex % 2 === 0 ? '#ffffff' : '#fafcff';
    ctx.fillRect(x, y, tableWidth, rowHeight);
    ctx.strokeStyle = '#bdcad8';
    ctx.strokeRect(x, y, tableWidth, rowHeight);
    cursorX = x;
    cellLines.forEach((lines, index) => {
      if (index > 0) {
        ctx.beginPath();
        ctx.moveTo(cursorX, y);
        ctx.lineTo(cursorX, y + rowHeight);
        ctx.stroke();
      }
      ctx.fillStyle = '#27364a';
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, cursorX + paddingX, y + 28 + lineIndex * lineHeight);
      });
      cursorX += widths[index];
    });
    y += rowHeight;
  });
  ctx.restore();
  return y;
};

const measureCanvasTableHeight = (
  ctx: CanvasRenderingContext2D,
  widths: number[],
  rows: string[][],
  options: { fontSize?: number; lineHeight?: number } = {}
) => {
  const fontSize = options.fontSize || 20;
  const lineHeight = options.lineHeight || 30;
  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  const height = rows.reduce((sum, row) => {
    const maxLines = Math.max(...row.map((cell, index) => wrapCanvasText(ctx, cell, widths[index] - 24).length));
    return sum + Math.max(42, maxLines * lineHeight + 18);
  }, 42);
  ctx.restore();
  return height;
};

const getExportReportPosture = (report: ReportItem) => {
  const abnormal = report.serviceQuality?.filter((item) => item.status === '异常').length || 0;
  const watch = report.serviceQuality?.filter((item) => item.status === '关注').length || 0;
  const highRisks = report.risks?.filter((item) => item.level === '高').length || 0;
  if (abnormal > 0 || highRisks > 0) return { label: '需立即处置', score: 'B', color: '#ff7d91' };
  if (watch > 0 || (report.risks?.length || 0) > 0) return { label: '整体稳定，需跟踪', score: 'A-', color: '#ffb657' };
  return { label: '运行健康', score: 'A', color: '#5de0b4' };
};

const renderReportCanvas = (report: ReportItem, customer: CustomerContext) => {
  const width = 1240;
  const padding = 88;
  const contentWidth = width - padding * 2;
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Canvas 初始化失败');

  const posture = getExportReportPosture(report);
  const normalQualityCount = report.serviceQuality?.filter((item) => item.status === '正常').length || 0;
  const watchQualityCount = report.serviceQuality?.filter((item) => item.status !== '正常').length || 0;

  tempCtx.font = '20px sans-serif';
  const metricRows = report.metrics.map((item) => [item.label, item.value]);
  const sectionLines = (report.sections || []).flatMap((section) => [`${section.title}`, ...section.items.map((item, index) => `${index + 1}. ${item}`)]);
  const serviceRows = (report.serviceQuality || []).map((item) => [item.name, item.status, item.availability, item.latency, item.loss, item.note]);
  const riskRows = (report.risks || []).map((item) => [item.level, item.title, item.detail, item.owner, item.due]);
  const ticketRows = (report.tickets || []).map((item) => [item.label, item.value, item.note]);
  const capacityRows = (report.capacity || []).map((item) => [item.label, item.value, item.note]);
  const eventRows = report.events.map((item) => [item.time, item.text]);
  const actionRows = (report.nextActions || []).map((item) => [item.priority, item.action, item.owner, item.due]);

  const sectionHeight = sectionLines.reduce((sum, line) => sum + wrapCanvasText(tempCtx, line, contentWidth - 24).length * 30, 0) + 32;
  let height = 250;
  height += 110;
  height += 64 + measureCanvasTableHeight(tempCtx, [contentWidth * 0.42, contentWidth * 0.58], metricRows);
  height += 64 + sectionHeight;
  if (serviceRows.length) height += 64 + measureCanvasTableHeight(tempCtx, [180, 100, 130, 130, 110, contentWidth - 650], serviceRows, { fontSize: 18, lineHeight: 28 });
  if (riskRows.length) height += 64 + measureCanvasTableHeight(tempCtx, [110, 190, contentWidth - 620, 160, 160], riskRows, { fontSize: 18, lineHeight: 28 });
  if (ticketRows.length) height += 64 + measureCanvasTableHeight(tempCtx, [190, 150, contentWidth - 340], ticketRows);
  if (capacityRows.length) height += 64 + measureCanvasTableHeight(tempCtx, [220, 180, contentWidth - 400], capacityRows);
  height += 64 + measureCanvasTableHeight(tempCtx, [190, contentWidth - 190], eventRows);
  height += 64 + report.suggestions.reduce((sum, item) => sum + wrapCanvasText(tempCtx, item, contentWidth - 32).length * 30, 24);
  if (actionRows.length) height += 64 + measureCanvasTableHeight(tempCtx, [100, contentWidth - 420, 170, 150], actionRows, { fontSize: 18, lineHeight: 28 });
  height += 80;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 初始化失败');

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(15, 35, 60, 0.14)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillRect(48, 34, width - 96, height - 68);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#d8e1ea';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 34, width - 96, height - 68);

  let y = 64;
  ctx.fillStyle = '#0f2f57';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(report.title, width / 2, y);
  y += 42;
  ctx.fillStyle = '#5b6778';
  ctx.font = '20px sans-serif';
  ctx.fillText(`客户：${customer.name}（${customer.code}）　生成时间：${new Date().toLocaleString('zh-CN')}`, width / 2, y);
  ctx.textAlign = 'left';
  y += 38;
  ctx.strokeStyle = '#c7d4e2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  y += 28;

  ctx.fillStyle = '#f7fafd';
  ctx.strokeStyle = '#c5d3e2';
  ctx.lineWidth = 1.5;
  const summaryHeight = 118;
  ctx.fillRect(padding, y, contentWidth, summaryHeight);
  ctx.strokeRect(padding, y, contentWidth, summaryHeight);
  ctx.fillStyle = posture.color;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`综合判断：${posture.score}｜${posture.label}`, padding + 24, y + 36);
  ctx.fillStyle = '#26384f';
  ctx.font = '20px sans-serif';
  drawWrappedText(ctx, `总体摘要：${report.summary}`, padding + 24, y + 70, contentWidth - 48, 28);
  ctx.fillStyle = '#4b5563';
  ctx.fillText(`质量状态：${normalQualityCount} 项正常 / ${watchQualityCount} 项关注；风险项：${report.risks?.length || 0} 项；行动计划：${report.nextActions?.length || 0} 项。`, padding + 24, y + 104);
  y += summaryHeight + 38;

  const drawTitle = (title: string) => {
    ctx.fillStyle = '#0f4c81';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(title, padding, y);
    y += 12;
    ctx.strokeStyle = '#9bb7d4';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;
  };

  drawTitle('一、核心指标');
  y = drawCanvasTable(ctx, padding, y, [contentWidth * 0.42, contentWidth * 0.58], ['指标', '数值'], metricRows);
  y += 34;

  drawTitle('二、运行概述');
  ctx.font = '20px sans-serif';
  sectionLines.forEach((line) => {
    const isHeading = !/^\d+\./.test(line);
    ctx.fillStyle = isHeading ? '#1f4f7a' : '#27364a';
    ctx.font = isHeading ? 'bold 22px sans-serif' : '20px sans-serif';
    const used = drawWrappedText(ctx, line, padding + (isHeading ? 0 : 20), y, contentWidth - (isHeading ? 0 : 20), 30);
    y += used + (isHeading ? 4 : 2);
  });
  y += 28;

  if (serviceRows.length) {
    drawTitle('三、业务质量明细');
    y = drawCanvasTable(ctx, padding, y, [180, 100, 130, 130, 110, contentWidth - 650], ['业务', '状态', '可用性', '时延', '丢包', '说明'], serviceRows, { fontSize: 18, lineHeight: 28 });
    y += 34;
  }

  if (riskRows.length) {
    drawTitle('四、风险与影响');
    y = drawCanvasTable(ctx, padding, y, [110, 190, contentWidth - 620, 160, 160], ['风险等级', '风险项', '影响说明', '责任部门/责任人', '计划期限'], riskRows, { fontSize: 18, lineHeight: 28 });
    y += 34;
  }

  if (ticketRows.length) {
    drawTitle('五、服务闭环');
    y = drawCanvasTable(ctx, padding, y, [190, 150, contentWidth - 340], ['事项', '结果', '说明'], ticketRows);
    y += 34;
  }

  if (capacityRows.length) {
    drawTitle('六、容量与资源');
    y = drawCanvasTable(ctx, padding, y, [220, 180, contentWidth - 400], ['资源项', '状态/数值', '说明'], capacityRows);
    y += 34;
  }

  drawTitle('七、关键事件');
  y = drawCanvasTable(ctx, padding, y, [190, contentWidth - 190], ['时间', '事件说明'], eventRows);
  y += 34;

  drawTitle('八、后续建议');
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#27364a';
  report.suggestions.forEach((item, index) => {
    const used = drawWrappedText(ctx, `${index + 1}. ${item}`, padding + 8, y, contentWidth - 8, 30);
    y += used + 4;
  });
  y += 30;

  if (actionRows.length) {
    drawTitle('九、行动计划');
    y = drawCanvasTable(ctx, padding, y, [100, contentWidth - 420, 170, 150], ['优先级', '行动项', '责任部门/责任人', '完成期限'], actionRows, { fontSize: 18, lineHeight: 28 });
    y += 34;
  }

  ctx.fillStyle = '#6b7280';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('由运维管家智能体生成，建议提交前结合客户现场反馈进行人工确认。', width - padding, height - 54);
  ctx.textAlign = 'left';
  return canvas;
};

const buildWordTable = (headers: string[], rows: string[][]) => `
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
`;

const buildReportWordHtml = (report: ReportItem, customer: CustomerContext) => {
  const posture = getExportReportPosture(report);
  const normalQualityCount = report.serviceQuality?.filter((item) => item.status === '正常').length || 0;
  const watchQualityCount = report.serviceQuality?.filter((item) => item.status !== '正常').length || 0;
  const generatedAt = new Date().toLocaleString('zh-CN');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page { margin: 2.2cm 1.8cm; }
    body { font-family: "Microsoft YaHei", SimSun, Arial, sans-serif; color: #1f2937; line-height: 1.75; font-size: 12pt; }
    h1 { text-align: center; font-size: 22pt; margin: 0 0 16pt; color: #0f2f57; }
    h2 { font-size: 15pt; color: #0f4c81; border-bottom: 1px solid #9bb7d4; padding-bottom: 4pt; margin-top: 18pt; }
    h3 { font-size: 13pt; color: #1f4f7a; margin: 10pt 0 4pt; }
    .meta { text-align: center; color: #4b5563; margin-bottom: 18pt; }
    .summary { border: 1px solid #b7c9dd; background: #f3f7fb; padding: 10pt 12pt; margin: 12pt 0; }
    .judgement { font-weight: bold; color: #0f4c81; }
    table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; }
    th { background: #dbeafe; color: #173b63; font-weight: bold; }
    th, td { border: 1px solid #9db4ce; padding: 6pt 7pt; vertical-align: top; }
    ul, ol { margin-top: 4pt; }
    li { margin-bottom: 3pt; }
    .footer { color: #6b7280; font-size: 10pt; margin-top: 24pt; text-align: right; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <div class="meta">客户：${escapeHtml(customer.name)}（${escapeHtml(customer.code)}）　生成时间：${escapeHtml(generatedAt)}</div>

  <div class="summary">
    <div class="judgement">综合判断：${escapeHtml(posture.score)}｜${escapeHtml(posture.label)}</div>
    <div>总体摘要：${escapeHtml(report.summary)}</div>
    <div>质量状态：${normalQualityCount} 项正常 / ${watchQualityCount} 项关注；风险项：${report.risks?.length || 0} 项；行动计划：${report.nextActions?.length || 0} 项。</div>
  </div>

  <h2>一、核心指标</h2>
  ${buildWordTable(['指标', '数值'], report.metrics.map((item) => [item.label, item.value]))}

  <h2>二、运行概述</h2>
  ${(report.sections || []).map((section) => `
    <h3>${escapeHtml(section.title)}</h3>
    <ol>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
  `).join('')}

  <h2>三、业务质量明细</h2>
  ${buildWordTable(
    ['业务', '状态', '可用性', '时延', '丢包', '说明'],
    (report.serviceQuality || []).map((item) => [item.name, item.status, item.availability, item.latency, item.loss, item.note])
  )}

  <h2>四、风险与影响</h2>
  ${buildWordTable(
    ['风险等级', '风险项', '影响说明', '责任部门/责任人', '计划期限'],
    (report.risks || []).map((item) => [item.level, item.title, item.detail, item.owner, item.due])
  )}

  <h2>五、服务闭环</h2>
  ${buildWordTable(['事项', '结果', '说明'], (report.tickets || []).map((item) => [item.label, item.value, item.note]))}

  <h2>六、容量与资源</h2>
  ${buildWordTable(['资源项', '状态/数值', '说明'], (report.capacity || []).map((item) => [item.label, item.value, item.note]))}

  <h2>七、关键事件</h2>
  ${buildWordTable(['时间', '事件说明'], report.events.map((item) => [item.time, item.text]))}

  <h2>八、后续建议</h2>
  <ol>${report.suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>

  <h2>九、行动计划</h2>
  ${buildWordTable(
    ['优先级', '行动项', '责任部门/责任人', '完成期限'],
    (report.nextActions || []).map((item) => [item.priority, item.action, item.owner, item.due])
  )}

  <div class="footer">由运维管家智能体生成，建议提交前结合客户现场反馈进行人工确认。</div>
</body>
</html>`;
};

const exportReportFile = (report: ReportItem, customer: CustomerContext, type: 'pdf' | 'image' | 'word') => {
  const fileBase = sanitizeFileName(`${customer.name}_${report.title}`);
  if (type === 'word') {
    const html = buildReportWordHtml(report, customer);
    downloadBlob(new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' }), `${fileBase}.doc`);
    showAppToast('运行报告 Word 已开始下载', 'success');
    return;
  }

  const canvas = renderReportCanvas(report, customer);
  if (type === 'image') {
    canvas.toBlob((blob) => {
      if (!blob) {
        showAppToast('长图生成失败，请稍后再试', 'error');
        return;
      }
      downloadBlob(blob, `${fileBase}.png`);
      showAppToast('运行报告长图已开始下载', 'success');
    }, 'image/png');
    return;
  }

  const jpegBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.92));
  const pdfBlob = createPdfFromJpeg(jpegBytes, canvas.width, canvas.height);
  downloadBlob(pdfBlob, `${fileBase}.pdf`);
  showAppToast('运行报告 PDF 已开始下载', 'success');
};

export const buildFaultDescriptionPayload = (customer: CustomerContext): QaPayload => ({
  conclusion: '可用于报障的描述模板',
  explanation: [
    `客户：${customer.name}（${customer.code}）。`,
    '现象：业务访问出现异常，请根据实际情况补充“慢、断、丢包、接入失败”等表现。',
    '影响：请补充受影响业务、站点、用户范围和开始时间。',
    '诉求：请协助快速定位原因，给出预计恢复时间，并同步后续处理进展。',
  ].join(' '),
  suggestions: ['发起报障', '补充影响范围', '联系客户经理'],
  followups: ['哪些材料最关键？', '是否需要升级处理？', '客户侧怎么说明？'],
});

export const buildQuantumKeyHealthPayload = (): QaPayload => ({
  conclusion: '量子密钥健康详情',
  explanation: [
    '当前密钥刷新与链路健康均处于正常范围，建议重点关注密钥池余量、刷新周期、QKD链路状态和策略同步状态。',
    '如果出现密钥池下降过快、刷新失败或策略不同步，应先核对QKD链路，再评估是否临时切回经典加密。',
  ].join(' '),
  sourceId: 'sdwan_2',
  sourceIds: ['sdwan_2', 'sdwan_4'],
  sources: buildKnowledgeSources(['sdwan_2', 'sdwan_4']),
  sourceUpdatedAt: '2026-04-20',
  suggestions: ['查看量子链路拓扑', '发起SD-WAN诊断', '查看《密钥刷新周期》原始知识'],
  followups: ['密钥异常怎么恢复？', '多久刷新一次合适？', '异常时怎么回退？'],
});

export const buildQuantumTopologyPayload = (): QaPayload => ({
  conclusion: '量子链路拓扑查看建议',
  explanation: [
    '建议按“总部Hub、关键分支、普通分支”三层查看量子隧道覆盖，重点确认哪些业务走量子保护、哪些仍走普通隧道。',
    '如果关键分支没有量子保护或隧道切换偏慢，应进入SD-WAN诊断确认选路策略和密钥策略是否一致。',
  ].join(' '),
  sourceId: 'sdwan_3',
  sourceIds: ['sdwan_3', 'sdwan_1'],
  sources: buildKnowledgeSources(['sdwan_3', 'sdwan_1']),
  sourceUpdatedAt: '2026-04-15',
  suggestions: ['发起SD-WAN诊断', '查看密钥健康详情', '查看《SD-WAN 选路策略》原始知识'],
  followups: ['哪些地市启用了量子？', '普通隧道是否有风险？', '异常时怎么回退？'],
});

export const buildFaultPrecheckPayload = (input: string): QaPayload => {
  const missing: string[] = [];
  if (/标题=未填写/.test(input)) missing.push('工单标题');
  if (/业务=未选择/.test(input)) missing.push('报障业务');
  if (/描述=未填写/.test(input) || /描述=.{0,7}$/.test(input)) missing.push('问题描述');
  const hasImpact = /影响|中断|变慢|失败|丢包|无法|不通|抖动/.test(input);
  const hasTime = /时间|上午|下午|晚上|\d{1,2}[:：]\d{2}|今日|昨天|分钟|小时/.test(input);

  return {
    conclusion: missing.length ? '报障信息仍需补充' : '报障信息基本完整',
    explanation: [
      missing.length ? `缺少：${missing.join('、')}。` : '标题、业务、描述和紧急程度已具备，可进入提交。',
      hasImpact ? '已包含影响或现象描述。' : '建议补充客户侧影响，例如受影响站点、用户范围或业务表现。',
      hasTime ? '已包含时间信息。' : '建议补充发生时间和持续时长，便于判断SLA和优先级。',
      '提交前请确认描述中没有内部无关术语，优先说明客户可感知影响。',
    ].join(' '),
    suggestions: missing.length ? ['补充影响范围', '生成报障描述', '联系客户经理'] : ['发起报障', '联系客户经理'],
    followups: ['哪些材料最关键？', '是否需要升级处理？', '客户侧怎么说明？'],
  };
};

export const buildDiagnosisPriorityPayload = (customer: CustomerContext): QaPayload => {
  const available = customer.businessTypes
    .map((type) => DIAGNOSIS_TEMPLATES.find((item) => item.id === type))
    .filter((item): item is DiagnosisTemplate => Boolean(item));
  const ordered = available.length > 0
    ? available.slice().sort((a, b) => a.score - b.score)
    : DIAGNOSIS_TEMPLATES.slice().sort((a, b) => a.score - b.score);

  return {
    conclusion: '推荐诊断优先级',
    explanation: [
      `建议优先诊断：${ordered.slice(0, 3).map((item, index) => `${index + 1}. ${item.name}`).join('；')}。`,
      '排序依据是当前业务类型、历史健康评分和潜在客户影响，先处理低评分或关键承载业务，再处理日常巡检项。',
      '如果客户已明确反馈某类业务受影响，应以客户反馈业务为第一优先级。',
    ].join(' '),
    suggestions: ['开始业务诊断', `发起${ordered[0]?.name || '业务'}诊断`, '查看本月运行报告'],
    followups: ['哪些业务最优先？', '是否需要生成客户说明？', '诊断后如何处置？'],
  };
};

export const buildDiagnosisStagePayload = (input: string): QaPayload => {
  const step = input.match(/诊断正在进行[:：](.*?)(，|,|。|$)/)?.[1]?.trim() || '当前诊断阶段';
  return {
    conclusion: '诊断阶段解读',
    explanation: [
      `当前阶段是“${step}”。`,
      '这个阶段主要用于采集运行指标、关联告警日志并形成初步判断，还不适合直接下结论。',
      '建议等待诊断完成后再发起报障；如果客户侧影响仍在扩大，可先联系客户经理同步风险。',
    ].join(' '),
    suggestions: ['联系客户经理', '查看诊断历史'],
    followups: ['诊断完成后怎么处置？', '哪些指标需要持续观察？', '是否需要升级处理？'],
  };
};

export const buildDiagnosisCompletionPayload = (title: string): QaPayload => ({
  conclusion: `${title || '诊断'}后续处置建议`,
  explanation: [
    '建议先查看诊断报告里的健康评分、关键发现和建议动作。',
    '如果结论包含异常、抖动、失败、容量不足或客户侧影响，应直接发起报障并带入诊断结果。',
    '如果只是关注项，建议生成客户侧说明并设置未来7天重点观察。',
  ].join(' '),
  suggestions: ['发起报障', '查看诊断历史', '生成客户汇报话术'],
  followups: ['哪些指标需要持续观察？', '是否需要升级处理？', '客户侧怎么说明？'],
});

export const getPrimaryQaSourceId = (payload?: QaPayload): string | null =>
  payload?.sources?.[0]?.id || payload?.sourceIds?.[0] || payload?.sourceId || null;

export const getRelatedKnowledgeForQa = (payload?: QaPayload): KnowledgeItem[] => {
  const primaryId = getPrimaryQaSourceId(payload);
  if (!primaryId) return [];
  const primary = KNOWLEDGE_ITEMS.find((item) => item.id === primaryId);
  if (!primary) return [];
  const usedIds = new Set([primaryId, ...(payload?.sourceIds || []), ...(payload?.sources || []).map((source) => source.id)]);
  return KNOWLEDGE_ITEMS
    .filter((item) => item.business === primary.business && !usedIds.has(item.id))
    .slice(0, 2);
};


const toValidSession = (value: any): AiConversationSession | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return null;
  if (!Array.isArray(value.messages) || !Array.isArray(value.tickets)) return null;
  const activeReportId = typeof value.activeReportId === 'string' ? value.activeReportId : REPORTS[0].id;
  const sessionSeed = typeof value.createdAt === 'number' ? value.createdAt : Date.now();
  const customer = normalizeCustomerContext(value.customer, sessionSeed);
  const normalizedMessages = (value.messages as AiMessage[]).map((message) => {
    if (message.kind !== 'businessDiagnosisReport') return message;
    return {
      ...message,
      data: normalizeBusinessDiagnosisReportPayload(message.data),
    };
  });
  return {
    id: value.id,
    title: value.title || '新会话',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
    customer,
    messages: normalizedMessages,
    tickets: value.tickets as TicketItem[],
    activeReportId,
    ticketDraftFromDiagnosis: (value.ticketDraftFromDiagnosis as DiagnosisTemplate | null) || null,
    faultContext: (value.faultContext as FaultContext | null) || null,
    faultContexts: Array.isArray(value.faultContexts) ? (value.faultContexts as FaultContext[]) : [],
  };
};

const getDefaultPersistedState = (): PersistedAiDockSessions => {
  const first = createSession('当前会话');
  return { sessions: [first], activeSessionId: first.id };
};

export const parsePersistedSessions = (parsed: unknown): PersistedAiDockSessions | null => {
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as PersistedAiDockSessions).sessions)) {
    return null;
  }
  const candidate = parsed as PersistedAiDockSessions;
  const sessions = candidate.sessions.map(toValidSession).filter(Boolean) as AiConversationSession[];
  if (sessions.length === 0) return null;
  const activeSessionId = sessions.some((s) => s.id === candidate.activeSessionId)
    ? candidate.activeSessionId
    : sessions[0].id;
  return { sessions, activeSessionId };
};

export const useAiDock = () => {
  const getMediumSize = () => {
    if (typeof window === 'undefined') return { width: 860, height: 640 };
    return {
      width: Math.min(1120, Math.max(760, Math.round(window.innerWidth * 0.58))),
      height: Math.min(window.innerHeight - 16, Math.max(560, Math.round(window.innerHeight * 0.74))),
    };
  };

  const getCenteredPosition = (width: number, height: number) => {
    if (typeof window === 'undefined') return { x: 8, y: 8 };
    return {
      x: Math.min(Math.max(8, Math.round((window.innerWidth - width) / 2)), Math.max(8, window.innerWidth - width - 8)),
      y: Math.min(Math.max(8, Math.round((window.innerHeight - height) / 2)), Math.max(8, window.innerHeight - height - 8)),
    };
  };

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(0);
  const [windowSize, setWindowSize] = useState(() => getMediumSize());
  const [position, setPosition] = useState(() => {
    const size = getMediumSize();
    return getCenteredPosition(size.width, size.height);
  });
  const [initialPersisted] = useState<PersistedAiDockSessions>(() =>
    readLocalPersisted(AI_DOCK_SESSION_STORAGE_KEY, parsePersistedSessions, getDefaultPersistedState)
  );
  const [sessions, setSessions] = useState<AiConversationSession[]>(() => initialPersisted.sessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => initialPersisted.activeSessionId);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const processingRef = useRef(false);
  const stopRespondingRef = useRef(false);
  const persistWarnedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const remote = await readRemotePersisted(AI_DOCK_SESSION_ENDPOINT, parsePersistedSessions);
      if (cancelled) return;
      if (remote) {
        const localStamp = getPersistedStamp(initialPersisted);
        const remoteStamp = getPersistedStamp(remote);
        const preferred = localStamp > remoteStamp ? initialPersisted : remote;
        setSessions(preferred.sessions);
        setActiveSessionId(preferred.activeSessionId);
      }
      setSessionHydrated(true);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [initialPersisted]);

  useEffect(() => {
    if (sessions.length === 0) {
      const next = createSession('当前会话');
      setSessions([next]);
      setActiveSessionId(next.id);
      return;
    }
    if (!sessions.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    if (typeof window === 'undefined' || !sessionHydrated || sessions.length === 0) return;
    const payload: PersistedAiDockSessions = {
      sessions,
      activeSessionId,
    };
    writeLocalPersisted(AI_DOCK_SESSION_STORAGE_KEY, payload);
    void writeRemotePersisted(AI_DOCK_SESSION_ENDPOINT, payload)
      .then(() => {
        persistWarnedRef.current = false;
      })
      .catch(() => {
        if (persistWarnedRef.current) return;
        persistWarnedRef.current = true;
        showAppToast('云端会话保存失败，当前仅保存在本机浏览器。', {
          title: '已切换本地模式',
          tone: 'warning',
          duration: 3600,
        });
      });
  }, [activeSessionId, sessionHydrated, sessions]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0],
    [activeSessionId, sessions]
  );

  const messages = activeSession?.messages || [];
  const tickets = activeSession?.tickets || TICKETS;
  const activeReportId = activeSession?.activeReportId || REPORTS[0].id;
  const ticketDraftFromDiagnosis = activeSession?.ticketDraftFromDiagnosis || null;
  const faultContext = activeSession?.faultContext || null;
  const faultContexts = activeSession?.faultContexts || [];
  const activeCustomer = activeSession?.customer || CUSTOMER_POOL[0];

  const activeReport = useMemo(
    () => REPORTS.find((r) => r.id === activeReportId) || REPORTS[0],
    [activeReportId]
  );

  const quickChips = useMemo<QuickChip[]>(() => {
    const typeLabelMap: Record<'LINE' | '5G' | 'IDC' | 'SDWAN' | 'AIC', string> = {
      LINE: '专线',
      '5G': '5G',
      IDC: 'IDC',
      SDWAN: 'SD-WAN',
      AIC: '智算',
    };
    const types = activeCustomer.businessTypes || [];
    const typeText = types.length > 0 ? types.map((item) => typeLabelMap[item]).join('、') : '核心业务';
    const firstType = types[0] ? typeLabelMap[types[0]] : '核心业务';
    return [
      { id: 'chip_health', label: '业务诊断', prompt: `先诊断我名下${firstType}业务健康度` },
      { id: 'chip_business', label: '业务查询', prompt: `帮我查一下名下${typeText}业务清单` },
      { id: 'chip_report', label: '运行月报', prompt: `生成${activeCustomer.name}本月运行报告` },
      { id: 'chip_knowledge', label: '知识库', prompt: '基于当前业务类型推荐知识' },
      { id: 'chip_ticket', label: '工单追踪', prompt: '查一下我最近的工单进度' },
      { id: 'chip_fault', label: '自助报障', prompt: `按SLA承诺发起${firstType}业务报障` },
      { id: 'chip_manager', label: '联系经理', prompt: `联系客户经理${activeCustomer.accountManager.name}` },
    ];
  }, [activeCustomer.accountManager.name, activeCustomer.businessTypes, activeCustomer.name]);

  const normalizedManagedBusinesses = useMemo(() => {
    return MANAGED_BUSINESSES.map((item) => {
      const normalizedStatus = getManagedBusinessStatus(item);
      if (import.meta.env.DEV && normalizedStatus !== item.status) {
        // eslint-disable-next-line no-console
        console.warn(
          `[ai-dock] managed business status mismatch: ${item.name}, input=${item.status}, normalized=${normalizedStatus}`
        );
      }
      return { ...item, status: normalizedStatus };
    });
  }, []);

  const updateActiveSession = useCallback((updater: (session: AiConversationSession) => AiConversationSession) => {
    setSessions((prev) => prev.map((session) => (session.id === activeSessionId ? updater(session) : session)));
  }, [activeSessionId]);

  const appendMessage = useCallback((msg: Omit<AiMessage, 'id' | 'createdAt'> & Partial<Pick<AiMessage, 'id' | 'createdAt'>>) => {
    const next: AiMessage = {
      id: msg.id || createId('msg'),
      createdAt: msg.createdAt || Date.now(),
      role: msg.role,
      kind: msg.kind,
      text: msg.text,
      data: msg.data,
    };

    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: [...session.messages, next],
    }));

    if (!open || minimized) setUnread((u) => u + 1);
    return next.id;
  }, [minimized, open, updateActiveSession]);

  const updateMessageData = useCallback((id: string, data: any) => {
    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: session.messages.map((m) => (m.id === id ? { ...m, data: { ...m.data, ...data } } : m)),
    }));
  }, [updateActiveSession]);

  const updateMessageText = useCallback((id: string, text: string) => {
    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: session.messages.map((m) => (m.id === id ? { ...m, text } : m)),
    }));
  }, [updateActiveSession]);

  const upsertLatestReceiptCard = useCallback((
    matcher: (message: AiMessage) => boolean,
    data: any
  ) => {
    const existing = [...messages].reverse().find((message) => (
      message.role === 'assistant' && message.kind === 'receiptCard' && matcher(message)
    ));
    if (existing) {
      updateMessageData(existing.id, data);
      return existing.id;
    }
    return appendMessage({
      role: 'assistant',
      kind: 'receiptCard',
      data,
    });
  }, [appendMessage, messages, updateMessageData]);

  const createSystemNoticeFlow = useCallback((title: string, firstLog: string, progress = 0) => {
    const logs = appendFlowLog([], firstLog);
    const id = appendMessage({
      role: 'system',
      kind: 'systemNotice',
      data: {
        title,
        progress,
        status: 'running' as FlowStatus,
        logs,
      },
    });
    return { id, logs };
  }, [appendMessage]);

  const advanceSystemNoticeFlow = useCallback(
    (
      id: string,
      payload: {
        logs: FlowLogEntry[];
        logText?: string;
        title?: string;
        progress: number;
        status?: FlowStatus;
      }
    ) => {
      const logs = payload.logText ? appendFlowLog(payload.logs, payload.logText) : payload.logs;
      updateMessageData(id, {
        title: payload.title,
        progress: payload.progress,
        status: payload.status || (payload.progress >= 100 ? 'done' : 'running'),
        logs,
      });
      return logs;
    },
    [updateMessageData]
  );

  const streamAssistantText = useCallback(async (text: string) => {
    const source = text.trim();
    if (!source) return;
    const messageId = appendMessage({
      role: 'assistant',
      kind: 'text',
      text: '▌',
    });
    await delay(STREAM_PACE.initialDelay);

    let current = '';
    let index = 0;
    while (index < source.length) {
      if (stopRespondingRef.current) {
        updateMessageText(messageId, current || '已停止本次回复。');
        return;
      }
      const ch = source[index];
      const step = /[，。！？；,.!?：:\n]/.test(ch) ? 1 : Math.min(source.length - index, ch.charCodeAt(0) > 127 ? 1 : 2);
      current += source.slice(index, index + step);
      index += step;
      const hasMore = index < source.length;
      updateMessageText(messageId, hasMore ? `${current}▌` : current);
      const wait =
        /[，。！？；,.!?：:]/.test(ch)
          ? STREAM_PACE.punctuationPause
          : ch === '\n'
            ? STREAM_PACE.lineBreakPause
            : current.length < 8
              ? STREAM_PACE.introMin + Math.floor(Math.random() * STREAM_PACE.introSpan)
              : STREAM_PACE.normalMin + Math.floor(Math.random() * STREAM_PACE.normalSpan);
      await delay(wait);
    }
  }, [appendMessage, updateMessageText]);

  const appendCardWithThinking = useCallback(async (appendCard: () => void | Promise<void>, ms = 760) => {
    if (stopRespondingRef.current) return;
    const jitter = Math.floor(Math.random() * 520);
    await delay(ms + jitter);
    if (stopRespondingRef.current) return;
    await appendCard();
  }, []);

  const openWindow = useCallback(() => {
    const size = getMediumSize();
    setWindowSize(size);
    setPosition(getCenteredPosition(size.width, size.height));
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  }, []);

  const closeWindow = useCallback(() => {
    setOpen(false);
    setDrawer(null);
  }, []);

  const minimizeWindow = useCallback(() => {
    setMinimized(true);
  }, []);

  const restoreWindow = useCallback(() => {
    const size = getMediumSize();
    setWindowSize(size);
    setPosition(getCenteredPosition(size.width, size.height));
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  }, []);

  const clearConversation = useCallback(() => {
    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: welcomeMessages(),
      tickets: TICKETS,
      activeReportId: REPORTS[0].id,
      ticketDraftFromDiagnosis: null,
      faultContext: null,
      faultContexts: [],
    }));
    setDrawer(null);
    setIsResponding(false);
  }, [updateActiveSession]);

  const pushQa = useCallback((faq: FaqItem) => {
    const sources = buildKnowledgeSources([faq.sourceId]);
    appendMessage({
      role: 'assistant',
      kind: 'qa',
      data: {
        conclusion: sources.length ? `${faq.conclusion} [1]` : faq.conclusion,
        explanation: sources.length ? `${faq.explanation} [1]` : faq.explanation,
        suggestions: faq.suggestions || [],
        sourceId: faq.sourceId,
        sourceIds: sources.map((source) => source.id),
        sources,
        sourceUpdatedAt: sources[0]?.updatedAt,
        followups: faq.followups || [],
      } as QaPayload,
    });
  }, [appendMessage]);

  const runDiagnosisFlow = useCallback(async (template: DiagnosisTemplate) => {
    await runDiagnosisFlowRunner({
      template,
      stopRef: stopRespondingRef,
      appendMessage,
      updateMessageData,
    });
  }, [appendMessage, updateMessageData]);

  const runBusinessDiagnosisFlow = useCallback(async (targets: BusinessDiagnosisTarget[]) => {
    await runBusinessDiagnosisFlowRunner({
      targets,
      appendMessage,
      updateMessageData,
    });
  }, [appendMessage, updateMessageData]);

  const runReportExport = useCallback(async (type: 'pdf' | 'image' | 'word') => {
    try {
      exportReportFile(activeReport, activeCustomer, type);
    } catch {
      showAppToast(`${type === 'pdf' ? 'PDF' : type === 'word' ? 'Word' : '长图'}导出失败，请稍后再试`, 'error');
    }
  }, [activeCustomer, activeReport]);

  const generateBusinessDiagnosisBrief = useCallback(async (report: BusinessDiagnosisReportPayload) => {
    const abnormal = report.results.filter((item) => item.level === '异常');
    const warning = report.results.filter((item) => item.level === '关注');
    const topRisk = report.results.slice().sort((a, b) => a.score - b.score).slice(0, 3);

    const { id: noticeId, logs: initialLogs } = createSystemNoticeFlow('正在生成汇报说明...', '正在提取诊断结果中的关键结论', 20);
    let logs = initialLogs;
    await delay(320);
    logs = advanceSystemNoticeFlow(noticeId, {
      logs,
      logText: '已完成风险业务聚类与优先级排序',
      progress: 58,
      title: '正在生成汇报说明...',
    });
    await delay(320);
    logs = advanceSystemNoticeFlow(noticeId, {
      logs,
      logText: '已生成客户侧汇报话术与行动建议',
      progress: 92,
      title: '正在生成汇报说明...',
    });
    await delay(260);
    advanceSystemNoticeFlow(noticeId, {
      logs,
      logText: '汇报说明已生成，可直接用于客户沟通',
      progress: 100,
      status: 'done',
      title: '汇报说明生成完成',
    });

    const briefing = [
      '【业务诊断汇报说明】',
      `本次共诊断 ${report.total} 条业务，平均健康评分 ${report.averageScore} 分。`,
      `风险分布：异常 ${abnormal.length} 条，关注 ${warning.length} 条，健康 ${report.total - abnormal.length - warning.length} 条。`,
      '',
      '【重点风险摘要】',
      ...(topRisk.length > 0
        ? topRisk.map((item, index) => `${index + 1}. ${item.name}（${item.type}，${item.region}）评分 ${item.score}：${item.summary}`)
        : ['1. 当前未识别到高风险业务。']),
      '',
      '【后续操作建议】',
      ...report.nextActions.map((item, index) => `${index + 1}. ${item}`),
      '',
      '【客户沟通建议】',
      abnormal.length > 0
        ? '建议优先沟通异常业务的影响范围与恢复时间，并同步已启动报障处理。'
        : '建议向客户说明当前整体稳定，并承诺持续跟踪关键指标变化。',
    ].join('\n');

    appendMessage({
      role: 'assistant',
      kind: 'text',
      text: briefing,
    });
  }, [advanceSystemNoticeFlow, appendMessage, createSystemNoticeFlow]);

  const handleIntent = useCallback(async (inputRaw: string, intent?: IntentType) => {
    if (stopRespondingRef.current) return;
    const input = inputRaw.toLowerCase();
    const resolvedIntent = resolveIntent(inputRaw, intent);

    if (input.includes('二次提醒') || input.includes('再次提醒')) {
      trackIntentHit('other', 0);
      upsertLatestReceiptCard(
        (message) => {
          const title = String(message.data?.title || '');
          return title.includes('客户经理联络回执') || title.includes('客户经理二次提醒回执');
        },
        {
          title: '客户经理二次提醒回执',
          fields: [
            { label: '客户经理', value: `${activeCustomer.accountManager.name}（${activeCustomer.accountManager.phone}）` },
            { label: '提醒结果', value: '已发送二次提醒（含会话上下文）' },
            { label: '升级条件', value: `超过${activeCustomer.slas.responseMinutes}分钟仍无响应` },
          ],
          nextSteps: [
            '等待客户经理回呼',
            '超时未响应：升级至值班主管',
            '问题仍在扩大：建议同步发起报障',
          ],
          actions: [
            { key: 'fault', label: '发起报障', ask: '我要发起报障', tone: 'primary' },
          ],
        }
      );
      return;
    }

    if (input.includes('联系客户经理') || input.includes('客户经理')) {
      trackIntentHit('other', 0);
      upsertLatestReceiptCard(
        (message) => String(message.data?.title || '').includes('客户经理'),
        {
          title: '客户经理联系方式',
          fields: [
            { label: '客户经理', value: activeCustomer.accountManager.name },
            { label: '电话', value: activeCustomer.accountManager.phone },
            { label: '邮件', value: activeCustomer.accountManager.email },
            { label: '提示', value: `可直接电话联系，或等待${activeCustomer.slas.responseMinutes}分钟内回访。` },
          ],
          actions: [
            { key: 'remind', label: '立即二次提醒', ask: '请立即二次提醒客户经理并回传结果', tone: 'primary' },
          ],
        }
      );
      return;
    }

    if (isExplicitFeedbackIntent(input)) {
      trackIntentHit('other', 0);
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: { title: '反馈已记录，产品团队将在 1 个工作日内回访。', progress: 100 },
      });
      await streamAssistantText('感谢反馈，若您愿意我可以继续引导您描述复现步骤。');
      return;
    }

    if (input.includes('查看诊断历史')) {
      trackIntentHit('diagnosis', 0);
      setDrawer({ type: 'diagnosisHistory', list: DIAGNOSIS_TEMPLATES });
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: { title: '已打开诊断历史，可查看历史诊断结果与模板。', progress: 100 },
      });
      return;
    }

    if (input.includes('推荐优先诊断顺序') || input.includes('推荐诊断顺序') || input.includes('推荐优先级')) {
      trackIntentHit('diagnosis', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildDiagnosisPriorityPayload(activeCustomer),
        });
      }, 240);
      return;
    }

    if (input.includes('诊断正在进行') || input.includes('解释这个阶段')) {
      trackIntentHit('diagnosis', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildDiagnosisStagePayload(inputRaw),
        });
      }, 220);
      return;
    }

    if (input.includes('诊断已完成') && input.includes('处置建议')) {
      trackIntentHit('diagnosis', 0);
      const title = inputRaw.match(/诊断已完成（(.+?)）/)?.[1] || '诊断';
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildDiagnosisCompletionPayload(title),
        });
      }, 240);
      return;
    }

    if (input.includes('查看工单详情') || input.includes('打开工单详情')) {
      trackIntentHit('ticket', 0);
      const targetTicket = tickets[0] || TICKETS[0];
      setDrawer({ type: 'ticket', item: targetTicket });
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: { title: `已打开工单 ${targetTicket.id} 详情。`, progress: 100 },
      });
      return;
    }

    if (input.includes('查看本月运行报告') || input.includes('生成运行月报')) {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'reportCard', data: activeReport });
      }, 280);
      return;
    }

    if (input.includes('查看idc报告')) {
      trackIntentHit('report', 0);
      const idcReport = REPORTS.find((report) => report.title.includes('月报')) || activeReport;
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'reportCard', data: idcReport });
      }, 280);
      return;
    }

    if (input.includes('查看密钥健康详情')) {
      trackIntentHit('qa', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildQuantumKeyHealthPayload(),
        });
      }, 240);
      return;
    }

    if (input.includes('查看量子链路拓扑')) {
      trackIntentHit('qa', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildQuantumTopologyPayload(),
        });
      }, 240);
      return;
    }

    if (input.includes('查看pdu告警知识')) {
      trackIntentHit('knowledge', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildKnowledgeQaPayload(matchKnowledge('PDU 告警含义')),
        });
      }, 240);
      return;
    }

    if (input.includes('查看智算失败原因')) {
      trackIntentHit('knowledge', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildKnowledgeQaPayload(matchKnowledge('任务失败常见原因')),
        });
      }, 240);
      return;
    }

    if (input.includes('导出word') || input.includes('导出 word') || input.includes('word报告') || input.includes('word版')) {
      trackIntentHit('report', 0);
      await runReportExport('word');
      return;
    }

    if (input.includes('导出长图') || input.includes('生成长图') || input.includes('图片版报告')) {
      trackIntentHit('report', 0);
      await runReportExport('image');
      return;
    }

    if (input.includes('导出pdf') || input.includes('导出 pdf') || input.includes('pdf报告')) {
      trackIntentHit('report', 0);
      await runReportExport('pdf');
      return;
    }

    if (input.includes('导出报告')) {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: {
            conclusion: '请选择报告导出格式',
            explanation: '当前运行报告支持 Word、PDF 和长图三种格式。Word 适合正式编辑和归档，PDF 适合定稿发送，长图适合移动端快速转发。点击下方操作后会直接下载，不会再生成二次对话。',
            suggestions: ['导出Word报告', '导出PDF报告', '导出长图'],
            followups: ['哪种格式适合客户汇报？', '能先生成报告预览吗？'],
          },
        });
      }, 180);
      return;
    }

    if (input.includes('哪种格式适合客户汇报') || input.includes('哪种格式适合汇报') || input.includes('报告格式建议')) {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: {
            conclusion: '客户汇报优先使用 Word，定稿外发再转 PDF',
            explanation: '如果还需要客户经理补充措辞、删改风险描述或调整责任部门，建议先导出 Word；如果内容已经确认无误，建议导出 PDF 作为正式附件；如果只是微信群、移动端快速同步，可导出长图。当前报告预览已按 Word 结构组织，适合先导出 Word 后再人工润色。',
            suggestions: ['导出Word报告', '导出PDF报告', '生成客户汇报话术'],
            followups: ['能先生成报告预览吗？', '客户侧怎么说明风险？'],
          },
        });
      }, 180);
      return;
    }

    if (input.includes('生成报告预览') || input.includes('先生成报告预览') || input.includes('查看报告预览')) {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'reportCard', data: activeReport });
      }, 240);
      return;
    }

    if (input.includes('客户侧怎么说明风险') || input.includes('客户怎么说明风险') || input.includes('风险怎么对客户说')) {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildReportRiskCustomerExplanationPayload(activeReport, activeCustomer),
        });
      }, 220);
      return;
    }

    if (input.includes('正式的客户邮件') || input.includes('客户邮件版本') || input.includes('客户邮件草稿')) {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildReportRiskCustomerEmailPayload(activeReport, activeCustomer),
        });
      }, 220);
      return;
    }

    if (input.includes('简短的短信版本') || input.includes('短信版本') || input.includes('企微版本') || input.includes('微信版本')) {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildReportRiskSmsPayload(activeReport, activeCustomer),
        });
      }, 200);
      return;
    }

    if (input.includes('风险项如何降级') || input.includes('风险怎么降级') || input.includes('风险降级条件')) {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildReportRiskDowngradePayload(activeReport),
        });
      }, 220);
      return;
    }

    if (input.includes('生成客户汇报话术') || input.includes('整理给客户的话术') || input.includes('生成汇报说明')) {
      const latestReport = [...messages].reverse().find((message) => message.kind === 'businessDiagnosisReport' && message.data);
      if (latestReport?.data) {
        trackIntentHit('report', 0);
        await generateBusinessDiagnosisBrief(latestReport.data as BusinessDiagnosisReportPayload);
        return;
      }
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildReportCustomerBriefPayload(activeReport, activeCustomer),
        });
      }, 240);
      return;
    }

    if (input.includes('查看非正常业务')) {
      trackIntentHit('business', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'businessQuery',
          data: buildBusinessQueryData(activeCustomer),
        });
      }, 280);
      return;
    }

    if (input.includes('继续追踪') || input.includes('查看工单进度')) {
      trackIntentHit('ticket', 0);
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'ticketCard', data: tickets[0] || TICKETS[0] });
      }, 280);
      return;
    }

    if (input.includes('是否超过sla') || input.includes('是否超时') || input.includes('超过sla') || input.includes('需要催办吗') || input.includes('是否需要催办')) {
      trackIntentHit('ticket', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildSlaCheckPayload(tickets[0] || TICKETS[0], activeCustomer),
        });
      }, 240);
      return;
    }

    if (input.includes('生成报障描述') || input.includes('报障描述模板')) {
      trackIntentHit('fault', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildFaultDescriptionPayload(activeCustomer),
        });
      }, 240);
      return;
    }

    if (input.includes('校验这次报障') || input.includes('提交前校验')) {
      trackIntentHit('fault', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildFaultPrecheckPayload(inputRaw),
        });
      }, 220);
      return;
    }

    if (input.includes('补充影响范围') || input.includes('补什么材料') || input.includes('哪些材料最关键')) {
      trackIntentHit('fault', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildImpactSupplementPayload(),
        });
      }, 240);
      return;
    }

    const lastQaMessage = [...messages].reverse().find((message) => message.kind === 'qa' && message.data);
    const lastQaPayload = lastQaMessage?.data as QaPayload | undefined;

    if ((input.includes('原始知识') || input.includes('查看排查知识') || input.includes('看详细的')) && lastQaPayload) {
      const sourceId = getPrimaryQaSourceId(lastQaPayload);
      const source = sourceId ? KNOWLEDGE_ITEMS.find((item) => item.id === sourceId) : null;
      if (source) {
        trackIntentHit('knowledge', 0);
        setDrawer({ type: 'knowledge', item: source });
        appendMessage({
          role: 'system',
          kind: 'systemNotice',
          data: { title: `已打开知识《${source.title}》。`, progress: 100 },
        });
        return;
      }
    }

    if ((input.includes('输出执行步骤') || input.includes('执行步骤')) && lastQaPayload) {
      trackIntentHit('qa', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildQaExpansionPayload(lastQaPayload, '生成实施清单'),
        });
      }, 240);
      return;
    }

    if (input.includes('继续推荐同类知识') && lastQaPayload) {
      const relatedKnowledge = getRelatedKnowledgeForQa(lastQaPayload);
      if (relatedKnowledge.length > 0) {
        trackIntentHit('knowledge', 0);
        await appendCardWithThinking(() => {
          relatedKnowledge.forEach((item) => {
            appendMessage({
              role: 'assistant',
              kind: 'knowledgeCard',
              data: item,
            });
          });
        }, 240);
        return;
      }
    }

    if (isQaExpansionIntent(input) && lastQaMessage?.data) {
      trackIntentHit('qa', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildQaExpansionPayload(lastQaPayload as QaPayload, input),
        });
      }, 240);
      return;
    }

    const lastActionableMessage = [...messages].reverse().find((message) =>
      ['diagnosisReport', 'receiptCard', 'ticketCard', 'reportCard', 'businessDiagnosisReport', 'businessQuery'].includes(message.kind)
    );
    const contextAdvice = isContextAdviceIntent(input) ? buildContextAdvicePayload(lastActionableMessage) : null;
    if (contextAdvice) {
      trackIntentHit('qa', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: contextAdvice,
        });
      }, 280);
      return;
    }

    if (input.includes('催办') && input.includes('工单')) {
      trackIntentHit('ticket', 0);
      const targetTicket = tickets[0] || TICKETS[0];
      appendMessage({
        role: 'assistant',
        kind: 'receiptCard',
        data: {
          title: '工单催办结果',
          fields: [
            { label: '工单号', value: targetTicket.id },
            { label: '催办结果', value: `已催办，预计${activeCustomer.slas.restoreHours}小时内完成处理。` },
          ],
          actions: [
            { key: 'track', label: '继续追踪', ask: `继续追踪工单 ${targetTicket.id} 的处理进展`, tone: 'primary' },
          ],
        },
      });
      return;
    }

    if (input.includes('相关知识') || input.includes('知识列表') || input === '知识库' || input.includes('按业务类型筛')) {
      trackIntentHit('knowledge', 0);
      const knowledgeList = searchKnowledge(inputRaw, 3);
      const primary = knowledgeList[0] || KNOWLEDGE_ITEMS[0];
      appendMessage({
        role: 'assistant',
        kind: 'qa',
        data: buildKnowledgeQaPayload(primary),
      });
      return;
    }

    if (resolvedIntent === 'report') {
      trackIntentHit('report', 0);
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'reportCard', data: activeReport });
      });
      return;
    }

    if (resolvedIntent === 'business') {
      trackIntentHit('business', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'businessQuery',
          data: buildBusinessQueryData(activeCustomer),
        });
      }, 460);
      return;
    }

    if (resolvedIntent === 'ticket') {
      trackIntentHit('ticket', 0);
      await appendCardWithThinking(() => {
        const list = (tickets.length > 0 ? tickets : TICKETS).slice(0, 8);
        appendMessage({
          role: 'assistant',
          kind: 'ticketCard',
          data: {
            mode: 'list',
            title: `最近工单进度（共${list.length}条）`,
            slaText: `SLA承诺：${activeCustomer.slas.responseMinutes}分钟响应 / ${activeCustomer.slas.restoreHours}小时恢复`,
            tickets: list,
          },
        });
      }, 420);
      return;
    }

    if (resolvedIntent === 'fault') {
      trackIntentHit('fault', 0);
      await appendCardWithThinking(() => {
        const riskContextMap = new Map(
          faultContexts.map((item) => [item.business, item])
        );
        if (faultContext?.business) riskContextMap.set(faultContext.business, faultContext);
        const businessOptions = buildBusinessQueryData(activeCustomer)
          .flatMap((category) => category.items.map((item) => {
            const riskContext = riskContextMap.get(item.name);
            return {
            id: item.id,
            label: `${category.label}｜${item.name}`,
            value: item.name,
            type: category.label,
            region: item.region,
            site: item.site,
            risk: Boolean(riskContext),
            riskSeverity: riskContext?.severity,
          };
          }));
        const defaultBusinesses = faultContexts.length > 0
          ? Array.from(new Set(faultContexts.map((item) => item.business)))
          : [faultContext?.business || ticketDraftFromDiagnosis?.name || businessOptions[0]?.value || '政企业务专网'];
        appendMessage({
          role: 'assistant',
          kind: 'faultForm',
          data: {
            defaultTitle: faultContext?.title || (ticketDraftFromDiagnosis ? `${ticketDraftFromDiagnosis.name}异常报障` : '业务异常报障'),
            defaultBusiness: defaultBusinesses[0],
            defaultBusinesses,
            defaultDesc: faultContext?.desc || '',
            defaultSeverity: faultContext?.severity || '中',
            context: faultContext,
            contexts: faultContexts,
            businessOptions,
            fromDiagnosis: !!ticketDraftFromDiagnosis || !!faultContext || faultContexts.length > 0,
          },
        });
      }, 420);
      return;
    }

    if (resolvedIntent === 'diagnosis') {
      trackIntentHit('diagnosis', 0);
      const matched = pickDiagnosis(input);
      if (!matched) {
        await appendCardWithThinking(() => {
          appendMessage({
            role: 'assistant',
            kind: 'businessDiagnosisSelect',
            data: buildBusinessQueryData(activeCustomer),
          });
        }, 360);
      } else {
        await runDiagnosisFlow(matched);
      }
      return;
    }

    const faq = findFaq(input);
    if (faq) {
      trackIntentHit('qa', 0);
      await appendCardWithThinking(() => {
        pushQa(faq);
      }, 360);
      return;
    }

    if (resolvedIntent === 'knowledge') {
      trackIntentHit('knowledge', 0);
      const knowledgeList = searchKnowledge(inputRaw, 3);
      const knowledge = knowledgeList[0] || matchKnowledge(input);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: buildKnowledgeQaPayload(knowledge),
        });
      }, 360);
      return;
    }

    if (resolvedIntent === 'qa') {
      trackIntentHit('qa', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: {
            conclusion: '当前业务整体健康，重点风险集中在5G和智算高峰时段。',
            explanation: '建议优先关注5G接入波动和智算排队时延，已可直接发起诊断。',
            suggestions: ['发起5G诊断', '查看本月运行报告'],
            followups: ['本周告警趋势如何？', '有待处理工单吗？', '给我一个优化建议'],
          } as QaPayload,
        });
      }, 360);
      return;
    }

    await appendCardWithThinking(() => {
      trackFallback();
      appendMessage({
        role: 'assistant',
        kind: 'fallback',
        data: {
          title: '暂时没找到准确答案',
          desc: '可以换个关键词，或直接联系客户经理协助处理。',
        },
      });
    }, 360);
  }, [activeCustomer, activeReport, appendCardWithThinking, appendMessage, faultContext, faultContexts, generateBusinessDiagnosisBrief, messages, pushQa, runDiagnosisFlow, runReportExport, ticketDraftFromDiagnosis, tickets]);

  const sendUserText = useCallback(async (text: string, forcedIntent?: IntentType) => {
    const slash = parseSlashCommand(text);
    const normalized = slash?.prompt || text;
    const finalIntent = slash?.intent || forcedIntent;
    const trimmed = normalized.trim();
    if (!trimmed || processingRef.current) return;

    stopRespondingRef.current = false;
    processingRef.current = true;
    setIsResponding(true);

    updateActiveSession((session) => {
      const shouldRename = session.messages.length === 0 || session.title === '新会话' || session.title === '当前会话';
      return shouldRename
        ? { ...session, title: formatSessionTitle(trimmed), updatedAt: Date.now() }
        : session;
    });

    appendMessage({ role: 'user', kind: 'text', text: trimmed });
    trackIntentHit('other');
    try {
      await delay(280);
      if (stopRespondingRef.current) return;
      await handleIntent(trimmed, finalIntent);
    } catch (_error) {
      appendMessage({
        role: 'assistant',
        kind: 'fallback',
        data: {
          title: '处理失败，请重试',
          desc: '本次请求未成功完成，您可以重试当前问题，或稍后再试。',
        },
      });
      showAppToast('请求处理失败，请重试。', {
        title: '智能体处理异常',
        tone: 'danger',
        duration: 2400,
      });
    } finally {
      setIsResponding(false);
      processingRef.current = false;
      stopRespondingRef.current = false;
    }
  }, [appendMessage, handleIntent, updateActiveSession]);

  const submitKnowledgeFeedback = useCallback((payload: { id: string; feedback: KnowledgeFeedbackType }) => {
    trackKnowledgeFeedback(payload.feedback);
  }, []);

  const stopResponding = useCallback(() => {
    if (!processingRef.current) return;
    stopRespondingRef.current = true;
    processingRef.current = false;
    setIsResponding(false);
  }, []);

  const handleQuickChip = useCallback(async (chip: QuickChip) => {
    await sendUserText(chip.prompt);
  }, [sendUserText]);

  const retryLastQuestion = useCallback(async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user' && typeof m.text === 'string' && m.text.trim());
    if (!lastUser?.text) return;
    await sendUserText(lastUser.text);
  }, [messages, sendUserText]);

  const openKnowledgeDrawer = useCallback((id: string) => {
    const item = KNOWLEDGE_ITEMS.find((k) => k.id === id);
    if (item) setDrawer({ type: 'knowledge', item });
  }, []);

  const openReportHistory = useCallback(() => {
    setDrawer({ type: 'reportHistory', list: REPORTS });
  }, []);

  const openDiagnosisHistory = useCallback(() => {
    setDrawer({ type: 'diagnosisHistory', list: DIAGNOSIS_TEMPLATES });
  }, []);

  const openTicketDetail = useCallback((id: string, fallback?: TicketItem) => {
    const item = tickets.find((t) => t.id === id) || fallback;
    if (item) setDrawer({ type: 'ticket', item });
  }, [tickets]);

  const handleTicketCustomerAction = useCallback((payload: {
    ticketId: string;
    action: 'supplement' | 'urge' | 'confirm' | 'reopen';
    note?: string;
  }) => {
    const now = Date.now();
    const timeText = new Date(now).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    let rejectedReason = '';
    let actionText = '';
    let followupText = '';

    updateActiveSession((session) => {
      const nextTickets = session.tickets.map((ticket) => {
        if (ticket.id !== payload.ticketId) return ticket;
        const reduced = reduceTicketCustomerAction({
          ticket,
          action: payload.action,
          now,
          timeText,
          note: payload.note,
        });
        if (!reduced.ok) {
          rejectedReason = reduced.reason;
          return ticket;
        }
        actionText = reduced.actionText;
        followupText = reduced.followupText;
        return reduced.ticket;
      });
      const activeTicket = nextTickets.find((item) => item.id === payload.ticketId);
      const nextDrawer = drawer?.type === 'ticket' && activeTicket
        ? { ...drawer, item: activeTicket }
        : drawer;
      if (nextDrawer !== drawer) setDrawer(nextDrawer);
      return {
        ...session,
        updatedAt: Date.now(),
        tickets: nextTickets,
      };
    });

    if (rejectedReason) {
      showAppToast(rejectedReason, {
        title: TICKET_TEXT.actionBlockedTitle,
        tone: 'warning',
      });
      return;
    }

    if (actionText) {
      appendMessage({
        role: 'assistant',
        kind: 'receiptCard',
        data: buildTicketCustomerActionReceipt({
          ticketId: payload.ticketId,
          actionText,
          timeText,
          followupText,
        }),
      });
    }
  }, [appendMessage, drawer, updateActiveSession]);

  const submitFaultTicket = useCallback(async (payload: { title: string; business: string; businesses?: string[]; desc: string; severity: string }) => {
    const ticketResult = await submitFaultTicketFlow({
      payload,
      setIsResponding,
      appendMessage,
      updateActiveSession,
      createSystemNoticeFlow,
      advanceSystemNoticeFlow,
    });
    appendMessage({
      role: 'system',
      kind: 'systemNotice',
      data: {
        title: `SLA承诺：${activeCustomer.slas.responseMinutes}分钟响应 / ${activeCustomer.slas.restoreHours}小时恢复`,
        progress: 100,
        status: 'done',
      },
    });
    appendMessage({
      role: 'assistant',
      kind: 'receiptCard',
      data: buildTicketFaultReceipt({
        ticketId: ticketResult.firstTicketId,
        responseMinutes: activeCustomer.slas.responseMinutes,
        restoreHours: activeCustomer.slas.restoreHours,
        owner: ticketResult.owner,
        ticketCount: ticketResult.ticketCount,
      }),
    });

    const autoMoveDecision = decideAutoMoveToCustomerConfirm({
      severity: payload.severity,
      desc: payload.desc,
      ticketCount: ticketResult.ticketCount,
    });
    if (!autoMoveDecision.allow) {
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: {
          title: buildTicketStillProcessingNotice({
            ticketId: ticketResult.firstTicketId,
            reason: autoMoveDecision.reason || '需人工复核后再确认',
          }),
          progress: 100,
          status: 'done',
        },
      });
      return;
    }

    await delay(900);
    const focusTicketId = ticketResult.firstTicketId;
    if (!focusTicketId) return;
    let pushed = false;
    updateActiveSession((session) => {
      const tickets = session.tickets.map((ticket) => {
        if (ticket.id !== focusTicketId || ticket.status === TICKET_TEXT.pendingConfirmStatus || ticket.status === TICKET_TEXT.doneStatus) return ticket;
        pushed = true;
        const timeText = new Date().toLocaleTimeString('zh-CN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });
        return {
          ...ticket,
          status: TICKET_TEXT.pendingConfirmStatus,
          updatedAt: `${new Date().toISOString().slice(0, 10)} ${timeText}`,
          timeline: [...ticket.timeline, { time: timeText, text: TICKET_TEXT.pendingConfirmTimeline }],
        };
      });
      return { ...session, updatedAt: Date.now(), tickets };
    });
    if (!pushed) return;
    appendMessage({
      role: 'system',
      kind: 'systemNotice',
      data: {
        title: buildTicketPendingConfirmNotice(focusTicketId),
        progress: 100,
        status: 'done',
      },
    });
    appendMessage({
      role: 'assistant',
      kind: 'receiptCard',
      data: buildTicketCustomerConfirmGuideReceipt(focusTicketId),
    });
  }, [activeCustomer.slas.restoreHours, activeCustomer.slas.responseMinutes, advanceSystemNoticeFlow, appendMessage, createSystemNoticeFlow, updateActiveSession]);

  const setActiveReportId = useCallback((id: string) => {
    updateActiveSession((session) => ({ ...session, activeReportId: id, updatedAt: Date.now() }));
  }, [updateActiveSession]);

  const setTicketDraftFromDiagnosis = useCallback((diagnosis: DiagnosisTemplate | null) => {
    updateActiveSession((session) => ({ ...session, ticketDraftFromDiagnosis: diagnosis, updatedAt: Date.now() }));
  }, [updateActiveSession]);

  const setFaultContext = useCallback((context: FaultContext | null) => {
    updateActiveSession((session) => ({ ...session, faultContext: context, faultContexts: context ? [context] : [], updatedAt: Date.now() }));
  }, [updateActiveSession]);

  const setFaultContexts = useCallback((contexts: FaultContext[]) => {
    updateActiveSession((session) => ({ ...session, faultContexts: contexts, updatedAt: Date.now() }));
  }, [updateActiveSession]);

  const createConversation = useCallback(() => {
    const next = createSession();
    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(next.id);
    setDrawer(null);
    setIsResponding(false);
  }, []);

  const switchConversation = useCallback((id: string) => {
    if (id === activeSessionId) return;
    setActiveSessionId(id);
    setDrawer(null);
    setIsResponding(false);
  }, [activeSessionId]);

  const deleteConversation = useCallback((id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const next = createSession('当前会话');
        setActiveSessionId(next.id);
        return [next];
      }
      if (!filtered.some((s) => s.id === activeSessionId)) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
    setDrawer(null);
  }, [activeSessionId]);

  const deleteConversations = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    if (!idSet.size) return;
    setSessions((prev) => {
      const filtered = prev.filter((s) => !idSet.has(s.id));
      if (filtered.length === 0) {
        const next = createSession('当前会话');
        setActiveSessionId(next.id);
        return [next];
      }
      if (!filtered.some((s) => s.id === activeSessionId)) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
    setDrawer(null);
  }, [activeSessionId]);

  const sessionMetas = useMemo<AiConversationSessionMeta[]>(() => {
    return [...sessions]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((session) => {
        const last = session.messages[session.messages.length - 1];
        return {
          id: session.id,
          title: session.title,
          updatedAt: session.updatedAt,
          lastText: extractMessagePreview(last),
          messageCount: session.messages.length,
          customerName: session.customer.name,
          snapshotTags: buildSessionSnapshotTags(session.messages),
        };
      });
  }, [sessions]);

  return {
    open,
    minimized,
    unread,
    position,
    windowSize,
    setWindowSize,
    setPosition,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    clearConversation,
    messages,
    isResponding,
    sendUserText,
    stopResponding,
    quickChips,
    handleQuickChip,
    retryLastQuestion,
    drawer,
    setDrawer,
    openKnowledgeDrawer,
    openReportHistory,
    openDiagnosisHistory,
    openTicketDetail,
    handleTicketCustomerAction,
    activeReport,
    setActiveReportId,
    runReportExport,
    runDiagnosisFlow,
    runBusinessDiagnosisFlow,
    generateBusinessDiagnosisBrief,
    setTicketDraftFromDiagnosis,
    setFaultContext,
    setFaultContexts,
    submitFaultTicket,
    managedBusinesses: normalizedManagedBusinesses,
    activeCustomer,
    activeSessionId,
    sessionMetas,
    createConversation,
    switchConversation,
    deleteConversation,
    deleteConversations,
    submitKnowledgeFeedback,
  };
};

export type AiDockStore = ReturnType<typeof useAiDock>;
