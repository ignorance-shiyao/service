import React, { useEffect, useRef } from 'react';
import { AlertTriangle, RefreshCw, Settings2, Ticket, User } from 'lucide-react';
import { useDemoScenario } from '../hooks/useDemoScenario';
import { CUSTOMERS } from '../mock/chat';

export const DemoConsole: React.FC = () => {
  const {
    healthMode,
    customer,
    modelMode,
    maximized,
    tickets,
    toggleMax,
    setHealth,
    triggerFault,
    setCustomer,
    setModelMode,
    runDiagnosis,
    createTicket,
    advanceTicket,
    resetDemo,
    appendMessage,
    switchTab
  } = useDemoScenario();
  const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const schedule = (ms: number, fn: () => void) => {
    const timer = window.setTimeout(fn, ms);
    timersRef.current.push(timer);
  };

  return (
    <div className="fixed bottom-5 left-5 z-[190] w-72 rounded-xl border border-[#3b638d] bg-[linear-gradient(180deg,#163862_0%,#102743_100%)] p-3 text-xs text-slate-200 shadow-[0_16px_42px_rgba(0,0,0,0.45)]">
      <div className="mb-2 flex items-center gap-1.5 font-bold text-emerald-300">
        <Settings2 size={13} />
        演示控制台
      </div>
      <div className="mb-2">
        <div className="mb-1 text-slate-400">整体健康度</div>
        <div className="flex gap-1">
          <button className="rounded border border-[#42658b] bg-[#1b4069] px-2 py-1 text-[#d0e4f7]" onClick={() => setHealth('normal')}>全绿</button>
          <button className="rounded border border-[#42658b] bg-[#1b4069] px-2 py-1 text-[#d0e4f7]" onClick={() => setHealth('warning')}>有关注</button>
          <button className="rounded border border-[#42658b] bg-[#1b4069] px-2 py-1 text-[#d0e4f7]" onClick={() => setHealth('fault')}>有故障</button>
        </div>
      </div>
      <div className="mb-2">
        <button className="inline-flex items-center gap-1 rounded border border-[#ff928f] bg-[#b23434] px-2 py-1 text-white" onClick={triggerFault}>
          <AlertTriangle size={12} />
          触发专线故障
        </button>
      </div>
      <div className="mb-2">
        <div className="mb-1 flex items-center gap-1 text-slate-300"><User size={12} />终端用户</div>
        <select
          value={customer.id}
          onChange={(e) => setCustomer(e.target.value)}
          className="w-full rounded border border-[#42658b] bg-[#123258] p-1 text-[#d7ecff]"
        >
          {CUSTOMERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="mb-2">
        <div className="mb-1 text-slate-400">模型可用状态</div>
        <div className="flex gap-1">
          <button className={`rounded border px-2 py-1 ${modelMode === 'normal' ? 'border-[#61b6ff] bg-[#1f5b95]' : 'border-[#42658b] bg-[#1b4069]'}`} onClick={() => setModelMode('normal')}>正常</button>
          <button className={`rounded border px-2 py-1 ${modelMode === 'degraded' ? 'border-[#61b6ff] bg-[#1f5b95]' : 'border-[#42658b] bg-[#1b4069]'}`} onClick={() => setModelMode('degraded')}>降级</button>
          <button className={`rounded border px-2 py-1 ${modelMode === 'faq' ? 'border-[#61b6ff] bg-[#1f5b95]' : 'border-[#42658b] bg-[#1b4069]'}`} onClick={() => setModelMode('faq')}>纯 FAQ</button>
        </div>
      </div>
      <div className="mb-2">
        <button
          className="inline-flex items-center gap-1 rounded border border-[#89a8ff] bg-[#465ec5] px-2 py-1 text-white"
          onClick={() => tickets[0] && advanceTicket(tickets[0].id)}
          disabled={!tickets[0]}
        >
          <Ticket size={12} />
          工单推进
        </button>
      </div>
      <div className="mb-2 rounded border border-[#42658b] bg-[#16355a] p-2">
        <div className="mb-1 text-[11px] text-[#b8d5ef]">演示主线快捷触发</div>
        <div className="grid grid-cols-2 gap-1">
          <button
            className="rounded border border-[#42658b] bg-[#1b4069] px-2 py-1 text-[#d0e4f7]"
            onClick={() => {
              clearTimers();
              setHealth('normal');
              switchTab('chat');
              if (maximized) toggleMax();
              appendMessage({
                id: `scene-a-${Date.now()}`,
                role: 'assistant',
                time: now(),
                type: 'TextMessage',
                payload: { title: '场景 A', text: '当前一切正常，您可以点“给我看看所有业务状态”。' }
              });
              appendMessage({
                id: `scene-a-actions-${Date.now()}`,
                role: 'assistant',
                time: now(),
                type: 'ActionButtonsMessage',
                actions: [{ id: 'ask-overview', label: '给我看看所有业务状态', kind: 'primary' }]
              });
            }}
          >
            场景 A
          </button>
          <button
            className="rounded border border-[#42658b] bg-[#1b4069] px-2 py-1 text-[#d0e4f7]"
            onClick={() => {
              clearTimers();
              switchTab('chat');
              triggerFault();
              let ticketId = '';
              schedule(1200, () => {
                runDiagnosis();
              });
              schedule(2600, () => {
                const ticket = createTicket('由场景 B 自动串联报障');
                ticketId = ticket.id;
              });
              schedule(4200, () => ticketId && advanceTicket(ticketId));
              schedule(5600, () => ticketId && advanceTicket(ticketId));
              schedule(7000, () => ticketId && advanceTicket(ticketId));
            }}
          >
            场景 B
          </button>
          <button
            className="rounded border border-[#42658b] bg-[#1b4069] px-2 py-1 text-[#d0e4f7]"
            onClick={() => {
              clearTimers();
              switchTab('report');
              if (!maximized) toggleMax();
              appendMessage({
                id: `scene-c-${Date.now()}`,
                role: 'assistant',
                time: now(),
                type: 'TextMessage',
                payload: { title: '场景 C', text: '已进入服务报告并切换最大化阅读。' }
              });
            }}
          >
            场景 C
          </button>
          <button
            className="rounded border border-[#42658b] bg-[#1b4069] px-2 py-1 text-[#d0e4f7]"
            onClick={() => {
              clearTimers();
              switchTab('chat');
              setModelMode('normal');
              appendMessage({
                id: `scene-d-${Date.now()}`,
                role: 'assistant',
                time: now(),
                type: 'ActionButtonsMessage',
                actions: [{ id: 'ask-line-status', label: '阜阳到合肥总部专线今天正常吗？', kind: 'primary' }]
              });
              schedule(1500, () => {
                setModelMode('faq');
                appendMessage({
                  id: `scene-d-faq-${Date.now()}`,
                  role: 'assistant',
                  time: now(),
                  type: 'ActionButtonsMessage',
                  payload: { text: '已切换纯 FAQ 模式，试试复杂提问。' },
                  actions: [{ id: 'ask-unknown-plan', label: '请帮我分析一下下季度业务规划', kind: 'secondary' }]
                });
              });
            }}
          >
            场景 D
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-400">当前：{healthMode}</span>
        <button className="inline-flex items-center gap-1 rounded border border-[#42658b] bg-[#1b4069] px-2 py-1 text-[#d0e4f7]" onClick={resetDemo}>
          <RefreshCw size={12} />
          重置
        </button>
      </div>
    </div>
  );
};
