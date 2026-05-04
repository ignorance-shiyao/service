import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, History, LoaderCircle, Maximize2, Minimize2, Plus, RotateCcw, Send, Square, Trash2, X } from 'lucide-react';
import { AiDockStore } from './store/useAiDock';
import { MessageList } from './messageStream/MessageList';
import { QuickChipsBar } from './chips/QuickChipsBar';
import { KnowledgeDrawer } from './messageStream/cards/KnowledgeDrawer';
import { ReportHistoryDrawer } from './messageStream/cards/ReportHistoryDrawer';
import { DiagnosisHistoryDrawer } from './messageStream/cards/DiagnosisHistoryDrawer';
import { TicketDetailDrawer } from './messageStream/cards/TicketDetailDrawer';
import { confirmApp, showAppToast } from '../../../components/AppFeedback';
import robotEntryIcon from '../../../assets/robot-entry.svg';
import './aiDockTheme.css';

interface AiDockWindowProps {
  store: AiDockStore;
  onClose: () => void;
}

export const AiDockWindow: React.FC<AiDockWindowProps> = ({ store, onClose }) => {
  type SizeMode = 'medium' | 'max';
  type ResizeMode = 'left' | 'right' | 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null;
  const getMediumPreset = () => {
    const width = Math.min(1120, Math.max(760, Math.round(window.innerWidth * 0.58)));
    const height = Math.min(window.innerHeight - 16, Math.max(560, Math.round(window.innerHeight * 0.74)));
    return { width, height };
  };

  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState<ResizeMode>(null);
  const [sizeMode, setSizeMode] = useState<SizeMode>('medium');
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1440 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'diagnosis' | 'ticket' | 'report' | 'business'>('all');
  const [historyKeyword, setHistoryKeyword] = useState('');
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const resizeRef = useRef<{ x: number; y: number; left: number; top: number; width: number; height: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottomRef = useRef(true);
  const heroTips = useMemo(
    () => [
      {
        chip: 'chip_health',
        tag: '业务诊断',
        summary: '按业务重要性推荐本次诊断范围并预选清单',
        prompt: '请根据业务重要性推荐本次业务诊断范围',
      },
      {
        chip: 'chip_report',
        tag: '运行报告',
        summary: '自动汇总本月运行报告并给出处置建议',
        prompt: '生成本月运行报告并给出重点处置建议',
      },
      {
        chip: 'chip_fault',
        tag: '自助报障',
        summary: '从故障上下文一键发起报障并自动生成工单',
        prompt: '我要发起报障',
      },
      {
        chip: 'chip_business',
        tag: '业务查询',
        summary: '按业务类型查询名下清单并查看详情',
        prompt: '帮我查一下我名下都有哪些业务',
      },
    ],
    []
  );

  useEffect(() => {
    if (!listRef.current) return;
    if (stickToBottomRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [store.messages]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.min(74, Math.max(34, inputRef.current.scrollHeight))}px`;
  }, [input]);

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fullSize = useMemo(
    () => ({
      width: Math.max(360, viewport.width - 16),
      height: Math.max(420, viewport.height - 16),
    }),
    [viewport.height, viewport.width]
  );

  const renderSize = sizeMode === 'max' ? fullSize : store.windowSize;

  const style = useMemo(() => {
    if (sizeMode === 'max') return { left: 8, top: 8 };
    const x = store.position.x || Math.max(16, window.innerWidth - (store.windowSize.width + 40));
    const y = store.position.y || Math.max(16, window.innerHeight - (store.windowSize.height + 40));
    return { left: x, top: y };
  }, [sizeMode, store.position.x, store.position.y, store.windowSize.height, store.windowSize.width]);

  const clamp = (x: number, y: number, width = store.windowSize.width, height = store.windowSize.height) => {
    return {
      x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - width - 8)),
      y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - height - 8)),
    };
  };

  const centerPosition = (width: number, height: number) => {
    return clamp(
      Math.round((window.innerWidth - width) / 2),
      Math.round((window.innerHeight - height) / 2),
      width,
      height
    );
  };

  const startDrag = (e: React.MouseEvent) => {
    if (sizeMode === 'max') return;
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    setIsDragging(true);
  };

  const applySizeMode = (nextMode: SizeMode) => {
    setSizeMode(nextMode);
    if (nextMode === 'max') {
      return;
    }
    const preset = getMediumPreset();
    const width = Math.min(window.innerWidth - 16, preset.width);
    const height = Math.min(window.innerHeight - 16, preset.height);
    store.setWindowSize({ width, height });
    store.setPosition(centerPosition(width, height));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const next = clamp(
          dragRef.current.left + (e.clientX - dragRef.current.x),
          dragRef.current.top + (e.clientY - dragRef.current.y)
        );
        store.setPosition(next);
      }
      if (isResizing && resizeRef.current && resizeMode) {
        const dx = e.clientX - resizeRef.current.x;
        const dy = e.clientY - resizeRef.current.y;
        const startX = resizeRef.current.left;
        const startY = resizeRef.current.top;
        let left = startX;
        let top = startY;
        let width = resizeRef.current.width;
        let height = resizeRef.current.height;

        const withLeft = resizeMode === 'left' || resizeMode === 'topLeft' || resizeMode === 'bottomLeft';
        const withRight = resizeMode === 'right' || resizeMode === 'topRight' || resizeMode === 'bottomRight';
        const withTop = resizeMode === 'top' || resizeMode === 'topLeft' || resizeMode === 'topRight';
        const withBottom = resizeMode === 'bottom' || resizeMode === 'bottomLeft' || resizeMode === 'bottomRight';

        if (withRight) width = resizeRef.current.width + dx;
        if (withBottom) height = resizeRef.current.height + dy;
        if (withLeft) {
          left = startX + dx;
          width = resizeRef.current.width - dx;
        }
        if (withTop) {
          top = startY + dy;
          height = resizeRef.current.height - dy;
        }

        const minW = 360;
        const minH = 420;
        if (width < minW) {
          if (withLeft) left -= minW - width;
          width = minW;
        }
        if (height < minH) {
          if (withTop) top -= minH - height;
          height = minH;
        }

        left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - height - 8));
        width = Math.min(width, window.innerWidth - left - 8);
        height = Math.min(height, window.innerHeight - top - 8);

        store.setPosition({ x: left, y: top });
        store.setWindowSize({ width, height });
      }
    };
    const onUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeMode(null);
    };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, isResizing, resizeMode, store, sizeMode]);

  const startResize = (mode: Exclude<ResizeMode, null>) => (e: React.MouseEvent) => {
    if (sizeMode === 'max') return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: store.position.x || 8,
      top: store.position.y || 8,
      width: store.windowSize.width,
      height: store.windowSize.height,
    };
    setIsResizing(true);
    setResizeMode(mode);
    setSizeMode('medium');
  };

  const submit = async () => {
    if (!input.trim()) return;
    const value = input;
    setInput('');
    await store.sendUserText(value);
  };
  const hasUserMessage = store.messages.some((m) => m.role === 'user');

  const formatSessionTime = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const sameDay = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    if (sameDay) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const cycleSizeMode = () => {
    applySizeMode(sizeMode === 'max' ? 'medium' : 'max');
  };

  const cycleLabel = sizeMode === 'medium' ? '切换到全屏窗口' : '恢复到半屏窗口';
  const cycleIcon = sizeMode === 'medium' ? <Maximize2 size={13} /> : <Minimize2 size={13} />;
  const contentWrapClass = sizeMode === 'max' ? 'mx-auto w-full max-w-[1160px] px-3' : 'w-full';

  const onHeaderDoubleClick = () => {
    if (sizeMode === 'max') {
      applySizeMode('medium');
      return;
    }
    applySizeMode('max');
  };

  const filteredSessionMetas = useMemo(() => {
    let list = store.sessionMetas;
    if (historyFilter !== 'all') {
      const matcher: Record<'diagnosis' | 'ticket' | 'report' | 'business', RegExp> = {
        diagnosis: /诊断/,
        ticket: /工单|报障/,
        report: /报告|导出/,
        business: /业务清单|业务/,
      };
      const reg = matcher[historyFilter];
      list = list.filter((session) =>
        session.snapshotTags.some((tag) => reg.test(tag.label))
      );
    }
    const keyword = historyKeyword.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((session) => {
      const fields = [
        session.title,
        session.customerName,
        session.lastText,
        ...session.snapshotTags.map((tag) => tag.label),
      ]
        .join(' ')
        .toLowerCase();
      return fields.includes(keyword);
    });
  }, [historyFilter, historyKeyword, store.sessionMetas]);

  const activeCustomerName = useMemo(
    () => store.activeCustomer?.name || store.sessionMetas.find((session) => session.id === store.activeSessionId)?.customerName || '客户',
    [store.activeCustomer, store.activeSessionId, store.sessionMetas]
  );

  const heroTagToneClass: Record<string, string> = {
    chip_health: 'border-[#4fc0e8] bg-[#0f7fa4] text-[#dcf9ff]',
    chip_business: 'border-[#60b0ef] bg-[#1d70b2] text-[#e3f2ff]',
    chip_report: 'border-[#728ff0] bg-[#2a62c8] text-[#e5ebff]',
    chip_knowledge: 'border-[#9a89f2] bg-[#5f58ce] text-[#eeebff]',
    chip_ticket: 'border-[#848ee8] bg-[#4a5ac6] text-[#e6ebff]',
    chip_fault: 'border-[#da944d] bg-[#bc6f24] text-[#fff0dc]',
    chip_manager: 'border-[#4cb68a] bg-[#229569] text-[#e7fff3]',
  };

  const tagToneClass: Record<'blue' | 'cyan' | 'indigo' | 'green' | 'amber', string> = {
    blue: 'border-[#4c8fc4] bg-[#1a4f82] text-[#d8eeff]',
    cyan: 'border-[#4ea8b8] bg-[#1f5d67] text-[#d9fbff]',
    indigo: 'border-[#607dca] bg-[#364d94] text-[#e2eaff]',
    green: 'border-[#58a683] bg-[#285f4b] text-[#ddfff2]',
    amber: 'border-[#b18657] bg-[#6f4f30] text-[#fff1df]',
  };

  const scrollToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    stickToBottomRef.current = true;
    setShowScrollToBottom(false);
  };

  const handleMessageScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const distance = scrollHeight - clientHeight - scrollTop;
    const nearBottom = distance < 56;
    stickToBottomRef.current = nearBottom;
    setShowScrollToBottom(!nearBottom);
  };

  return (
    <div
      ref={wrapRef}
      style={{ ...style, width: renderSize.width, height: renderSize.height }}
      className={`ai-dock-surface fixed z-[220] flex flex-col overflow-hidden rounded-[16px] border border-[#2e6aa9] ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      <span className="ai-dock-ambient ai-dock-ambient-a" />
      <span className="ai-dock-ambient ai-dock-ambient-b" />
      <span className="ai-dock-ambient ai-dock-ambient-c" />
      <div className="ai-dock-header relative flex h-[56px] items-center justify-between border-b border-[#2a639f] px-3" onMouseDown={startDrag} onDoubleClick={onHeaderDoubleClick}>
        <div className="flex items-center gap-2">
          <div className="ai-dock-avatar-frame flex h-9 w-9 items-center justify-center rounded-lg border border-[#4e95cf]">
            <img src={robotEntryIcon} alt="AI管家" className="h-7 w-7" draggable={false} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#deefff]">运维管家智能体</div>
            <div className="flex items-center gap-1 text-[10px] text-[#8fcbff]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2be38f] shadow-[0_0_8px_rgba(43,227,143,0.8)]" />
              在线
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="ai-dock-icon-button rounded-full p-1.5"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={store.clearConversation}
            title="清空会话"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            className="ai-dock-icon-button rounded-full p-1.5"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={cycleSizeMode}
            title={cycleLabel}
          >
            {cycleIcon}
          </button>
          <button
            type="button"
            className="ai-dock-icon-button rounded-full p-1.5"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            title="关闭"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex flex-1 overflow-hidden">
          {historyOpen && (
            <aside className="ai-dock-history-pane min-h-0 w-[252px] shrink-0 border-r border-[#2a639f]">
              <div className="flex items-center justify-between border-b border-[#2d659f] px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="ai-dock-icon-button rounded-full p-1.5"
                    onClick={() => setHistoryOpen(false)}
                    title="收起会话历史"
                  >
                    <History size={12} />
                  </button>
                  <div className="text-xs font-semibold text-[#d8eeff]">会话历史</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    store.createConversation();
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-[#4d93ce] bg-[#1a548f] px-2 py-1 text-[11px] text-[#dff2ff]"
                >
                  <Plus size={12} />
                  新建
                </button>
              </div>
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
                <div className="mb-2">
                  <input
                    value={historyKeyword}
                    onChange={(e) => setHistoryKeyword(e.target.value)}
                    placeholder="搜索会话/客户/关键词"
                    className="ai-dock-input w-full rounded-md border border-[#3a6f9d] bg-[#123e69] px-2 py-1 text-[10px] text-[#d6ebff] placeholder:text-[#85b0d2] outline-none focus:border-[#62b9ff]"
                  />
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] text-[#8ebce0]">共 {filteredSessionMetas.length} 个会话</div>
                  <button
                    type="button"
                    disabled={filteredSessionMetas.length === 0}
                    onClick={async () => {
                      if (filteredSessionMetas.length === 0) return;
                      const ok = await confirmApp({
                        title: '删除会话',
                        message: `确认删除当前筛选下的 ${filteredSessionMetas.length} 个会话吗？`,
                        confirmText: '删除',
                        cancelText: '取消',
                        tone: 'warning',
                      });
                      if (!ok) return;
                      store.deleteConversations(filteredSessionMetas.map((item) => item.id));
                      showAppToast(`已删除 ${filteredSessionMetas.length} 个会话`, { tone: 'success' });
                    }}
                    className="rounded-full border border-[#915a5a] bg-[#5a2a36] px-1.5 py-0.5 text-[10px] text-[#ffd8d8] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    删除筛选结果
                  </button>
                </div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'diagnosis', label: '诊断' },
                    { id: 'ticket', label: '工单' },
                    { id: 'report', label: '报告' },
                    { id: 'business', label: '业务' },
                  ].map((item) => {
                    const active = historyFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setHistoryFilter(item.id as typeof historyFilter)}
                        className={`rounded-full border px-1.5 py-0.5 text-[10px] ${
                          active
                            ? 'border-[#63b8ff] bg-[#1a5288] text-[#e3f4ff]'
                            : 'border-[#396b98] bg-[#143f6d] text-[#a3cae8]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                {filteredSessionMetas.map((session) => {
                  const active = session.id === store.activeSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`ai-dock-session-item mb-1.5 rounded-lg border px-2 py-1.5 ${active ? 'border-[#62baff] bg-[#1b538a]' : 'border-[#2f649c] bg-[#153f6e] hover:border-[#4f91c7]'}`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer"
                        onClick={() => {
                          store.switchConversation(session.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            store.switchConversation(session.id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-xs font-semibold text-[#e3f2ff]">{session.title}</div>
                          <div className="text-[10px] text-[#8fbfe7]">{formatSessionTime(session.updatedAt)}</div>
                        </div>
                        <div className="mt-1 truncate text-[10px] text-[#9fc8ea]">{session.lastText}</div>
                        <div className="mt-1 truncate text-[10px] text-[#83b8e1]">客户：{session.customerName}</div>
                        <div className="mt-1 text-[10px] text-[#7fb0dc]">{session.messageCount} 条消息</div>
                        {session.snapshotTags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {session.snapshotTags.map((tag) => (
                              <span key={tag.label} className={`rounded-full border px-1.5 py-0.5 text-[10px] ${tagToneClass[tag.tone]}`}>
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex items-center rounded border border-[#396e9f] px-1 py-0.5 text-[10px] text-[#a3cbea] hover:border-[#c86a6a] hover:text-[#ffd2d2]"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const ok = await confirmApp({
                              title: '删除会话',
                              message: `确认删除会话「${session.title}」吗？`,
                              confirmText: '删除',
                              cancelText: '取消',
                              tone: 'warning',
                            });
                            if (!ok) return;
                            store.deleteConversation(session.id);
                            showAppToast(`已删除会话「${session.title}」`, { tone: 'success' });
                          }}
                          title="删除会话"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredSessionMetas.length === 0 && (
                  <div className="rounded-lg border border-[#2f649c] bg-[#153f6e] px-2 py-2 text-center text-[10px] text-[#9bc2df]">
                    当前条件下暂无会话
                  </div>
                )}
              </div>
            </aside>
          )}

          {!historyOpen && (
            <div className="ai-dock-history-rail flex w-8 shrink-0 items-start justify-center border-r border-[#2a639f] pt-2">
              <button
                type="button"
                className="ai-dock-icon-button rounded-full p-1.5"
                onClick={() => setHistoryOpen(true)}
                title="展开会话历史"
              >
                <History size={12} />
              </button>
            </div>
          )}

          <div className="min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden">
            <div
              ref={listRef}
              onScroll={handleMessageScroll}
              className="ai-dock-message-pane relative min-h-0 min-w-0 flex-1 overflow-y-auto custom-scrollbar"
            >
              <div className={`${contentWrapClass} min-w-0`}>
                {!hasUserMessage && (
                  <div className="px-1 pt-4">
                <div className="ai-dock-welcome-card mx-auto w-full max-w-[900px] rounded-2xl border border-[#2f6fad] p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#6fc2ff] bg-[#2f77c9] text-[#e9f6ff] shadow-[0_0_20px_rgba(83,174,248,0.35)]">
                    <img src={robotEntryIcon} alt="智能体图标" className="ai-dock-hero-robot h-7 w-7" draggable={false} />
                  </div>
                  <div className="ai-dock-hero-title text-xl font-semibold text-[#ebf7ff]">{`您好，${activeCustomerName}`}</div>
                  <div className="mt-1 text-[11px] text-[#9ec9e9]">
                    {store.activeCustomer.code} · 客户经理 {store.activeCustomer.accountManager.name}（{store.activeCustomer.accountManager.phone}）
                  </div>
                  <div className="mt-1 text-[11px] text-[#8fc0e5]">
                    SLA承诺：{store.activeCustomer.slas.responseMinutes}分钟响应 / {store.activeCustomer.slas.restoreHours}小时恢复
                  </div>
                  <div className="mt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => store.sendUserText(heroTips[0].prompt)}
                      className="ai-dock-hero-rotator inline-flex max-w-[760px] items-center gap-2 rounded-full border border-[#66a9de] bg-[linear-gradient(135deg,rgba(23,86,136,0.94)_0%,rgba(33,98,154,0.94)_56%,rgba(33,92,146,0.94)_100%)] px-3 py-2 text-[12px] text-[#ecf7ff] shadow-[0_16px_30px_rgba(6,32,61,0.28)]"
                    >
                      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${heroTagToneClass[heroTips[0].chip]}`}>
                        {heroTips[0].tag}
                      </span>
                      <span className="ai-dock-hero-tip truncate text-left">{heroTips[0].summary}</span>
                    </button>
                  </div>
                </div>
              </div>
                )}
                <MessageList messages={store.messages} store={store} />
                {store.drawer?.type === 'knowledge' && (
                  <KnowledgeDrawer
                    item={store.drawer.item}
                    onOpenKnowledge={store.openKnowledgeDrawer}
                    onAsk={store.sendUserText}
                    onClose={() => store.setDrawer(null)}
                  />
                )}
                {store.drawer?.type === 'reportHistory' && (
                  <ReportHistoryDrawer
                    list={store.drawer.list}
                    onSelect={(id) => {
                      store.setActiveReportId(id);
                      store.sendUserText('查看该期报告', 'report');
                      store.setDrawer(null);
                    }}
                    onClose={() => store.setDrawer(null)}
                  />
                )}
                {store.drawer?.type === 'diagnosisHistory' && (
                  <DiagnosisHistoryDrawer list={store.drawer.list} onClose={() => store.setDrawer(null)} />
                )}
                {store.drawer?.type === 'ticket' && (
                  <TicketDetailDrawer item={store.drawer.item} onClose={() => store.setDrawer(null)} />
                )}
              </div>
              {showScrollToBottom && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="absolute bottom-3 right-3 z-10 inline-flex h-8 items-center gap-1 rounded-full border border-[#5ba5e3] bg-[#1f5a95] px-2.5 text-[11px] text-[#e6f4ff] shadow-[0_8px_18px_rgba(8,37,75,0.34)] transition hover:border-[#8fd0ff] hover:bg-[#2a6daf]"
                  title="回到底部"
                >
                  <ChevronDown size={13} />
                  回到底部
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="ai-dock-composer-band border-t border-[#2a639f] px-3 py-2">
          <div className={`${contentWrapClass} min-w-0`}>
            <div className="ai-dock-composer rounded-2xl border border-[#3575b3] px-2 py-2">
              <QuickChipsBar chips={store.quickChips} onClick={store.handleQuickChip} className="mb-2" />
              {store.isResponding && (
                <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] text-[#9ed1f5]">
                  <LoaderCircle size={12} className="ai-dock-spin" />
                  正在生成回复，您可以随时停止
                </div>
              )}
              <div className="flex h-[44px] items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入问题，回车发送，换行请按 Shift+回车"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  rows={1}
                  className="custom-scrollbar max-h-[74px] min-h-[34px] flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-xs text-[#e1f2ff] placeholder:text-[#84b4e0] outline-none"
                />
                {store.isResponding ? (
                  <button
                    type="button"
                    onClick={store.stopResponding}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-[#7dbfff] bg-[#2a5f96] px-3 text-xs font-semibold text-[#eaf6ff] shadow-[0_8px_18px_rgba(10,54,108,0.36)] transition hover:translate-y-[-1px]"
                  >
                    <Square size={11} />
                    停止
                  </button>
                ) : (
                  <button type="button" onClick={submit} className="ai-dock-send-button inline-flex h-9 items-center gap-1 rounded-full border border-[#57adff] px-3 text-xs font-semibold text-[#eff8ff]">
                    <Send size={13} />
                    发送
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {sizeMode !== 'max' && (
        <>
          <div className="absolute left-0 top-[56px] bottom-0 w-2 cursor-ew-resize opacity-0" onMouseDown={startResize('left')} />
          <div className="absolute right-0 top-[56px] bottom-0 w-2 cursor-ew-resize opacity-0" onMouseDown={startResize('right')} />
          <div className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0" onMouseDown={startResize('top')} />
          <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0" onMouseDown={startResize('bottom')} />
          <div className="absolute left-0 top-0 h-3 w-3 cursor-nwse-resize opacity-0" onMouseDown={startResize('topLeft')} />
          <div className="absolute right-0 top-0 h-3 w-3 cursor-nesw-resize opacity-0" onMouseDown={startResize('topRight')} />
          <div className="absolute left-0 bottom-0 h-3 w-3 cursor-nesw-resize opacity-0" onMouseDown={startResize('bottomLeft')} />
          <div className="absolute right-0 bottom-0 h-3 w-3 cursor-nwse-resize opacity-0" onMouseDown={startResize('bottomRight')} />
        </>
      )}
    </div>
  );
};
