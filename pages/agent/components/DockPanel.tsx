import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ChartBarBig,
  FileText,
  HardDrive,
  Maximize2,
  Minimize2,
  Send,
  ShieldAlert,
  Ticket,
  X
} from 'lucide-react';
import { useAIDock } from '../store/aidock';
import { useChat } from '../hooks/useChat';
import { ChatTab, DiagnosisTab, KnowledgeTab, OverviewTab, ReportTab, TicketTab } from './tabs';

const TAB_ITEMS = [
  { key: 'chat', label: '对话', icon: Bot },
  { key: 'overview', label: '业务概览', icon: ChartBarBig },
  { key: 'diagnosis', label: '自助排障', icon: ShieldAlert },
  { key: 'report', label: '服务报告', icon: FileText },
  { key: 'knowledge', label: '知识库', icon: HardDrive },
  { key: 'ticket', label: '工单进度', icon: Ticket }
] as const;

export const DockPanel: React.FC = () => {
  const { state, setOpen, switchTab, toggleMax, appendMessage, createTicket, advanceTicket, runDiagnosis } = useAIDock();
  const { sendUserText } = useChat();
  const [input, setInput] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [size, setSize] = useState({ width: 480, height: 720 });
  const [resizing, setResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; x: number; y: number; width: number; height: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prevRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const minWidth = 420;
  const minHeight = 620;
  const maxWidth = 960;
  const maxHeight = 900;

  const clamp = (x: number, y: number, width = size.width, height = size.height) => {
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const maxY = Math.max(8, window.innerHeight - height - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
  };

  useEffect(() => {
    setPosition(clamp(window.innerWidth - size.width - 20, window.innerHeight - size.height - 20));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition(clamp(dragRef.current.x + dx, dragRef.current.y + dy));
    };
    const onUp = () => {
      setDragging(false);
      setResizing(false);
      setResizeDir(null);
    };
    const onResize = (e: MouseEvent) => {
      if (!resizing || !resizeRef.current || !resizeDir) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      let nextWidth = resizeRef.current.width;
      let nextHeight = resizeRef.current.height;
      let nextX = resizeRef.current.x;
      let nextY = resizeRef.current.y;

      if (resizeDir.includes('e')) {
        nextWidth = Math.min(Math.max(minWidth, resizeRef.current.width + dx), Math.min(maxWidth, window.innerWidth - 16));
      }
      if (resizeDir.includes('s')) {
        nextHeight = Math.min(Math.max(minHeight, resizeRef.current.height + dy), Math.min(maxHeight, window.innerHeight - 16));
      }
      if (resizeDir.includes('w')) {
        const widthFromLeft = Math.min(Math.max(minWidth, resizeRef.current.width - dx), Math.min(maxWidth, window.innerWidth - 16));
        nextWidth = widthFromLeft;
        nextX = resizeRef.current.x + (resizeRef.current.width - widthFromLeft);
      }
      if (resizeDir.includes('n')) {
        const heightFromTop = Math.min(Math.max(minHeight, resizeRef.current.height - dy), Math.min(maxHeight, window.innerHeight - 16));
        nextHeight = heightFromTop;
        nextY = resizeRef.current.y + (resizeRef.current.height - heightFromTop);
      }

      const clampedPos = clamp(nextX, nextY, nextWidth, nextHeight);
      setSize({ width: nextWidth, height: nextHeight });
      setPosition(clampedPos);
    };
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    if (resizing) {
      window.addEventListener('mousemove', onResize);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousemove', onResize);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, resizing, resizeDir, size.width, size.height, position.x, position.y]);

  useEffect(() => {
    if (state.maximized) {
      prevRectRef.current = { x: position.x, y: position.y, width: size.width, height: size.height };
      const targetWidth = Math.min(Math.max(minWidth, Math.floor(window.innerWidth * 0.8)), maxWidth);
      const targetHeight = Math.min(Math.max(minHeight, Math.floor(window.innerHeight * 0.8)), maxHeight);
      const centered = clamp(Math.floor((window.innerWidth - targetWidth) / 2), Math.floor((window.innerHeight - targetHeight) / 2), targetWidth, targetHeight);
      setSize({ width: targetWidth, height: targetHeight });
      setPosition(centered);
    } else if (prevRectRef.current) {
      const rect = prevRectRef.current;
      setSize({ width: rect.width, height: rect.height });
      setPosition(clamp(rect.x, rect.y, rect.width, rect.height));
      prevRectRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.maximized]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const metaKey = isMac ? e.metaKey : e.ctrlKey;
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (metaKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (metaKey && e.key === '/') {
        e.preventDefault();
        toggleMax();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen, toggleMax]);

  const panelClass = useMemo(() => 'fixed z-[191]', []);

  const handleAction = (id: string) => {
    if (id === 'quick-diagnosis') {
      runDiagnosis();
      return;
    }
    if (id === 'open-ticket-tab') {
      if (state.tickets[0]) {
        appendMessage({
          id: `ticket-inline-${Date.now()}`,
          role: 'assistant',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          type: 'TicketCardMessage',
          payload: {
            ticketId: state.tickets[0].id,
            title: state.tickets[0].title,
            status: state.tickets[0].status,
            owner: state.tickets[0].owner,
            eta: state.tickets[0].eta
          }
        });
      }
      return;
    }
    if (id === 'diag-create-ticket') {
      appendMessage({
        id: `form-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: 'FormMessage',
        payload: { bizName: '专线', title: '合肥总部到阜阳专线中断' }
      });
      switchTab('chat');
      return;
    }
    if (id === 'diag-history') {
      appendMessage({
        id: `diag-history-msg-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: 'TextMessage',
        payload: { title: '历史类似故障', text: '过去 30 天同类故障 2 次，平均恢复时长 28 分钟。' }
      });
      return;
    }
    if (id === 'ask-overview') {
      sendUserText('给我看看所有业务状态');
      return;
    }
    if (id === 'ask-line-status') {
      sendUserText('阜阳到合肥总部专线今天正常吗？');
      return;
    }
    if (id === 'ask-unknown-plan') {
      sendUserText('请帮我分析一下下季度业务规划');
      return;
    }
    if (id === 'ask-alert-reason') {
      sendUserText('刚才为什么报警');
      return;
    }
    if (id === 'ask-month') {
      sendUserText('这个月业务怎么样');
      return;
    }
    if (id === 'ask-quantum') {
      sendUserText('量子加密保护是什么');
      return;
    }
    if (id === 'transfer-human') {
      appendMessage({
        id: `human-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: 'TextMessage',
        payload: { title: '已转客户经理', text: '已通知客户经理稍后与您联系。' }
      });
      return;
    }
    if (id === 'open-line-detail') {
      appendMessage({
        id: `line-detail-tip-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: 'BusinessCardMessage',
        payload: { cards: state.cards.filter((x) => x.id === 'xianlu') }
      });
    }
  };

  const handleSubmitInput = () => {
    if (!input.trim()) return;
    sendUserText(input);
    setInput('');
    switchTab('chat');
  };

  const handleCreateTicket = (note: string) => {
    createTicket(note);
    switchTab('chat');
  };

  const currentTab = () => {
    if (state.activeTab === 'chat') {
      return (
        <ChatTab
          onAction={handleAction}
          onFormSubmit={handleCreateTicket}
          onOpenBizCard={(id) => {
            appendMessage({
              id: `biz-inline-${Date.now()}`,
              role: 'assistant',
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              type: 'BusinessCardMessage',
              payload: { cards: state.cards.filter((card) => card.id === id) }
            });
          }}
        />
      );
    }
    if (state.activeTab === 'overview') return <OverviewTab />;
    if (state.activeTab === 'diagnosis') return <DiagnosisTab onCreateTicket={handleCreateTicket} />;
    if (state.activeTab === 'report') return <ReportTab />;
    if (state.activeTab === 'knowledge') {
      return (
        <KnowledgeTab
          onAsk={(q) => {
            appendMessage({
              id: `faq-q-${Date.now()}`,
              role: 'user',
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              type: 'TextMessage',
              payload: { text: q }
            });
            appendMessage({
              id: `faq-a-${Date.now()}`,
              role: 'assistant',
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              type: 'TextMessage',
              payload: {
                title: '标准回答',
                text: '结论：当前整体稳定。解释：关键链路和终端在线情况良好。建议：如需进一步确认，可执行一键体检并查看业务概览详情。'
              }
            });
            switchTab('chat');
          }}
        />
      );
    }
    return <TicketTab onAdvance={advanceTicket} />;
  };

  return (
    <>
      <div
        className={`${panelClass} flex flex-col overflow-hidden rounded-2xl border border-[#2a5f94] bg-[linear-gradient(180deg,#0a2140_0%,#06152b_100%)] text-slate-200 shadow-[0_18px_60px_rgba(0,0,0,0.55)]`}
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
      >
        <div
          className="flex cursor-grab items-center justify-between border-b border-[#2a5789] bg-[linear-gradient(180deg,#113f74_0%,#0d2f58_100%)] px-3 py-2 active:cursor-grabbing"
          onMouseDown={(e) => {
            setDragging(true);
            dragRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              x: position.x,
              y: position.y
            };
          }}
        >
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-[#5aa8ff]/40 bg-[#1e4f89]/45 p-1 text-[#bce3ff]">
              <Bot size={13} />
            </div>
            <div className="text-sm font-bold tracking-wide text-[#d7ecff]">运维管家智能体</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="rounded border border-[#3f6ea2] bg-[#123b68] p-1 text-[#a9d5ff] hover:border-[#64b0ff]"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={toggleMax}
            >
              {state.maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              className="rounded border border-[#3f6ea2] bg-[#123b68] p-1 text-[#a9d5ff] hover:border-[#ff7b7b] hover:text-[#ffd2d2]"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setOpen(false)}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-[#1d3f64] bg-[#0b1b33] px-2 py-2">
          {TAB_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`shrink-0 rounded-md border px-2 py-1 text-xs transition ${
                state.activeTab === item.key
                  ? 'border-[#5aa8ff] bg-[#1f4f8b] text-white'
                  : 'border-[#2e4f72] bg-[#132945] text-[#b0c8de] hover:border-[#4e82b8]'
              }`}
              onClick={() => switchTab(item.key)}
            >
              <span className="flex items-center gap-1">
                <item.icon size={12} />
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(74,143,218,0.12),transparent_46%)] p-3">
          {currentTab()}
        </div>

        <div className="border-t border-[#224a74] bg-[linear-gradient(180deg,#0f2a49_0%,#0b1f37_100%)] p-2">
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-[#3d638a] bg-[#1b3c63] px-2 py-1 text-xs text-[#c5ddf3] hover:border-[#5caeff]"
              onClick={() => setInput('帮我看一下专线业务状态')}
            >
              +
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitInput()}
              placeholder="请输入问题..."
              className="flex-1 rounded-md border border-[#33587c] bg-[#0b1930] px-2.5 py-1.5 text-sm text-white placeholder:text-[#6f8dab]"
            />
            <button
              className="inline-flex items-center gap-1 rounded-md border border-[#60b2ff] bg-[linear-gradient(180deg,#368fe9_0%,#2d79cb_100%)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_14px_rgba(74,163,255,0.28)]"
              onClick={handleSubmitInput}
            >
              <Send size={12} />
              发送
            </button>
          </div>
        </div>
        {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const).map((dir) => {
          const base = 'absolute z-10 bg-transparent';
          const styles: Record<typeof dir, string> = {
            n: 'left-2 right-2 top-0 h-2 cursor-n-resize',
            s: 'bottom-0 left-2 right-2 h-2 cursor-s-resize',
            e: 'right-0 top-2 bottom-2 w-2 cursor-e-resize',
            w: 'left-0 top-2 bottom-2 w-2 cursor-w-resize',
            ne: 'right-0 top-0 h-3 w-3 cursor-ne-resize',
            nw: 'left-0 top-0 h-3 w-3 cursor-nw-resize',
            se: 'bottom-0 right-0 h-3 w-3 cursor-se-resize',
            sw: 'bottom-0 left-0 h-3 w-3 cursor-sw-resize'
          };
          return (
            <div
              key={dir}
              className={`${base} ${styles[dir]}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                setResizing(true);
                setResizeDir(dir);
                resizeRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  x: position.x,
                  y: position.y,
                  width: size.width,
                  height: size.height
                };
              }}
            />
          );
        })}
      </div>
    </>
  );
};
