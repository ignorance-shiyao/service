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

const AI_DOCK_SESSION_STORAGE_KEY = 'ai_dock_sessions_json_v1';
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
  accountManager: { name: string; phone: string };
  slas: { responseMinutes: number; restoreHours: number };
};

const CUSTOMER_POOL: CustomerContext[] = [
  { name: '安徽交控集团', code: 'CUST-AHJT-0001', businessTypes: ['LINE', 'SDWAN', 'IDC'], accountManager: { name: '李明', phone: '138****5678' }, slas: { responseMinutes: 15, restoreHours: 2 } },
  { name: '合肥工业大学', code: 'CUST-HFUT-0002', businessTypes: ['LINE', '5G', 'IDC'], accountManager: { name: '王婷', phone: '139****2088' }, slas: { responseMinutes: 20, restoreHours: 4 } },
  { name: '奇瑞汽车股份', code: 'CUST-CHERY-0003', businessTypes: ['LINE', '5G', 'AIC', 'SDWAN'], accountManager: { name: '赵凯', phone: '137****9221' }, slas: { responseMinutes: 10, restoreHours: 2 } },
  { name: '科大讯飞股份', code: 'CUST-IFLYTEK-0004', businessTypes: ['AIC', 'SDWAN', 'LINE'], accountManager: { name: '周宁', phone: '136****1123' }, slas: { responseMinutes: 15, restoreHours: 3 } },
  { name: '安徽电力公司', code: 'CUST-STATEGRID-0005', businessTypes: ['LINE', 'IDC', '5G'], accountManager: { name: '陈璐', phone: '135****0029' }, slas: { responseMinutes: 15, restoreHours: 2 } },
  { name: '中国声谷园区', code: 'CUST-SOUNDVALLEY-0006', businessTypes: ['5G', 'SDWAN', 'AIC'], accountManager: { name: '许航', phone: '188****8712' }, slas: { responseMinutes: 20, restoreHours: 4 } },
  { name: '芜湖港航集团', code: 'CUST-WHPORT-0007', businessTypes: ['LINE', 'SDWAN'], accountManager: { name: '何晶', phone: '189****6619' }, slas: { responseMinutes: 30, restoreHours: 6 } },
];

const randomCustomerContext = (seed?: number): CustomerContext => {
  const index = typeof seed === 'number' ? seed % CUSTOMER_POOL.length : Math.floor(Math.random() * CUSTOMER_POOL.length);
  return CUSTOMER_POOL[index];
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
  input.includes('实施清单') ||
  input.includes('风险点');

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
    const categories = message.data as Array<{ label: string; items: BusinessQueryItem[] }>;
    const total = categories.reduce((sum, category) => sum + category.items.length, 0);
    const riskItems = categories.flatMap((category) =>
      category.items
        .filter((item) => item.details.some((detail) =>
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


const toValidSession = (value: any): AiConversationSession | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return null;
  if (!Array.isArray(value.messages) || !Array.isArray(value.tickets)) return null;
  const activeReportId = typeof value.activeReportId === 'string' ? value.activeReportId : REPORTS[0].id;
  const customer = value.customer && typeof value.customer.name === 'string' && typeof value.customer.code === 'string'
    ? (value.customer as CustomerContext)
    : randomCustomerContext(typeof value.createdAt === 'number' ? value.createdAt : Date.now());
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

const parsePersistedSessions = (parsed: unknown): PersistedAiDockSessions | null => {
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

  const runReportExport = useCallback(async (type: 'pdf' | 'image') => {
    const docName = type === 'pdf' ? 'PDF' : '长图';
    const { id, logs: initialLogs } = createSystemNoticeFlow(`正在生成${docName}...`, `开始生成${docName}文件`, 20);
    let logs = initialLogs;
    await delay(420);
    logs = advanceSystemNoticeFlow(id, {
      logs,
      logText: '已完成图表渲染与数据聚合',
      progress: 55,
      title: `正在生成${docName}...`,
    });
    await delay(420);
    logs = advanceSystemNoticeFlow(id, {
      logs,
      logText: '已完成模板排版与导出封装',
      progress: 85,
      title: `正在生成${docName}...`,
    });
    await delay(360);
    advanceSystemNoticeFlow(id, {
      logs,
      logText: `${docName}已生成，可执行下载`,
      progress: 100,
      status: 'done',
      title: `已生成${docName}，点击下载`,
    });
  }, [advanceSystemNoticeFlow, createSystemNoticeFlow]);

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

    if (input.includes('联系客户经理') || input.includes('客户经理')) {
      trackIntentHit('other', 0);
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: { title: '已通知客户经理，预计 5 分钟内与您联系。', progress: 100 },
      });
      appendMessage({
        role: 'assistant',
        kind: 'receiptCard',
        data: {
          title: '客户经理联络回执',
          fields: [
            { label: '客户经理', value: `${activeCustomer.accountManager.name}（${activeCustomer.accountManager.phone}）` },
            { label: '通知渠道', value: '应用内通知 + 短信提醒' },
            { label: '预计回呼', value: '5分钟内' },
          ],
          nextSteps: [
            '5分钟无回呼：自动二次提醒',
            `超过${activeCustomer.slas.responseMinutes}分钟：升级至值班主管`,
            '仍无响应：转二线专家组介入',
          ],
          actions: [
            { key: 'remind', label: '立即二次提醒', ask: '请立即二次提醒客户经理并回传结果', tone: 'primary' },
          ],
        },
      });
      await streamAssistantText('我已把当前会话上下文同步给客户经理，您可以继续补充问题细节以便更快处理。');
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

    if (input.includes('导出报告')) {
      trackIntentHit('report', 0);
      await runReportExport('pdf');
      return;
    }

    if (input.includes('生成客户汇报话术') || input.includes('整理给客户的话术')) {
      const latestReport = [...messages].reverse().find((message) => message.kind === 'businessDiagnosisReport' && message.data);
      if (latestReport?.data) {
        trackIntentHit('report', 0);
        await generateBusinessDiagnosisBrief(latestReport.data as BusinessDiagnosisReportPayload);
        return;
      }
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

    const lastQaMessage = [...messages].reverse().find((message) => message.kind === 'qa' && message.data);
    if (isQaExpansionIntent(input) && lastQaMessage?.data) {
      const previous = lastQaMessage.data as QaPayload;
      trackIntentHit('qa', 0);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: {
            conclusion: `${previous.conclusion}的落地建议`,
            explanation: [
              previous.explanation,
              '落地时建议先确认适用业务范围与当前风险，再按“先监测、再小范围验证、最后推广”的顺序执行。过程中保留回退方案，遇到指标持续异常时直接转人工客户经理确认。',
            ].join(' '),
            suggestions: ['生成实施清单', '列出风险点', '转人工客户经理确认'],
            sourceId: previous.sourceId,
            sourceIds: previous.sourceIds,
            sources: previous.sources,
            sourceUpdatedAt: previous.sourceUpdatedAt,
            followups: ['需要哪些前置条件？', '如何判断落地效果？', '异常时怎么回退？'],
          } as QaPayload,
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
      const { id: urgeNoticeId, logs: urgeLogs0 } = createSystemNoticeFlow(
        `工单 ${targetTicket.id} 催办处理中`,
        '已提交催办请求至责任人',
        35
      );
      await delay(320);
      const urgeLogs1 = advanceSystemNoticeFlow(urgeNoticeId, {
        logs: urgeLogs0,
        logText: '已同步客户SLA承诺与当前处理时限',
        progress: 72,
        title: `工单 ${targetTicket.id} 催办处理中`,
      });
      await delay(280);
      advanceSystemNoticeFlow(urgeNoticeId, {
        logs: urgeLogs1,
        logText: '催办完成，预计10分钟内反馈处理进展',
        progress: 100,
        status: 'done',
        title: `工单 ${targetTicket.id} 催办已送达`,
      });
      appendMessage({
        role: 'assistant',
        kind: 'receiptCard',
        data: {
          title: '工单催办回执',
          fields: [
            { label: '工单号', value: targetTicket.id },
            { label: '当前跟进', value: targetTicket.owner },
            { label: '催办结果', value: '已送达责任人并同步值班群' },
            { label: 'SLA时限', value: `${activeCustomer.slas.responseMinutes}分钟响应` },
          ],
          nextSteps: [
            '等待责任人反馈最新处理进展',
            '若超时未更新：自动升级至值班主管',
            '必要时直接转二线专家组接管',
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
        appendMessage({ role: 'assistant', kind: 'ticketCard', data: tickets[0] || TICKETS[0] });
        appendMessage({
          role: 'assistant',
          kind: 'text',
          text: `当前SLA承诺：${activeCustomer.slas.responseMinutes}分钟响应 / ${activeCustomer.slas.restoreHours}小时恢复。可直接发送“催办工单”触发升级提醒。`,
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
