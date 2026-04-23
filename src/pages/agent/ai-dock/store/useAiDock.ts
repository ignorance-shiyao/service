import { useCallback, useMemo, useRef, useState } from 'react';
import { KNOWLEDGE_ITEMS, KnowledgeItem } from '../mocks/knowledge';
import { FAQ_ITEMS, FaqItem } from '../mocks/faq';
import { REPORTS, ReportItem } from '../mocks/reports';
import { DIAGNOSIS_STEPS, DIAGNOSIS_TEMPLATES, DiagnosisTemplate } from '../mocks/diagnosis';
import { TICKETS, TicketItem } from '../mocks/tickets';
import { MANAGED_BUSINESSES } from '../mocks/businesses';
import { createId } from '../utils/id';
import { delay } from '../utils/delay';
import { detectIntent, IntentType } from './mockIntent';

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

const quickChips: QuickChip[] = [
  { id: 'chip_health', label: '业务体检', prompt: '帮我做一次业务体检' },
  { id: 'chip_business', label: '业务查询', prompt: '帮我查一下我名下都有哪些业务' },
  { id: 'chip_report', label: '运行月报', prompt: '生成本月运行报告' },
  { id: 'chip_knowledge', label: '知识库', prompt: '量子加密保护是什么' },
  { id: 'chip_ticket', label: '工单追踪', prompt: '查一下我最近的工单进度' },
  { id: 'chip_fault', label: '自助报障', prompt: '我要发起报障' },
  { id: 'chip_manager', label: '联系经理', prompt: '联系客户经理' },
];

const welcomeMessages = (): AiMessage[] => [];

const findFaq = (input: string): FaqItem | undefined =>
  FAQ_ITEMS.find((item) => input.includes(item.q.replace(/[？?]/g, '').toLowerCase()));

const matchKnowledge = (input: string): KnowledgeItem => {
  const hit = KNOWLEDGE_ITEMS.find(
    (k) => input.includes(k.title.toLowerCase()) || k.tags.some((tag) => input.includes(tag.toLowerCase()))
  );
  return hit || KNOWLEDGE_ITEMS[0];
};

const pickDiagnosis = (input: string): DiagnosisTemplate | undefined => {
  if (input.includes('专线')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'LINE');
  if (input.includes('5g')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === '5G');
  if (input.includes('idc')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'IDC');
  if (input.includes('sdwan') || input.includes('量子')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'SDWAN');
  if (input.includes('智算')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'AIC');
  return undefined;
};

type BusinessQueryItem = {
  id: string;
  name: string;
  site: string;
  region: string;
  status: 'normal' | 'warning' | 'danger';
  bandwidth: string;
  updatedAt: string;
  owner: string;
};

type BusinessQueryCategory = {
  code: ManagedBusiness['code'];
  label: string;
  items: BusinessQueryItem[];
};

const buildBusinessQueryData = (): BusinessQueryCategory[] => {
  const codeLabel: Record<ManagedBusiness['code'], string> = {
    LINE: '政企专线',
    '5G': '5G专网',
    IDC: 'IDC动环',
    SDWAN: '量子+SD-WAN',
    AIC: '智算中心',
  };
  return MANAGED_BUSINESSES.map((biz, idx) => {
    const count = 28 + idx * 9;
    const items: BusinessQueryItem[] = Array.from({ length: count }).map((_, i) => {
      const n = i + 1;
      const s = n % 11 === 0 ? 'danger' : n % 5 === 0 ? 'warning' : 'normal';
      return {
        id: `${biz.code}-${String(n).padStart(4, '0')}`,
        name: `${biz.name}-${n}`,
        site: `站点-${String((n % 16) + 1).padStart(2, '0')}`,
        region: `区域-${(n % 8) + 1}`,
        status: s,
        bandwidth: `${50 + (n % 10) * 10}Mbps`,
        updatedAt: `2026-04-${String((n % 27) + 1).padStart(2, '0')} 10:${String((n * 3) % 60).padStart(2, '0')}`,
        owner: `运维员${(n % 6) + 1}`,
      };
    });
    return { code: biz.code, label: codeLabel[biz.code], items };
  });
};

export const useAiDock = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 480, height: 720 });
  const [messages, setMessages] = useState<AiMessage[]>(welcomeMessages);
  const [isResponding, setIsResponding] = useState(false);
  const [tickets, setTickets] = useState<TicketItem[]>(TICKETS);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [activeReportId, setActiveReportId] = useState(REPORTS[0].id);
  const [ticketDraftFromDiagnosis, setTicketDraftFromDiagnosis] = useState<DiagnosisTemplate | null>(null);
  const processingRef = useRef(false);

  const activeReport = useMemo(
    () => REPORTS.find((r) => r.id === activeReportId) || REPORTS[0],
    [activeReportId]
  );

  const appendMessage = useCallback((msg: Omit<AiMessage, 'id' | 'createdAt'> & Partial<Pick<AiMessage, 'id' | 'createdAt'>>) => {
    const next: AiMessage = {
      id: msg.id || createId('msg'),
      createdAt: msg.createdAt || Date.now(),
      role: msg.role,
      kind: msg.kind,
      text: msg.text,
      data: msg.data,
    };
    setMessages((prev) => [...prev, next]);
    if (!open || minimized) setUnread((u) => u + 1);
    return next.id;
  }, [minimized, open]);

  const updateMessageData = useCallback((id: string, data: any) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, data: { ...m.data, ...data } } : m)));
  }, []);

  const updateMessageText = useCallback((id: string, text: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text } : m)));
  }, []);

  const streamAssistantText = useCallback(async (text: string) => {
    const messageId = appendMessage({
      role: 'assistant',
      kind: 'text',
      text: '',
    });
    let current = '';
    for (const ch of text) {
      current += ch;
      updateMessageText(messageId, current);
      const wait = /[，。！？；,.!?;]/.test(ch) ? 52 : 22;
      await delay(wait);
    }
  }, [appendMessage, updateMessageText]);

  const openWindow = useCallback(() => {
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
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages(welcomeMessages());
    setDrawer(null);
    setTickets(TICKETS);
    setIsResponding(false);
  }, []);

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
    const progressId = appendMessage({
      role: 'assistant',
      kind: 'diagnosisProgress',
      data: { title: template.title, progress: 0, step: DIAGNOSIS_STEPS[0], running: true },
    });

    for (let i = 0; i < DIAGNOSIS_STEPS.length; i += 1) {
      await delay(600);
      const progress = Math.round(((i + 1) / DIAGNOSIS_STEPS.length) * 100);
      updateMessageData(progressId, { progress, step: DIAGNOSIS_STEPS[i], running: progress < 100 });
    }

    await delay(350);
    appendMessage({ role: 'assistant', kind: 'diagnosisReport', data: template });
  }, [appendMessage, updateMessageData]);

  const runReportExport = useCallback(async (type: 'pdf' | 'image') => {
    const id = appendMessage({
      role: 'system',
      kind: 'systemNotice',
      data: { title: `正在生成${type === 'pdf' ? 'PDF' : '长图'}...`, progress: 30 },
    });
    await delay(450);
    updateMessageData(id, { progress: 60, title: `正在生成${type === 'pdf' ? 'PDF' : '长图'}...` });
    await delay(450);
    updateMessageData(id, { progress: 100, title: `已生成${type === 'pdf' ? 'PDF' : '长图'}，点击下载` });
  }, [appendMessage, updateMessageData]);

  const handleIntent = useCallback(async (inputRaw: string, intent?: IntentType) => {
    const input = inputRaw.toLowerCase();
    const resolvedIntent = intent || detectIntent(input);

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

    if (resolvedIntent === 'report') {
      appendMessage({ role: 'assistant', kind: 'reportCard', data: activeReport });
      return;
    }

    if (resolvedIntent === 'business') {
      const total = MANAGED_BUSINESSES.length;
      const online = MANAGED_BUSINESSES.filter((b) => b.status === 'normal').length;
      const warning = MANAGED_BUSINESSES.filter((b) => b.status === 'warning').length;
      const danger = MANAGED_BUSINESSES.filter((b) => b.status === 'danger').length;
      await streamAssistantText(`已为您载入业务清单：共 ${total} 类业务，正常 ${online}，关注 ${warning}，异常 ${danger}。`);
      appendMessage({
        role: 'assistant',
        kind: 'businessQuery',
        data: buildBusinessQueryData(),
      });
      return;
    }

    if (resolvedIntent === 'ticket') {
      appendMessage({ role: 'assistant', kind: 'ticketCard', data: tickets[0] || TICKETS[0] });
      return;
    }

    if (resolvedIntent === 'fault') {
      appendMessage({
        role: 'assistant',
        kind: 'faultForm',
        data: {
          defaultTitle: ticketDraftFromDiagnosis
            ? `${ticketDraftFromDiagnosis.name}异常报障`
            : '业务异常报障',
          defaultBusiness: ticketDraftFromDiagnosis?.name || '政企业务专网',
          fromDiagnosis: !!ticketDraftFromDiagnosis,
        },
      });
      return;
    }

    if (resolvedIntent === 'diagnosis') {
      const matched = pickDiagnosis(input);
      if (!matched) {
        appendMessage({ role: 'assistant', kind: 'diagnosisSelect', data: DIAGNOSIS_TEMPLATES });
      } else {
        await runDiagnosisFlow(matched);
      }
      return;
    }

    const faq = findFaq(input);
    if (faq) {
      pushQa(faq);
      if (faq.sourceId) {
        const knowledge = KNOWLEDGE_ITEMS.find((k) => k.id === faq.sourceId);
        if (knowledge) {
          appendMessage({ role: 'assistant', kind: 'knowledgeCard', data: knowledge });
        }
      }
      return;
    }

    if (resolvedIntent === 'knowledge') {
      const knowledge = matchKnowledge(input);
      appendMessage({ role: 'assistant', kind: 'knowledgeCard', data: knowledge });
      appendMessage({
        role: 'assistant',
        kind: 'qa',
        data: {
          conclusion: `已为您定位到知识条目：《${knowledge.title}》`,
          explanation: '您可以先看摘要，若需完整内容可打开右侧知识详情。',
          sourceId: knowledge.id,
          followups: ['给我看完整内容', '还有相关知识吗？', '能生成一份说明吗？'],
        } as QaPayload,
      });
      return;
    }

    if (resolvedIntent === 'qa') {
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
      return;
    }

    appendMessage({
      role: 'assistant',
      kind: 'fallback',
      data: {
        title: '暂时没找到准确答案',
        desc: '可以换个关键词，或直接联系客户经理协助处理。',
      },
    });
  }, [activeReport, appendMessage, pushQa, runDiagnosisFlow, streamAssistantText, ticketDraftFromDiagnosis, tickets]);

  const sendUserText = useCallback(async (text: string, forcedIntent?: IntentType) => {
    const trimmed = text.trim();
    if (!trimmed || processingRef.current) return;
    processingRef.current = true;
    setIsResponding(true);
    appendMessage({ role: 'user', kind: 'text', text: trimmed });
    await delay(280);
    await handleIntent(trimmed, forcedIntent);
    setIsResponding(false);
    processingRef.current = false;
  }, [appendMessage, handleIntent]);

  const handleQuickChip = useCallback(async (chip: QuickChip) => {
    await sendUserText(chip.prompt);
  }, [sendUserText]);

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

  const submitFaultTicket = useCallback(async (payload: { title: string; business: string; desc: string; severity: string }) => {
    const id = `TKT-${Date.now()}`;
    const ticket: TicketItem = {
      id,
      title: payload.title,
      business: payload.business,
      status: '待受理',
      owner: '自动分派中',
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      detail: payload.desc,
      timeline: [
        { time: '刚刚', text: '工单已提交，等待运维人员受理。' },
      ],
    };

    appendMessage({ role: 'assistant', kind: 'ticketCard', data: ticket });
    setTickets((prev) => [ticket, ...prev]);
    await delay(350);
    appendMessage({
      role: 'system',
      kind: 'systemNotice',
      data: { title: `工单 ${id} 状态更新：已自动分派到二线团队`, progress: 100 },
    });
    setTicketDraftFromDiagnosis(null);
  }, [appendMessage]);

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
    quickChips,
    handleQuickChip,
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
    setTicketDraftFromDiagnosis,
    submitFaultTicket,
    managedBusinesses: MANAGED_BUSINESSES,
  };
};

export type AiDockStore = ReturnType<typeof useAiDock>;
