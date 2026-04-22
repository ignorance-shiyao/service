import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, UserCircle2 } from 'lucide-react';
import { MessageRenderer } from '../messages';
import { useAIDock } from '../../store/aidock';
import { HealthRing } from '../common/HealthRing';

interface Props {
  onAction: (id: string) => void;
  onFormSubmit: (note: string) => void;
  onOpenBizCard: (id: string) => void;
}

export const ChatTab: React.FC<Props> = ({ onAction, onFormSubmit, onOpenBizCard }) => {
  const { state, createSession, switchSession } = useAIDock();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [questionBatch, setQuestionBatch] = useState(0);
  const healthValue = state.healthMode === 'normal' ? 96 : state.healthMode === 'warning' ? 82 : 64;
  const healthText = state.healthMode === 'normal' ? '当前一切正常' : state.healthMode === 'warning' ? '有 1 项需要关注' : '有 1 项故障需处理';
  const quickQuestionGroups = useMemo(
    () =>
      state.healthMode === 'normal'
        ? [
            [
              { id: 'ask-overview', label: '给我看看所有业务状态' },
              { id: 'ask-month', label: '按月生成最近一个月运行报告摘要' },
              { id: 'ask-quantum', label: '量子加密保护是什么' }
            ],
            [
              { id: 'ask-overview', label: '帮我查询某条业务的当前状态' },
              { id: 'ask-month', label: '当前有哪些在途工单和超时工单' },
              { id: 'ask-quantum', label: '当前服务报告里哪些点需要关注' }
            ]
          ]
        : [
            [
              { id: 'ask-alert-reason', label: '刚才为什么报警' },
              { id: 'quick-diagnosis', label: '立即体检' },
              { id: 'ask-line-status', label: '阜阳到合肥总部专线今天正常吗？' }
            ],
            [
              { id: 'quick-diagnosis', label: '帮我执行一键体检并给出建议' },
              { id: 'ask-alert-reason', label: '上次类似问题怎么解决的' },
              { id: 'ask-line-status', label: '我需要现在就报障吗？' }
            ]
          ],
    [state.healthMode]
  );
  const quickQuestions = quickQuestionGroups[questionBatch % quickQuestionGroups.length];

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.messages]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-2xl border border-[#335b81] bg-[#0d2540]/90 p-4">
        <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            className="shrink-0 rounded-full border border-[#5aa8ff] bg-[#1f4f8b] px-3 py-1 text-xs text-white"
            onClick={createSession}
          >
            + 新建会话
          </button>
          {state.sessions.map((session) => (
            <button
              key={session.id}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                session.id === state.activeSessionId
                  ? 'border-[#66b7ff] bg-[#194678] text-white'
                  : 'border-[#335b81] bg-[#102a47] text-[#b8d1e8]'
              }`}
              onClick={() => switchSession(session.id)}
            >
              {session.title}
            </button>
          ))}
        </div>
        <div className="mb-2 text-xs font-semibold tracking-wide text-[#9ec5e7]">当前服务对象</div>
        <div className="rounded-2xl border border-[#3a6288] bg-[#102a47] p-3">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="text-[28px] leading-none font-black text-white">{state.customer.name}</div>
              <div className="mt-1 text-xs text-[#9ec5e7]">客户编码 CUST-****-001 · {state.customer.industry}</div>
            </div>
            <div className="rounded-full bg-[#1f4f8b] px-3 py-1 text-xs font-semibold text-[#cfeaff]">重点保障</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#163556] p-2.5">
              <div className="text-[11px] text-[#9ec5e7]">服务保障说明</div>
              <div className="mt-1 text-base font-bold text-white">7x24 专属保障</div>
            </div>
            <div className="rounded-xl bg-[#163556] p-2.5">
              <div className="text-[11px] text-[#9ec5e7]">服务联系人</div>
              <div className="mt-1 text-base font-bold text-white">服务联系人 A</div>
            </div>
            <div className="rounded-xl bg-[#163556] p-2.5">
              <div className="text-[11px] text-[#9ec5e7]">联系电话</div>
              <div className="mt-1 text-base font-bold text-white">138****8888</div>
            </div>
            <div className="rounded-xl bg-[#163556] p-2.5">
              <div className="text-[11px] text-[#9ec5e7]">数据更新时间</div>
              <div className="mt-1 text-base font-bold text-white">2026-04-22 09:30</div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-[#335b81] bg-[#0f2744] p-2.5">
          <div>
            <div className="text-sm font-bold text-white">您好，{state.customer.name}</div>
            <div className="text-xs text-[#a8c9e6]">{healthText}</div>
          </div>
          <div className="shrink-0">
            <HealthRing value={healthValue} status={state.healthMode} size={56} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#335b81] bg-[#0d2540]/90 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-base font-bold text-[#d7ecff]">猜你想问</div>
          <button
            className="inline-flex items-center gap-1 text-xs text-[#9ec5e7] hover:text-white"
            onClick={() => setQuestionBatch((v) => (v + 1) % quickQuestionGroups.length)}
          >
            <RefreshCw size={12} />
            换一批
          </button>
        </div>
        {quickQuestions.map((question) => (
          <button
            key={question.id}
            className="mb-2 block w-full rounded-2xl border border-[#3b648b] bg-[#132d4b] px-4 py-3 text-left text-base text-[#d6e8f8] hover:border-[#66b7ff]"
            onClick={() => onAction(question.id)}
          >
            {question.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        {state.messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role !== 'user' && (
              <div className="mt-1 rounded-full bg-[#c7d8ff]/20 p-1.5 text-[#d8e7ff]">
                <UserCircle2 size={16} />
              </div>
            )}
            <div className={`${message.role === 'user' ? 'max-w-[82%]' : 'max-w-[88%]'}`}>
              <MessageRenderer
                message={message}
                onAction={onAction}
                onFormSubmit={onFormSubmit}
                onOpenBizCard={onOpenBizCard}
              />
              <div className="mt-1 text-[10px] text-slate-500">{message.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
