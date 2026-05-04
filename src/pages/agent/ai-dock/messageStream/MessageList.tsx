import React from 'react';
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

  return (
    <div className="space-y-2 px-3 py-3">
      {messages.map((message, index) => {
        const prev = messages[index - 1];
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
                />
              )
            )}

            {message.kind === 'ticketCard' && (
              wrapCard(
                message,
                <TicketCard
                  ticket={message.data}
                  onOpen={store.openTicketDetail}
                  onCopy={copyMessage}
                  onAsk={store.sendUserText}
                />
              )
            )}

            {message.kind === 'receiptCard' && (
              wrapCard(
                message,
                <ReceiptCard
                  data={message.data}
                  onCopy={copyMessage}
                  onAsk={store.sendUserText}
                />
              )
            )}

            {message.kind === 'systemNotice' && !message.text && (
              <div className="rounded-lg border border-[#3f7db6] bg-[linear-gradient(135deg,rgba(20,76,133,0.9)_0%,rgba(15,57,101,0.92)_58%,rgba(18,78,99,0.9)_100%)] px-3 py-2 text-xs text-[#d8edff] shadow-[0_8px_16px_rgba(8,37,75,0.3)]">
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
