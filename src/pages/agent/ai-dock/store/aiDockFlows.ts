import { DIAGNOSIS_STEPS, DiagnosisTemplate, TicketItem } from '../../../../mock/assistant';
import type { MutableRefObject } from 'react';
import { delay } from '../utils/delay';
import { buildBusinessDiagnosisReport } from './businessDiagnosis';
import type { BusinessDiagnosisTarget } from './aiDockTypes';

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

type MessageAppender = (msg: { role: 'assistant' | 'user' | 'system'; kind: string; text?: string; data?: any }) => string;
type MessageDataUpdater = (id: string, data: any) => void;

export const runDiagnosisFlow = async (args: {
  template: DiagnosisTemplate;
  stopRef: MutableRefObject<boolean>;
  appendMessage: MessageAppender;
  updateMessageData: MessageDataUpdater;
}) => {
  const { template, stopRef, appendMessage, updateMessageData } = args;
  let logs: FlowLogEntry[] = appendFlowLog([], `已启动「${template.name}」诊断任务`);

  await delay(380);
  if (stopRef.current) return;
  const progressId = appendMessage({
    role: 'assistant',
    kind: 'diagnosisProgress',
    data: {
      title: template.title,
      progress: 0,
      step: DIAGNOSIS_STEPS[0],
      running: true,
      status: 'running',
      logs,
    },
  });

  for (let i = 0; i < DIAGNOSIS_STEPS.length; i += 1) {
    if (stopRef.current) {
      logs = appendFlowLog(logs, '用户已停止本次诊断任务');
      updateMessageData(progressId, {
        running: false,
        status: 'stopped',
        step: '已停止',
        logs,
        progress: Math.max(0, DIAGNOSIS_STEPS.length ? Math.floor((i / DIAGNOSIS_STEPS.length) * 100) : 0),
      });
      return;
    }
    await delay(600);
    const progress = Math.round(((i + 1) / DIAGNOSIS_STEPS.length) * 100);
    logs = appendFlowLog(logs, `${DIAGNOSIS_STEPS[i]}完成`);
    updateMessageData(progressId, {
      progress,
      step: DIAGNOSIS_STEPS[i],
      running: progress < 100,
      status: progress < 100 ? 'running' : 'done',
      logs,
    });
  }

  await delay(350);
  if (stopRef.current) return;
  logs = appendFlowLog(logs, '诊断完成，已生成最终报告');
  updateMessageData(progressId, {
    running: false,
    status: 'done',
    step: '分析完成',
    progress: 100,
    logs,
  });
  appendMessage({ role: 'assistant', kind: 'diagnosisReport', data: template });
};

export const runBusinessDiagnosisFlow = async (args: {
  targets: BusinessDiagnosisTarget[];
  appendMessage: MessageAppender;
  updateMessageData: MessageDataUpdater;
}) => {
  const { targets, appendMessage, updateMessageData } = args;
  if (targets.length === 0) return;
  const selectedText = targets.length > 6
    ? `${targets.slice(0, 6).map((target) => target.item.name).join('、')} 等 ${targets.length} 条业务`
    : targets.map((target) => target.item.name).join('、');
  let logs: FlowLogEntry[] = appendFlowLog([], `已接收业务诊断任务：${selectedText}`);

  await delay(260);
  const progressId = appendMessage({
    role: 'assistant',
    kind: 'diagnosisProgress',
    data: {
      title: '业务诊断执行中',
      progress: 0,
      step: '准备采集所选业务指标',
      running: true,
      status: 'running',
      logs,
    },
  });

  const steps = [
    '采集业务运行指标',
    '关联站点、链路和资源信息',
    '计算健康评分与风险等级',
    '生成诊断摘要、详情和后续建议',
  ];
  for (let i = 0; i < steps.length; i += 1) {
    await delay(520);
    const progress = Math.round(((i + 1) / steps.length) * 100);
    logs = appendFlowLog(logs, `${steps[i]}完成`);
    updateMessageData(progressId, {
      progress,
      step: steps[i],
      running: progress < 100,
      status: progress < 100 ? 'running' : 'done',
      logs,
    });
  }

  await delay(320);
  const report = buildBusinessDiagnosisReport(targets);
  appendMessage({ role: 'assistant', kind: 'businessDiagnosisReport', data: report });
};

export const submitFaultTicketFlow = async (args: {
  payload: { title: string; business: string; businesses?: string[]; desc: string; severity: string };
  setIsResponding: (v: boolean) => void;
  appendMessage: MessageAppender;
  updateActiveSession: (updater: (session: any) => any) => void;
  createSystemNoticeFlow: (title: string, firstLog: string, progress?: number) => { id: string; logs: FlowLogEntry[] };
  advanceSystemNoticeFlow: (id: string, payload: { logs: FlowLogEntry[]; logText?: string; title?: string; progress: number; status?: FlowStatus }) => FlowLogEntry[];
}) => {
  const { payload, setIsResponding, appendMessage, updateActiveSession, createSystemNoticeFlow, advanceSystemNoticeFlow } = args;
  setIsResponding(true);
  const firstTimelineTime = new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const selectedBusinesses = Array.from(new Set((payload.businesses && payload.businesses.length > 0 ? payload.businesses : [payload.business]).filter(Boolean)));
  const baseTs = Date.now();
  const createdTickets: TicketItem[] = selectedBusinesses.map((business, index) => {
    const id = `TKT-${baseTs + index}`;
    return {
      id,
      title: selectedBusinesses.length > 1 ? `${payload.title}（${business}）` : payload.title,
      business,
      status: '待受理',
      owner: '正在分派',
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      detail: payload.desc,
      timeline: [
        { time: firstTimelineTime, text: '工单已提交，等待运维人员受理。' },
      ],
    };
  });

  await delay(420);
  appendMessage({ role: 'assistant', kind: 'ticketCard', data: createdTickets[0] });

  updateActiveSession((session) => ({
    ...session,
    updatedAt: Date.now(),
    tickets: [...createdTickets, ...session.tickets],
    ticketDraftFromDiagnosis: null,
    faultContext: null,
    faultContexts: [],
  }));

  const noticeTitle = selectedBusinesses.length > 1
    ? `批量工单受理进展（${createdTickets.length}条）`
    : `工单 ${createdTickets[0].id} 受理进展`;
  const firstId = createdTickets[0].id;
  const { id: noticeId, logs: initialLogs } = createSystemNoticeFlow(noticeTitle, `工单 ${firstId} 已创建，正在分派处理人员`, 25);
  let logs = initialLogs;
  await delay(360);
  logs = advanceSystemNoticeFlow(noticeId, {
    logs,
    logText: selectedBusinesses.length > 1 ? '批量工单已分派到处理团队' : '工单已分派到处理团队',
    progress: 60,
    title: noticeTitle,
  });
  await delay(420);
  logs = advanceSystemNoticeFlow(noticeId, {
    logs,
    logText: selectedBusinesses.length > 1 ? '责任人已批量确认受理，进入处理中' : '责任人已确认受理，进入处理中',
    progress: 85,
    title: noticeTitle,
  });
  await delay(360);
  advanceSystemNoticeFlow(noticeId, {
    logs,
    logText: '状态已更新为处理中，可在工单详情追踪进展',
    progress: 100,
    status: 'done',
    title: selectedBusinesses.length > 1 ? '批量工单已进入处理中' : `工单 ${firstId} 已进入处理中`,
  });
  setIsResponding(false);
  return {
    firstTicketId: createdTickets[0]?.id || '',
    ticketCount: createdTickets.length,
    ticketIds: createdTickets.map((item) => item.id),
    owner: createdTickets[0]?.owner || '正在分派',
  };
};
