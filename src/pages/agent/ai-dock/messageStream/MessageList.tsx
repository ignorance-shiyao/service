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
import { FaultFormCard } from './cards/FaultFormCard';
import { TicketCard } from './cards/TicketCard';

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
              <MessageBubble message={message} />
            )}

            {message.kind === 'knowledgeCard' && (
              <KnowledgeCard item={message.data} onOpen={store.openKnowledgeDrawer} />
            )}

            {message.kind === 'qa' && (
              <QaMessage
                data={message.data}
                onSendFollowup={store.sendUserText}
                onOpenKnowledge={store.openKnowledgeDrawer}
              />
            )}

            {message.kind === 'reportCard' && (
              <ReportCard
                report={message.data}
                businesses={store.managedBusinesses}
                onOpenHistory={store.openReportHistory}
                onExport={store.runReportExport}
              />
            )}

            {message.kind === 'businessQuery' && (
              <BusinessQueryCard categories={message.data} />
            )}

            {message.kind === 'diagnosisSelect' && (
              <DiagnosisSelectCard
                list={message.data}
                onSelect={(item) => store.runDiagnosisFlow(item)}
              />
            )}

            {message.kind === 'diagnosisProgress' && (
              <DiagnosisProgress
                title={message.data.title}
                progress={message.data.progress}
                step={message.data.step}
                running={message.data.running}
              />
            )}

            {message.kind === 'diagnosisReport' && (
              <DiagnosisReportCard
                data={message.data}
                onHistory={store.openDiagnosisHistory}
                onFault={(data) => {
                  store.setTicketDraftFromDiagnosis(data);
                  store.sendUserText('我要发起报障', 'fault');
                }}
              />
            )}

            {message.kind === 'faultForm' && (
              <FaultFormCard
                defaultTitle={message.data.defaultTitle}
                defaultBusiness={message.data.defaultBusiness}
                fromDiagnosis={message.data.fromDiagnosis}
                onSubmit={store.submitFaultTicket}
              />
            )}

            {message.kind === 'ticketCard' && (
              <TicketCard ticket={message.data} onOpen={store.openTicketDetail} />
            )}

            {message.kind === 'systemNotice' && !message.text && (
              <div className="rounded-lg border border-[#3f7db6] bg-[linear-gradient(135deg,rgba(25,84,146,0.9)_0%,rgba(17,66,114,0.9)_55%,rgba(20,96,113,0.86)_100%)] px-3 py-2 text-xs text-[#d8edff] shadow-[0_8px_16px_rgba(8,37,75,0.3)]">
                <div className="mb-1 inline-flex items-center rounded-full border border-[rgba(147,214,255,0.45)] bg-[rgba(26,109,156,0.38)] px-1.5 py-0.5 text-[10px] text-[#bfe7ff]">系统通知</div>
                <div>{message.data.title}</div>
                {typeof message.data.progress === 'number' && (
                  <div className="mt-1.5 h-1.5 rounded-full bg-[#0c325f]">
                    <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,#6ed9ff_0%,#4f99ff_45%,#63d3a8_100%)]" style={{ width: `${message.data.progress}%` }} />
                  </div>
                )}
              </div>
            )}

            {message.kind === 'fallback' && (
              <div className="rounded-xl border border-[#496ea4] bg-[linear-gradient(135deg,rgba(26,68,113,0.85)_0%,rgba(48,67,131,0.82)_56%,rgba(92,65,122,0.78)_100%)] p-3 text-xs text-[#c9def5]">
                <div className="text-sm font-semibold text-[#eef6ff]">{message.data.title}</div>
                <p className="mt-1">{message.data.desc}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="rounded border border-[#58b7ea] bg-[linear-gradient(180deg,#2674b6_0%,#1a5a92_100%)] px-2 py-1 text-[11px] text-[#e9f7ff]" onClick={() => store.sendUserText('联系客户经理')}>联系客户经理</button>
                  <button type="button" className="rounded border border-[#c78f54] bg-[linear-gradient(180deg,#a76b2f_0%,#7f4a1e_100%)] px-2 py-1 text-[11px] text-[#fff0d9]" onClick={() => store.sendUserText('我要反馈这个问题')}>反馈问题</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {store.isResponding && (
        <div className="ai-dock-msg-enter flex justify-start gap-2">
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#134982] text-[#bfe4ff]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a8d9ff]" />
          </div>
          <div className="rounded-2xl rounded-bl-md border border-[#2f6fad] bg-[rgba(17,60,108,0.78)] px-3 py-2">
            <div className="ai-dock-typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
