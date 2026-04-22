import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { BizCard, BizType, CustomerProfile, DiagnosisReport } from '../types/business';
import { MessageItem } from '../types/message';
import { TicketItem, TicketStatus } from '../types/ticket';
import { BUSINESS_CARDS_ALERT, BUSINESS_CARDS_NORMAL, CUSTOMERS } from '../mock/chat';
import { INITIAL_TICKETS } from '../mock/tickets';
import { DIAGNOSIS_TEMPLATE } from '../mock/chat';

export type TabKey = 'chat' | 'overview' | 'diagnosis' | 'report' | 'knowledge' | 'ticket';
export type HealthMode = 'normal' | 'warning' | 'fault';
export type ModelMode = 'normal' | 'degraded' | 'faq';

interface AIDockState {
  open: boolean;
  maximized: boolean;
  activeTab: TabKey;
  unread: number;
  healthMode: HealthMode;
  customer: CustomerProfile;
  cards: BizCard[];
  overviewFocusBiz: BizType | null;
  messages: MessageItem[];
  sessions: { id: string; title: string; updatedAt: string; messages: MessageItem[] }[];
  activeSessionId: string;
  tickets: TicketItem[];
  diagnosisHistory: DiagnosisReport[];
  modelMode: ModelMode;
}

type AIDockAction =
  | { type: 'setOpen'; payload: boolean }
  | { type: 'toggleMax' }
  | { type: 'switchTab'; payload: TabKey }
  | { type: 'appendMessage'; payload: MessageItem }
  | { type: 'setHealth'; payload: HealthMode }
  | { type: 'setModelMode'; payload: ModelMode }
  | { type: 'setOverviewFocusBiz'; payload: BizType | null }
  | { type: 'setCustomer'; payload: string }
  | { type: 'createSession' }
  | { type: 'switchSession'; payload: string }
  | { type: 'triggerFault' }
  | { type: 'addDiagnosis'; payload: DiagnosisReport }
  | { type: 'createTicket'; payload: TicketItem }
  | { type: 'advanceTicket'; payload: string }
  | { type: 'resetDemo' };

const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

const createInitialMessages = (customerName: string): MessageItem[] => [
  {
    id: 'm-welcome',
    role: 'assistant',
    time: now(),
    type: 'TextMessage',
    payload: {
      title: `您好，${customerName}`,
      text: '欢迎使用政企业务智慧运维管家。当前业务整体运行稳定。'
    }
  },
  {
    id: 'm-actions',
    role: 'assistant',
    time: now(),
    type: 'ActionButtonsMessage',
    actions: [
      { id: 'ask-overview', label: '给我看看所有业务状态', kind: 'primary' },
      { id: 'ask-month', label: '这个月业务怎么样', kind: 'secondary' },
      { id: 'ask-quantum', label: '量子加密保护是什么', kind: 'secondary' }
    ]
  }
];

const createInitialSessions = (customerName: string) => [
  {
    id: 's1',
    title: '默认会话',
    updatedAt: now(),
    messages: createInitialMessages(customerName)
  }
];

const initialState: AIDockState = {
  open: false,
  maximized: false,
  activeTab: 'chat',
  unread: 0,
  healthMode: 'normal',
  customer: CUSTOMERS[0],
  cards: BUSINESS_CARDS_NORMAL,
  overviewFocusBiz: null,
  messages: createInitialMessages(CUSTOMERS[0].name),
  sessions: createInitialSessions(CUSTOMERS[0].name),
  activeSessionId: 's1',
  tickets: INITIAL_TICKETS,
  diagnosisHistory: [],
  modelMode: 'normal'
};

const nextTicketStatus: Record<TicketStatus, TicketStatus> = {
  accepted: 'dispatching',
  dispatching: 'processing',
  processing: 'restored',
  restored: 'followup',
  followup: 'accepted'
};

function reducer(state: AIDockState, action: AIDockAction): AIDockState {
  switch (action.type) {
    case 'setOpen':
      return {
        ...state,
        open: action.payload,
        unread: action.payload ? 0 : state.unread
      };
    case 'toggleMax':
      return { ...state, maximized: !state.maximized };
    case 'switchTab':
      return { ...state, activeTab: action.payload };
    case 'appendMessage': {
      const unread = state.open ? state.unread : state.unread + 1;
      const nextMessages = [...state.messages, action.payload];
      const nextTitle =
        action.payload.role === 'user' && typeof action.payload.payload?.text === 'string'
          ? String(action.payload.payload.text).slice(0, 12)
          : null;
      return {
        ...state,
        messages: nextMessages,
        sessions: state.sessions.map((session) =>
          session.id === state.activeSessionId
            ? {
                ...session,
                title: nextTitle || session.title,
                updatedAt: now(),
                messages: nextMessages
              }
            : session
        ),
        unread
      };
    }
    case 'setHealth': {
      const cards = action.payload === 'normal' ? BUSINESS_CARDS_NORMAL : BUSINESS_CARDS_ALERT;
      return { ...state, healthMode: action.payload, cards };
    }
    case 'setModelMode':
      return { ...state, modelMode: action.payload };
    case 'setOverviewFocusBiz':
      return { ...state, overviewFocusBiz: action.payload };
    case 'setCustomer': {
      const customer = CUSTOMERS.find((x) => x.id === action.payload) || state.customer;
      const sessions = createInitialSessions(customer.name);
      return {
        ...state,
        customer,
        messages: sessions[0].messages,
        sessions,
        activeSessionId: sessions[0].id,
        overviewFocusBiz: null,
        unread: 0,
        diagnosisHistory: [],
        tickets: INITIAL_TICKETS
      };
    }
    case 'createSession': {
      const id = `s${Date.now()}`;
      const messages = createInitialMessages(state.customer.name);
      const next = {
        id,
        title: `新会话 ${state.sessions.length + 1}`,
        updatedAt: now(),
        messages
      };
      return {
        ...state,
        activeSessionId: id,
        messages,
        sessions: [next, ...state.sessions]
      };
    }
    case 'switchSession': {
      const session = state.sessions.find((x) => x.id === action.payload);
      if (!session) return state;
      return {
        ...state,
        activeSessionId: session.id,
        messages: session.messages
      };
    }
    case 'triggerFault': {
      return {
        ...state,
        healthMode: 'fault',
        cards: BUSINESS_CARDS_ALERT,
        messages: [
          ...state.messages,
          {
            id: `fault-${Date.now()}`,
            role: 'assistant',
            time: now(),
            type: 'TextMessage',
            payload: {
              title: '专线告警通知',
              text: '合肥总部到阜阳专线 3 分钟前出现告警，建议立即体检。'
            }
          },
          {
            id: `fault-action-${Date.now()}`,
            role: 'assistant',
            time: now(),
            type: 'ActionButtonsMessage',
            actions: [
              { id: 'quick-diagnosis', label: '立即体检', kind: 'primary' },
              { id: 'open-ticket-tab', label: '查看工单进度', kind: 'secondary' }
            ]
          }
        ],
        unread: state.open ? state.unread : state.unread + 1
      };
    }
    case 'addDiagnosis':
      return { ...state, diagnosisHistory: [action.payload, ...state.diagnosisHistory] };
    case 'createTicket':
      return { ...state, tickets: [action.payload, ...state.tickets] };
    case 'advanceTicket': {
      const ticket = state.tickets.find((t) => t.id === action.payload);
      if (!ticket) return state;
      const next = nextTicketStatus[ticket.status];
      const nextPayload = {
        ticketId: ticket.id,
        title: `${ticket.title} 已更新`,
        status: next,
        owner: ticket.owner,
        eta: ticket.eta
      };
      let foundTicketCard = false;
      const nextMessages = state.messages.map((message) => {
        if (
          message.type === 'TicketCardMessage' &&
          message.payload &&
          String(message.payload.ticketId || '') === ticket.id
        ) {
          foundTicketCard = true;
          return {
            ...message,
            time: now(),
            payload: nextPayload
          };
        }
        return message;
      });
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload ? { ...t, status: next, updatedAt: now() } : t
        ),
        messages: foundTicketCard
          ? nextMessages
          : [
              ...nextMessages,
              {
                id: `ticket-progress-${Date.now()}`,
                role: 'assistant',
                time: now(),
                type: 'TicketCardMessage',
                payload: nextPayload
              }
            ],
        unread: state.open ? state.unread : state.unread + 1
      };
    }
    case 'resetDemo':
      const resetSessions = createInitialSessions(state.customer.name);
      return {
        ...initialState,
        messages: resetSessions[0].messages,
        sessions: resetSessions,
        activeSessionId: resetSessions[0].id,
        overviewFocusBiz: null,
        customer: state.customer
      };
    default:
      return state;
  }
}

interface AIDockContextValue {
  state: AIDockState;
  setOpen: (open: boolean) => void;
  toggleMax: () => void;
  switchTab: (tab: TabKey) => void;
  appendMessage: (item: MessageItem) => void;
  setHealth: (mode: HealthMode) => void;
  setCustomer: (id: string) => void;
  setModelMode: (mode: ModelMode) => void;
  setOverviewFocusBiz: (biz: BizType | null) => void;
  createSession: () => void;
  switchSession: (id: string) => void;
  triggerFault: () => void;
  runDiagnosis: () => DiagnosisReport;
  createTicket: (note?: string) => TicketItem;
  advanceTicket: (id: string) => void;
  resetDemo: () => void;
}

const AIDockContext = createContext<AIDockContextValue | null>(null);

export const AIDockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<AIDockContextValue>(() => ({
    state,
    setOpen: (open) => dispatch({ type: 'setOpen', payload: open }),
    toggleMax: () => dispatch({ type: 'toggleMax' }),
    switchTab: (tab) => dispatch({ type: 'switchTab', payload: tab }),
    appendMessage: (item) => dispatch({ type: 'appendMessage', payload: item }),
    setHealth: (mode) => dispatch({ type: 'setHealth', payload: mode }),
    setCustomer: (id) => dispatch({ type: 'setCustomer', payload: id }),
    setModelMode: (mode) => dispatch({ type: 'setModelMode', payload: mode }),
    setOverviewFocusBiz: (biz) => dispatch({ type: 'setOverviewFocusBiz', payload: biz }),
    createSession: () => dispatch({ type: 'createSession' }),
    switchSession: (id) => dispatch({ type: 'switchSession', payload: id }),
    triggerFault: () => dispatch({ type: 'triggerFault' }),
    runDiagnosis: () => {
      const report: DiagnosisReport = {
        id: `diag-${Date.now()}`,
        summary: DIAGNOSIS_TEMPLATE.summary,
        impact: DIAGNOSIS_TEMPLATE.impact,
        reasons: DIAGNOSIS_TEMPLATE.reasons,
        status: 'fault'
      };
      dispatch({ type: 'addDiagnosis', payload: report });
      dispatch({
        type: 'appendMessage',
        payload: {
          id: `diag-msg-${Date.now()}`,
          role: 'assistant',
          time: now(),
          type: 'DiagnosisCardMessage',
          payload: report,
          actions: [
            { id: 'diag-create-ticket', label: '一键报障', kind: 'primary' },
            { id: 'diag-history', label: '查看历史类似故障', kind: 'secondary' }
          ]
        }
      });
      return report;
    },
    createTicket: (note) => {
      const ticket: TicketItem = {
        id: `TK${String(Date.now()).slice(-8)}`,
        bizName: '专线',
        title: '合肥总部到阜阳专线中断',
        status: 'accepted',
        owner: '省网调度班',
        eta: '预计 30 分钟',
        updatedAt: now()
      };
      dispatch({ type: 'createTicket', payload: ticket });
      dispatch({
        type: 'appendMessage',
        payload: {
          id: `ticket-created-${Date.now()}`,
          role: 'assistant',
          time: now(),
          type: 'TextMessage',
          payload: {
            title: '工单已创建',
            text: note ? `已提交备注：${note}` : '已自动关联诊断结果并创建工单。'
          }
        }
      });
      dispatch({
        type: 'appendMessage',
        payload: {
          id: `ticket-created-card-${Date.now()}`,
          role: 'assistant',
          time: now(),
          type: 'TicketCardMessage',
          payload: {
            ticketId: ticket.id,
            title: ticket.title,
            status: ticket.status,
            owner: ticket.owner,
            eta: ticket.eta
          }
        }
      });
      return ticket;
    },
    advanceTicket: (id) => dispatch({ type: 'advanceTicket', payload: id }),
    resetDemo: () => dispatch({ type: 'resetDemo' })
  }), [state]);

  return <AIDockContext.Provider value={value}>{children}</AIDockContext.Provider>;
};

export const useAIDock = (): AIDockContextValue => {
  const ctx = useContext(AIDockContext);
  if (!ctx) throw new Error('useAIDock must be used inside AIDockProvider');
  return ctx;
};
