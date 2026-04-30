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

export type MessageRole = 'assistant' | 'user' | 'system';
export type MessageKind =
  | 'text'
  | 'qa'
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

const quickChips: QuickChip[] = [
  { id: 'chip_health', label: '业务诊断', prompt: '帮我做一次业务诊断' },
  { id: 'chip_business', label: '业务查询', prompt: '帮我查一下我名下都有哪些业务' },
  { id: 'chip_report', label: '运行月报', prompt: '生成本月运行报告' },
  { id: 'chip_knowledge', label: '知识库', prompt: '量子加密保护是什么' },
  { id: 'chip_ticket', label: '工单追踪', prompt: '查一下我最近的工单进度' },
  { id: 'chip_fault', label: '自助报障', prompt: '我要发起报障' },
  { id: 'chip_manager', label: '联系经理', prompt: '联系客户经理' },
];

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
};

const CUSTOMER_POOL: CustomerContext[] = [
  { name: '安徽交控集团', code: 'CUST-AHJT-0001' },
  { name: '合肥工业大学', code: 'CUST-HFUT-0002' },
  { name: '奇瑞汽车股份', code: 'CUST-CHERY-0003' },
  { name: '科大讯飞股份', code: 'CUST-IFLYTEK-0004' },
  { name: '安徽电力公司', code: 'CUST-STATEGRID-0005' },
  { name: '中国声谷园区', code: 'CUST-SOUNDVALLEY-0006' },
  { name: '芜湖港航集团', code: 'CUST-WHPORT-0007' },
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
    appendMessage({
      role: 'assistant',
      kind: 'qa',
      data: {
        conclusion: faq.conclusion,
        explanation: faq.explanation,
        suggestions: faq.suggestions || [],
        sourceId: faq.sourceId,
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
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: { title: '已通知客户经理，预计 5 分钟内与您联系。', progress: 100 },
      });
      await streamAssistantText('我已把当前会话上下文同步给客户经理，您也可以继续描述问题细节。');
      return;
    }

    if (input.includes('反馈') || input.includes('意见') || input.includes('建议')) {
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: { title: '反馈已记录，产品团队将在 1 个工作日内回访。', progress: 100 },
      });
      await streamAssistantText('感谢反馈，若您愿意我可以继续引导您描述复现步骤。');
      return;
    }

    if (input.includes('相关知识') || input.includes('知识列表') || input === '知识库' || input.includes('按业务类型筛')) {
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
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'reportCard', data: activeReport });
      });
      return;
    }

    if (resolvedIntent === 'business') {
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
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'ticketCard', data: tickets[0] || TICKETS[0] });
      }, 420);
      return;
    }

    if (resolvedIntent === 'fault') {
      await appendCardWithThinking(() => {
        const businessOptions = buildBusinessQueryData(activeCustomer)
          .flatMap((category) => category.items.slice(0, 10).map((item) => ({
            id: item.id,
            label: `${category.label}｜${item.name}`,
            value: item.name,
            type: category.label,
            region: item.region,
            site: item.site,
          })));
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
      await appendCardWithThinking(() => {
        pushQa(faq);
      }, 360);
      return;
    }

    if (resolvedIntent === 'knowledge') {
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
      appendMessage({
        role: 'assistant',
        kind: 'fallback',
        data: {
          title: '暂时没找到准确答案',
          desc: '可以换个关键词，或直接联系客户经理协助处理。',
        },
      });
    }, 360);
  }, [activeCustomer, activeReport, appendCardWithThinking, appendMessage, faultContext, faultContexts, pushQa, runDiagnosisFlow, ticketDraftFromDiagnosis, tickets]);

  const sendUserText = useCallback(async (text: string, forcedIntent?: IntentType) => {
    const trimmed = text.trim();
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
    try {
      await delay(280);
      if (stopRespondingRef.current) return;
      await handleIntent(trimmed, forcedIntent);
    } finally {
      setIsResponding(false);
      processingRef.current = false;
      stopRespondingRef.current = false;
    }
  }, [appendMessage, handleIntent, updateActiveSession]);

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

  const openTicketDetail = useCallback((id: string) => {
    const item = tickets.find((t) => t.id === id);
    if (item) setDrawer({ type: 'ticket', item });
  }, [tickets]);

  const submitFaultTicket = useCallback(async (payload: { title: string; business: string; businesses?: string[]; desc: string; severity: string }) => {
    await submitFaultTicketFlow({
      payload,
      setIsResponding,
      appendMessage,
      updateActiveSession,
      createSystemNoticeFlow,
      advanceSystemNoticeFlow,
    });
  }, [advanceSystemNoticeFlow, appendMessage, createSystemNoticeFlow, updateActiveSession]);

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
    activeSessionId,
    sessionMetas,
    createConversation,
    switchConversation,
    deleteConversation,
    deleteConversations,
  };
};

export type AiDockStore = ReturnType<typeof useAiDock>;
