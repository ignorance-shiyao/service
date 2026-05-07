import React, { useState } from 'react';
import { AiMessage, AiDockStore } from '../store/useAiDock';
import { MessageBubble } from './MessageBubble';
import { KnowledgeCard } from './cards/KnowledgeCard';
import { QaMessage } from './cards/QaMessage';
import { ReportCard } from './cards/ReportCard';
import { BusinessQueryCard } from './cards/BusinessQueryCard';
import { DiagnosisSelectCard } from './cards/DiagnosisSelectCard';
import { DiagnosisProgress } from './cards/DiagnosisProgress';
import { DiagnosisReportCard } from './cards/DiagnosisReportCard';
import { BusinessDiagnosisSelectCard } from './cards/BusinessDiagnosisSelectCard';
import { BusinessDiagnosisReportCard } from './cards/BusinessDiagnosisReportCard';
import { FaultFormCard } from './cards/FaultFormCard';
import { TicketCard } from './cards/TicketCard';
import { ProgressiveCardShell } from './cards/ProgressiveCardShell';
import { CardActionBar } from './cards/CardActionBar';
import { ReceiptCard } from './cards/ReceiptCard';

interface MessageListProps {
  messages: AiMessage[];
  store: AiDockStore;
}

const TicketListCard: React.FC<{
  data: {
    title?: string;
    slaText?: string;
    tickets: Array<any>;
  };
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}> = ({ data, onCopy, onAsk }) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(data.tickets[0]?.id ? [data.tickets[0].id] : []);
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  if (!data.tickets.length) return null;
  return (
    <div className="rounded-xl border border-[#3f77ab] bg-[linear-gradient(180deg,#123a66_0%,#11345f_100%)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.28)]">
      <div className="text-sm font-semibold text-[#eef6ff]">{data.title || '工单进度'}</div>
      <div className="mt-2 space-y-1">
        {data.tickets.map((ticket) => {
          const expanded = expandedIds.includes(ticket.id);
          return (
            <div key={ticket.id} className={`rounded border ${
              expanded ? 'border-[#6cb5f0] bg-[rgba(24,84,136,0.6)]' : 'border-[#2f6698] bg-[#123b66]'
            }`}>
              <button
                type="button"
                onClick={() => toggleExpand(ticket.id)}
                className="w-full px-2 py-1 text-left text-[12px] text-[#e5f3ff]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{ticket.id}</span>
                  <span className="text-[11px]">{ticket.status}</span>
                </div>
                <div className="mt-0.5 truncate">{ticket.title}</div>
              </button>
              {expanded && (
                <div className="border-t border-[rgba(115,186,245,0.28)] px-2 py-1.5 text-[12px] text-[#d6ecff]">
                  <div>业务：{ticket.business}</div>
                  <div className="mt-0.5">处理人：{ticket.owner}</div>
                  <div className="mt-0.5">{ticket.detail}</div>
                  {Array.isArray(ticket.timeline) && ticket.timeline.length > 0 && (
                    <div className="mt-1 text-[#b8daf4]">
                      最新进展：{ticket.timeline[ticket.timeline.length - 1].time} {ticket.timeline[ticket.timeline.length - 1].text}
                    </div>
                  )}
                  <div className="mt-2">
                    <CardActionBar
                      actions={[
                        {
                          key: `urge_${ticket.id}`,
                          label: '立即催办',
                          tone: 'primary',
                          onClick: () => onAsk?.(`催办工单 ${ticket.id}`),
                        },
                        {
                          key: `copy_${ticket.id}`,
                          label: '复制工单',
                          onClick: () => onCopy?.(`${ticket.id}\n${ticket.title}\n状态：${ticket.status}`),
                        },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[11px] text-[#a9d0ef]">{data.slaText}</div>
      <CardActionBar
        actions={[
          {
            key: 'urge_first',
            label: '立即催办',
            tone: 'primary',
            onClick: () => onAsk?.(`催办工单 ${data.tickets[0].id}`),
          },
          {
            key: 'copy_first',
            label: '复制首条工单',
            onClick: () => onCopy?.(`${data.tickets[0].id}\n${data.tickets[0].title}\n状态：${data.tickets[0].status}`),
          },
        ]}
      />
    </div>
  );
};

type FaultFlowStep = 'submitted' | 'assigned' | 'processing' | 'pending_confirm' | 'archived';

const isFaultResultMessage = (message: AiMessage) =>
  message.kind === 'systemNotice' || message.kind === 'receiptCard' || message.kind === 'ticketCard';

const FaultResultMergedCard: React.FC<{
  items: AiMessage[];
  store: AiDockStore;
  onCopy: (text: string) => void;
  faultFormData?: {
    defaultTitle?: string;
    defaultBusiness?: string;
    defaultSeverity?: string;
    defaultDesc?: string;
  };
}> = ({ items, store, onCopy, faultFormData }) => {
  const progressItems = items.filter((item) => item.kind === 'systemNotice' && !item.text);
  const receiptItems = items.filter((item) => item.kind === 'receiptCard');
  const ticketItems = items.filter((item) => item.kind === 'ticketCard');

  const activeProgress = progressItems[progressItems.length - 1];
  const activeReceipt = receiptItems[receiptItems.length - 1];
  const activeTicket = ticketItems[ticketItems.length - 1];
  const receiptFields: Array<{ label: string; value: string }> = Array.isArray(activeReceipt?.data?.fields) ? activeReceipt.data.fields : [];
  const flowLogLines: Array<{ time?: string; text: string }> = [
    ...(Array.isArray(activeProgress?.data?.logs) ? activeProgress.data.logs : []),
    ...receiptFields.map((field) => ({ text: `${field.label}：${field.value}` })),
    ...(Array.isArray(activeTicket?.data?.timeline)
      ? activeTicket.data.timeline.map((line: { time: string; text: string }) => ({ time: line.time, text: line.text }))
      : []),
  ];
  const fullFlowText = flowLogLines.map((line) => `${line.time ? `${line.time} ` : ''}${line.text}`).join('\n');

  const getCurrentFlowStep = (): FaultFlowStep => {
    const statusText = `${activeTicket?.data?.status || ''}\n${activeProgress?.data?.title || ''}\n${fullFlowText}`;
    if (statusText.includes('已归档') || statusText.includes('归档') || statusText.includes('已完成')) return 'archived';
    if (statusText.includes('待客户确认') || statusText.includes('待确认')) return 'pending_confirm';
    if (statusText.includes('处理中') || statusText.includes('受理')) return 'processing';
    if (statusText.includes('分派')) return 'assigned';
    return 'submitted';
  };

  const flowStepDefs: Array<{ key: FaultFlowStep; label: string; hint: string }> = [
    { key: 'submitted', label: '已提交', hint: '报障已受理，工单已创建入队' },
    { key: 'assigned', label: '已分派', hint: '已分派责任班组，明确处理窗口' },
    { key: 'processing', label: '处理中', hint: '执行排查修复并持续回传进展' },
    { key: 'pending_confirm', label: '待确认', hint: '客户确认后将自动归档' },
    { key: 'archived', label: '已归档', hint: '工单闭环完成，已归档备查' },
  ];
  const currentFlowStep = getCurrentFlowStep();
  const autoFlowIndex = flowStepDefs.findIndex((s) => s.key === currentFlowStep);
  const [manualFlowIndex, setManualFlowIndex] = useState<number | null>(null);
  const currentFlowIndex = manualFlowIndex ?? Math.max(0, autoFlowIndex);
  const activeFlow = flowStepDefs[currentFlowIndex] || flowStepDefs[0];

  const receiptResult = receiptFields.find((field) => field.label.includes('当前跟进') || field.label.includes('处理结果'))?.value;
  const receiptHandler = receiptFields.find((field) => field.label.includes('当前跟进') || field.label.includes('处理人'))?.value;
  const simulatedHandlers = ['王工', '李工', '赵工', '陈工', '周工', '许工'];
  const fallbackSeed = `${activeTicket?.data?.id || ''}${faultFormData?.defaultTitle || ''}`;
  const fallbackHandler = simulatedHandlers[fallbackSeed.length % simulatedHandlers.length];
  const displayHandler = (() => {
    const owner = activeTicket?.data?.owner || '';
    if (owner && owner !== '正在分派') return owner;
    if (receiptHandler && !receiptHandler.includes('已催办')) return receiptHandler;
    return fallbackHandler;
  })();
  const reportedFaultText = activeTicket
    ? `${activeTicket.data.title}（${activeTicket.data.business}）`
    : faultFormData?.defaultTitle
      ? `${faultFormData.defaultTitle}${faultFormData.defaultBusiness ? `（${faultFormData.defaultBusiness}）` : ''}`
      : receiptFields.find((field) => field.label.includes('工单号'))?.value || '已提交报障';

  const stageFlowTime = flowLogLines.length > 0
    ? (flowLogLines[flowLogLines.length - 1].time || '--:--')
    : (activeTicket?.data?.updatedAt || '--:--');
  const stageDescLines: string[] = (() => {
    if (activeFlow.key === 'submitted') {
      return ['报障已提交并成功生成工单。', '系统已进入受理排队，等待班组接单。', `处理人：${displayHandler}`];
    }
    if (activeFlow.key === 'assigned') {
      return ['工单已分派到责任班组。', '责任人正在确认接单与处理窗口。', `处理人：${displayHandler}`];
    }
    if (activeFlow.key === 'processing') {
      return ['责任班组正在执行排查与修复。', '如有新现象可补充说明，便于加快定位。', `处理人：${displayHandler}`];
    }
    if (activeFlow.key === 'pending_confirm') {
      return ['处理已完成，等待客户确认结果。', '确认通过后将自动进入归档。', `处理人：${displayHandler}`];
    }
    return ['工单已闭环归档。', '后续可在历史记录中查看本次处理结果。', `处理人：${displayHandler}`];
  })();
  const flowStatusByIndex: Array<'待受理' | '处理中' | '待客户确认' | '已完成'> = ['待受理', '处理中', '处理中', '待客户确认', '已完成'];
  const detailTicket = activeTicket
    ? {
        ...activeTicket.data,
        owner: displayHandler === '待分派' ? activeTicket.data.owner : displayHandler,
        status: flowStatusByIndex[currentFlowIndex] || activeTicket.data.status,
      }
    : null;

  return (
    <div className="rounded-xl border border-[#3f7db6] bg-[linear-gradient(135deg,rgba(20,76,133,0.9)_0%,rgba(15,57,101,0.92)_58%,rgba(18,78,99,0.9)_100%)] px-3 py-2 text-xs text-[#d8edff] shadow-[0_8px_16px_rgba(8,37,75,0.3)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex items-center rounded-full border border-[rgba(147,214,255,0.45)] bg-[rgba(26,109,156,0.38)] px-1.5 py-0.5 text-[10px] text-[#bfe7ff]">
          报障处理结果
        </div>
      </div>
      <div className="mb-2 rounded border border-[rgba(111,177,230,0.35)] bg-[rgba(10,43,78,0.52)] px-2 py-1.5">
        {activeTicket?.data?.id && <div className="text-[11px] text-[#d7ecff]">工单号：{activeTicket.data.id}</div>}
        <div className="text-[11px] text-[#d7ecff]">故障内容：{reportedFaultText}</div>
        {faultFormData?.defaultDesc && (
          <div className="mt-1 text-[11px] text-[#c3e3ff]">故障描述：{faultFormData.defaultDesc}</div>
        )}
        {faultFormData?.defaultSeverity && (
          <div className="mt-1 text-[11px] text-[#c3e3ff]">故障等级：{faultFormData.defaultSeverity}</div>
        )}
      </div>

      <div className="rounded border border-[rgba(111,177,230,0.35)] bg-[rgba(10,43,78,0.52)] px-2 py-1.5">
        <div className="text-[11px] font-semibold text-[#dff2ff]">流程流转</div>
        <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
          {flowStepDefs.map((step, idx) => {
            const archiveReached = currentFlowIndex >= flowStepDefs.length - 1;
            const isDone = archiveReached ? idx <= currentFlowIndex : idx < currentFlowIndex;
            const isCurrent = archiveReached ? false : idx === currentFlowIndex;
            return (
              <React.Fragment key={step.key}>
                <button
                  type="button"
                  onClick={() => {
                    setManualFlowIndex(idx);
                  }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                    isCurrent
                      ? 'border-[#67b8ff] bg-[rgba(31,98,163,0.48)] text-[#e5f3ff]'
                      : isDone
                        ? 'border-[#6fca9d] bg-[rgba(32,112,78,0.45)] text-[#ddfff0]'
                        : 'border-[#5f7c98] bg-[rgba(38,58,82,0.42)] text-[#a9bdd1]'
                  }`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      isCurrent ? 'bg-[#69bfff]' : isDone ? 'bg-[#6fca9d]' : 'bg-[#7f93a8]'
                    }`}
                  />
                  {step.label}
                </button>
                {idx < flowStepDefs.length - 1 && (
                  <span className={`h-px w-5 ${idx < currentFlowIndex ? 'bg-[#6fca9d]' : 'bg-[#5f7c98]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-2 rounded border border-[#3a6d9d] bg-[#0f3156] px-2 py-1.5 text-[11px] text-[#cfe7ff]">
          <div className="text-[#b8daf4]">环节流转时间：{stageFlowTime}</div>
          <div className="mt-2 space-y-1 text-[#b8daf4]">
            {stageDescLines.map((line, idx) => (
              <div key={`${line}_${idx}`}>{line}</div>
            ))}
          </div>
        </div>
      </div>

      <CardActionBar
        actions={[
          {
            key: 'open',
            label: '查看工单详情',
            tone: 'primary',
            onClick: () => detailTicket && store.openTicketDetail(detailTicket.id, detailTicket),
          },
          {
            key: 'urge',
            label: '催办建议',
            onClick: () => activeTicket && store.sendUserText(`催办工单 ${activeTicket.data.id}`),
          },
          {
            key: 'copy',
            label: '复制明细',
            onClick: () =>
              onCopy(
                [
                  activeTicket?.data?.id ? `工单号：${activeTicket.data.id}` : '',
                  `故障：${reportedFaultText}`,
                  faultFormData?.defaultDesc ? `描述：${faultFormData.defaultDesc}` : '',
                  activeTicket?.data?.owner ? `责任人：${activeTicket.data.owner}` : '',
                  `当前环节：${activeFlow.label}`,
                ].filter(Boolean).join('\n')
              ),
          },
        ]}
      />
    </div>
  );
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dayLabel = (ts: number) => {
  const current = new Date(ts);
  const now = new Date();
  if (isSameDay(current, now)) return '今天';

  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (isSameDay(current, y)) return '昨天';

  return `${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
};

const shouldShowDaySeparator = (current: AiMessage, prev?: AiMessage) => {
  if (!prev) return true;
  return !isSameDay(new Date(current.createdAt), new Date(prev.createdAt));
};

const shouldShowTime = (current: AiMessage, prev?: AiMessage) => {
  if (!prev) return true;
  return current.createdAt - prev.createdAt > 5 * 60 * 1000;
};

export const MessageList: React.FC<MessageListProps> = ({ messages, store }) => {
  const copyMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_error) {
      // ignore clipboard permission errors
    }
  };

  const wrapCard = (message: AiMessage, node: React.ReactNode) => (
    <ProgressiveCardShell message={message}>
      {node}
    </ProgressiveCardShell>
  );

  const shouldRenderInstant = (message: AiMessage) => Date.now() - message.createdAt > 8_000;
  const hasFollowingDiagnosisReport = (index: number, title: string) =>
    messages.slice(index + 1).some((item) => item.kind === 'diagnosisReport' && item.data.title === title);
  const lastFaultAnchorIndex = messages.reduce((acc, item, idx) => (item.kind === 'faultForm' ? idx : acc), -1);
  const faultFormMessage = lastFaultAnchorIndex >= 0 ? messages[lastFaultAnchorIndex] : undefined;
  const faultResultIndexes =
    lastFaultAnchorIndex >= 0
      ? messages
          .map((item, idx) => ({ item, idx }))
          .filter(({ item, idx }) => idx > lastFaultAnchorIndex && isFaultResultMessage(item))
          .map(({ idx }) => idx)
      : [];
  const shouldMergeFaultResult = faultResultIndexes.length > 0;
  const mergedFaultResultLastIndex = shouldMergeFaultResult ? faultResultIndexes[faultResultIndexes.length - 1] : -1;
  const mergedFaultItems = shouldMergeFaultResult ? faultResultIndexes.map((idx) => messages[idx]) : [];

  return (
    <div className="space-y-2 px-3 py-3">
      {messages.map((message, index) => {
        const prev = messages[index - 1];
        const isFaultMergedIndex = shouldMergeFaultResult && faultResultIndexes.includes(index);
        const shouldRenderMergedFaultCard = isFaultMergedIndex && index === mergedFaultResultLastIndex;
        const shouldSkipFaultOriginalCard = isFaultMergedIndex && !shouldRenderMergedFaultCard;
        return (
          <div key={message.id} className="ai-dock-msg-enter">
            {shouldShowDaySeparator(message, prev) && (
              <div className="my-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-[rgba(123,188,242,0.25)]" />
                <div className="rounded-full border border-[rgba(90,167,230,0.55)] bg-[rgba(17,65,111,0.72)] px-2 py-0.5 text-[10px] text-[#a9d3f6]">
                  {dayLabel(message.createdAt)}
                </div>
                <div className="h-px flex-1 bg-[rgba(123,188,242,0.25)]" />
              </div>
            )}
            {shouldShowTime(message, prev) && (
              <div className="mb-1 text-center text-[10px] text-[var(--sys-text-disabled)]">{formatTime(message.createdAt)}</div>
            )}

            {shouldRenderMergedFaultCard &&
              wrapCard(
                message,
                <FaultResultMergedCard
                  items={mergedFaultItems}
                  store={store}
                  onCopy={copyMessage}
                  faultFormData={faultFormMessage?.data}
                />
              )}

            {(message.kind === 'text' || message.kind === 'systemNotice') && message.text && (
              <MessageBubble
                message={message}
                onCopy={copyMessage}
                onRetry={message.role === 'assistant' ? store.retryLastQuestion : undefined}
              />
            )}

            {message.kind === 'knowledgeCard' && (
              wrapCard(
                message,
                <KnowledgeCard
                  item={message.data}
                  onOpen={store.openKnowledgeDrawer}
                  onCopy={copyMessage}
                  onAsk={store.sendUserText}
                />
              )
            )}

            {message.kind === 'qa' && (
              wrapCard(
                message,
                <QaMessage
                  data={message.data}
                  onSendFollowup={store.sendUserText}
                  onOpenKnowledge={store.openKnowledgeDrawer}
                  onCopy={copyMessage}
                />
              )
            )}

            {message.kind === 'reportCard' && (
              wrapCard(
                message,
                <ReportCard
                  report={message.data}
                  businesses={store.managedBusinesses}
                  onOpenHistory={store.openReportHistory}
                  onExport={store.runReportExport}
                  onCopy={copyMessage}
                  onAsk={store.sendUserText}
                />
              )
            )}

            {message.kind === 'businessQuery' && (
              wrapCard(
                message,
                <BusinessQueryCard
                  categories={message.data}
                  onCopy={copyMessage}
                  onAsk={store.sendUserText}
                  renderInstant={shouldRenderInstant(message)}
                />
              )
            )}

            {message.kind === 'diagnosisSelect' && (
              wrapCard(
                message,
                <DiagnosisSelectCard
                  list={message.data}
                  onSelect={(item) => store.runDiagnosisFlow(item)}
                  onAsk={store.sendUserText}
                  onCopy={copyMessage}
                />
              )
            )}

            {message.kind === 'diagnosisProgress' && (
              !hasFollowingDiagnosisReport(index, message.data.title) && (
                <DiagnosisProgress
                  title={message.data.title}
                  progress={message.data.progress}
                  step={message.data.step}
                  running={message.data.running}
                  status={message.data.status}
                  logs={message.data.logs}
                  onCopy={copyMessage}
                  onAsk={store.sendUserText}
                />
              )
            )}

            {message.kind === 'diagnosisReport' && (
              wrapCard(
                message,
                <DiagnosisReportCard
                  data={message.data}
                  onHistory={store.openDiagnosisHistory}
                  onCopy={copyMessage}
                  onAsk={store.sendUserText}
                  onFault={(data) => {
                    store.setTicketDraftFromDiagnosis(data);
                    store.setFaultContext({
                      source: 'diagnosis',
                      title: `${data.name}异常报障`,
                      business: data.name,
                      businessType: data.name,
                      severity: data.score < 82 ? '高' : '中',
                      desc: `故障业务：${data.name}\n诊断标题：${data.title}\n诊断结论：${data.conclusion}\n关键发现：${data.findings.join('；')}\n建议：${data.suggestions.join('；')}`,
                    });
                    store.sendUserText('我要发起报障', 'fault');
                  }}
                />
              )
            )}

            {message.kind === 'businessDiagnosisSelect' && (
              wrapCard(
                message,
                <BusinessDiagnosisSelectCard
                  categories={message.data}
                  onSubmit={store.runBusinessDiagnosisFlow}
                  onCopy={copyMessage}
                  onAsk={store.sendUserText}
                />
              )
            )}

            {message.kind === 'businessDiagnosisReport' && (
              wrapCard(
                message,
                <BusinessDiagnosisReportCard
                  data={message.data}
                  onCopy={copyMessage}
                  onGenerateBrief={store.generateBusinessDiagnosisBrief}
                  onFaultMany={(contexts) => {
                    if (!contexts.length) return;
                    store.setFaultContexts(contexts);
                    store.setFaultContext(contexts[0]);
                    store.sendUserText(`为 ${contexts.length} 条业务发起报障`, 'fault');
                  }}
                />
              )
            )}

            {message.kind === 'faultForm' && (
              wrapCard(
                message,
                <FaultFormCard
                  defaultTitle={message.data.defaultTitle}
                  defaultBusiness={message.data.defaultBusiness}
                  defaultBusinesses={message.data.defaultBusinesses}
                  defaultDesc={message.data.defaultDesc}
                  defaultSeverity={message.data.defaultSeverity}
                  context={message.data.context}
                  contexts={message.data.contexts}
                  businessOptions={message.data.businessOptions}
                  fromDiagnosis={message.data.fromDiagnosis}
                  onSubmit={store.submitFaultTicket}
                  onAsk={store.sendUserText}
                />
              )
            )}

            {message.kind === 'ticketCard' && (
              shouldSkipFaultOriginalCard
                ? null
                : wrapCard(
                    message,
                    message.data?.mode === 'list'
                      ? (
                        <TicketListCard
                          data={message.data}
                          onCopy={copyMessage}
                          onAsk={store.sendUserText}
                        />
                      )
                      : (
                        <TicketCard
                          ticket={message.data}
                          onOpen={store.openTicketDetail}
                          onCopy={copyMessage}
                          onAsk={store.sendUserText}
                        />
                      )
                  )
            )}

            {message.kind === 'receiptCard' && (
              shouldMergeFaultResult && isFaultMergedIndex
                ? null
                : wrapCard(
                    message,
                    <ReceiptCard
                      data={message.data}
                      onCopy={copyMessage}
                      onAsk={store.sendUserText}
                    />
                  )
            )}

            {message.kind === 'systemNotice' && !message.text && (
              shouldMergeFaultResult && isFaultMergedIndex
                ? null
                : <div className="rounded-lg border border-[#3f7db6] bg-[linear-gradient(135deg,rgba(20,76,133,0.9)_0%,rgba(15,57,101,0.92)_58%,rgba(18,78,99,0.9)_100%)] px-3 py-2 text-xs text-[#d8edff] shadow-[0_8px_16px_rgba(8,37,75,0.3)]">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-full border border-[rgba(147,214,255,0.45)] bg-[rgba(26,109,156,0.38)] px-1.5 py-0.5 text-[10px] text-[#bfe7ff]">服务进展</div>
                  {message.data.status && (
                    <div
                      className={`rounded-full border px-1.5 py-0.5 text-[10px] ${
                        message.data.status === 'done'
                          ? 'border-[#5fbf98] bg-[rgba(25,106,84,0.6)] text-[#dcfff3]'
                          : 'border-[#69b7ef] bg-[rgba(23,77,128,0.6)] text-[#def3ff]'
                      }`}
                    >
                      {message.data.status === 'done' ? '已完成' : '处理中'}
                    </div>
                  )}
                </div>
                <div>{message.data.title}</div>
                {typeof message.data.progress === 'number' && (
                  <div className="mt-1.5 h-1.5 rounded-full bg-[#0c325f]">
                    <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,#6ed9ff_0%,#4f99ff_45%,#63d3a8_100%)]" style={{ width: `${message.data.progress}%` }} />
                  </div>
                )}
                {Array.isArray(message.data.logs) && message.data.logs.length > 0 && (
                  <div className="custom-scrollbar mt-2 max-h-[92px] overflow-y-auto rounded border border-[rgba(111,177,230,0.35)] bg-[rgba(10,43,78,0.52)] px-2 py-1.5">
                    {message.data.logs.slice(-4).map((line: { time: string; text: string }, idx: number) => (
                      <div key={`${line.time}_${idx}`} className="text-[11px] text-[#d6ebff]">
                        <span className="mr-1 text-[#97c5eb]">{line.time}</span>
                        {line.text}
                      </div>
                    ))}
                  </div>
                )}
                <CardActionBar
                  actions={[
                    {
                      key: 'copy',
                      label: '复制进展',
                      onClick: () =>
                        copyMessage(
                          [
                            String(message.data.title || '服务进展'),
                            ...(Array.isArray(message.data.logs)
                              ? message.data.logs.map((line: { time: string; text: string }) => `${line.time} ${line.text}`)
                              : []),
                          ].join('\n')
                        ),
                    },
                    {
                      key: 'ask',
                      label: '继续处理',
                      tone: 'primary',
                      onClick: () => store.sendUserText('请基于这条服务进展给我下一步处理建议'),
                    },
                  ]}
                />
              </div>
            )}

            {message.kind === 'fallback' && (
              wrapCard(
                message,
                <div className="rounded-xl border border-[#496ea4] bg-[linear-gradient(135deg,rgba(26,68,113,0.85)_0%,rgba(48,67,131,0.82)_56%,rgba(92,65,122,0.78)_100%)] p-3 text-xs text-[#c9def5]">
                  <div className="text-sm font-semibold text-[#eef6ff]">{message.data.title}</div>
                  <p className="mt-1">{message.data.desc}</p>
                  <CardActionBar
                    actions={[
                      {
                        key: 'retry',
                        label: '换个问法',
                        onClick: () => store.retryLastQuestion(),
                      },
                      {
                        key: 'manager',
                        label: '联系客户经理',
                        onClick: () => store.sendUserText('联系客户经理'),
                      },
                      {
                        key: 'feedback',
                        label: '反馈问题',
                        tone: 'primary',
                        onClick: () => store.sendUserText('我要反馈这个问题'),
                      },
                    ]}
                  />
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};
