import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Layers3 } from 'lucide-react';
import { CardActionBar } from './CardActionBar';

type BusinessQueryItem = {
  id: string;
  name: string;
  site: string;
  region: string;
  bandwidth: string;
  updatedAt: string;
  owner: string;
  details: Array<{ label: string; value: string }>;
};

type BusinessQueryCategory = {
  code: string;
  label: string;
  items: BusinessQueryItem[];
};

interface BusinessQueryCardProps {
  categories: BusinessQueryCategory[];
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

const PAGE_SIZE = 14;
const STREAM_STEP = 1;
type QueryFlowPhase = 'boot' | 'summary' | 'types' | 'list' | 'done';
type QueryFlowStatus = 'running' | 'done';
type QueryFlowLog = { time: string; text: string };
type QueryFlowState = {
  phase: QueryFlowPhase;
  status: QueryFlowStatus;
  logs: QueryFlowLog[];
};

const getCategoryTone = (code: string, active: boolean) => {
  const tone = {
    LINE: active
      ? 'border-[#58b8ff] bg-[#1f5b88] text-[#ecf7ff]'
      : 'border-[#2f5e8b] bg-[#173c63] text-[#b9d7f1]',
    '5G': active
      ? 'border-[#51d6c9] bg-[#1f5f61] text-[#e9fffd]'
      : 'border-[#2e6570] bg-[#153f49] text-[#b5d7e1]',
    IDC: active
      ? 'border-[#ffc27a] bg-[#6b502f] text-[#fff3e3]'
      : 'border-[#785f3f] bg-[#4b3a27] text-[#d9cbb7]',
    SDWAN: active
      ? 'border-[#9fa4ff] bg-[#3f4a95] text-[#eef0ff]'
      : 'border-[#515da6] bg-[#2f3a77] text-[#c8cdef]',
    AIC: active
      ? 'border-[#81d892] bg-[#2f6540] text-[#ebffef]'
      : 'border-[#457856] bg-[#264f34] text-[#c5dfcd]',
  } as const;

  return tone[code as keyof typeof tone] || (active
    ? 'border-[#58b8ff] bg-[#1f5b88] text-[#ecf7ff]'
    : 'border-[#2f5e8b] bg-[#173c63] text-[#b9d7f1]');
};

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const nowFlowTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const BusinessQueryCard: React.FC<BusinessQueryCardProps> = ({ categories, onCopy, onAsk }) => {
  const [activeCode, setActiveCode] = useState(categories[0]?.code || '');
  const [expandedItemId, setExpandedItemId] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [streamedCount, setStreamedCount] = useState(0);

  const [overviewText, setOverviewText] = useState('');
  const [typeText, setTypeText] = useState('');
  const [regionText, setRegionText] = useState('');
  const [chipVisibleCount, setChipVisibleCount] = useState(0);
  const [listEnabled, setListEnabled] = useState(false);
  const [showTypeSection, setShowTypeSection] = useState(false);
  const [showListSection, setShowListSection] = useState(false);
  const [flow, setFlow] = useState<QueryFlowState>({
    phase: 'boot',
    status: 'running',
    logs: [{ time: nowFlowTime(), text: '开始执行业务清单查询' }],
  });

  const appendFlowLog = (text: string, patch?: Partial<QueryFlowState>) => {
    setFlow((prev) => ({
      ...prev,
      ...patch,
      logs: [...prev.logs, { time: nowFlowTime(), text }],
    }));
  };

  const activeCategory = useMemo(
    () => categories.find((c) => c.code === activeCode) || categories[0],
    [activeCode, categories]
  );

  const totalCount = useMemo(() => categories.reduce((sum, c) => sum + c.items.length, 0), [categories]);

  const summary = useMemo(() => {
    const typeLines = categories
      .map((c) => `${c.label}${c.items.length}条`)
      .join('、');

    const regionCount = new Map<string, number>();
    categories.forEach((c) => {
      c.items.forEach((item) => {
        regionCount.set(item.region, (regionCount.get(item.region) || 0) + 1);
      });
    });

    const topRegions = Array.from(regionCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([region, count]) => `${region}（${count}）`)
      .join('、');

    return {
      overview: `已为您检索到 ${categories.length} 类业务，共 ${totalCount} 条。`,
      typeLine: `类型分布：${typeLines}`,
      regionLine: `主要区域：${topRegions || '暂无'}`,
    };
  }, [categories, totalCount]);

  useEffect(() => {
    let cancelled = false;
    const runText = async (full: string, setter: (v: string) => void) => {
      let current = '';
      for (const ch of full) {
        if (cancelled) return;
        current += ch;
        setter(`${current}▌`);
        const wait = /[，。；、]/.test(ch) ? 115 : 36 + Math.floor(Math.random() * 22);
        await sleep(wait);
      }
      if (!cancelled) setter(full);
    };

    const boot = async () => {
      setFlow({
        phase: 'summary',
        status: 'running',
        logs: [{ time: nowFlowTime(), text: '开始执行业务清单查询' }],
      });
      setOverviewText('');
      setTypeText('');
      setRegionText('');
      setChipVisibleCount(0);
      setListEnabled(false);
      setShowTypeSection(false);
      setShowListSection(false);
      setStreamedCount(0);

      appendFlowLog('进入摘要生成阶段', { phase: 'summary' });
      await runText(summary.overview, setOverviewText);
      if (cancelled) return;
      await sleep(140);
      await runText(summary.typeLine, setTypeText);
      if (cancelled) return;
      await sleep(120);
      await runText(summary.regionLine, setRegionText);
      if (cancelled) return;
      appendFlowLog('摘要生成完成，进入类型分布阶段', { phase: 'types' });
      setShowTypeSection(true);

      for (let i = 1; i <= categories.length; i += 1) {
        setChipVisibleCount(i);
        await sleep(85 + Math.floor(Math.random() * 50));
        if (cancelled) return;
      }

      setShowListSection(true);
      setListEnabled(true);
      setStreamedCount(STREAM_STEP);
      appendFlowLog('业务清单加载开始', { phase: 'list' });
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [categories, summary.overview, summary.regionLine, summary.typeLine]);

  useEffect(() => {
    if (!listEnabled) return;
    setVisibleCount(PAGE_SIZE);
    setStreamedCount(STREAM_STEP);
    setExpandedItemId('');
  }, [activeCode, listEnabled]);

  const targetItems = useMemo(
    () => (activeCategory?.items || []).slice(0, visibleCount),
    [activeCategory?.items, visibleCount]
  );

  useEffect(() => {
    if (!listEnabled) return;
    if (!targetItems.length) return;
    if (streamedCount >= targetItems.length) return;

    const timer = window.setTimeout(() => {
      setStreamedCount((prev) => Math.min(prev + STREAM_STEP, targetItems.length));
    }, 170 + Math.floor(Math.random() * 130));

    return () => window.clearTimeout(timer);
  }, [listEnabled, streamedCount, targetItems.length]);

  const streamedItems = targetItems.slice(0, streamedCount);

  useEffect(() => {
    if (!listEnabled) return;
    if (streamedCount <= 0) return;
    if (streamedCount >= targetItems.length && visibleCount >= (activeCategory?.items.length || 0)) {
      setFlow((prev) => {
        if (prev.status === 'done') return prev;
        return {
          ...prev,
          phase: 'done',
          status: 'done',
          logs: [...prev.logs, { time: nowFlowTime(), text: '业务清单加载完成' }],
        };
      });
    }
  }, [activeCategory?.items.length, listEnabled, streamedCount, targetItems.length, visibleCount]);

  return (
    <section className="rounded-2xl border border-[#3e77ad] bg-[linear-gradient(165deg,#123a66_0%,#10355d_100%)] p-3 shadow-[0_12px_26px_rgba(6,27,57,0.35)]">
      <header className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[#5faee9] bg-[#1e5789] text-[#d9efff]">
            <Layers3 size={13} />
          </span>
          <span className="text-sm font-semibold text-[#dcedff]">业务查询结果</span>
        </div>
        <span className="rounded-full border border-[#3972a8] bg-[#133e6a] px-2 py-0.5 text-[11px] text-[#9fc9ea]">
          {categories.length} 类 / {totalCount} 条
        </span>
      </header>
      <div className="mb-2 rounded-xl border border-[#2f679d] bg-[#0f3358] p-2">
        <div className="mb-1 text-[11px] text-[#90bce0]">查询总结</div>
        <div className="space-y-0.5 text-[11px] leading-5 text-[#cfe5fa]">
          <div>{overviewText || '▌'}</div>
          <div>{typeText || (overviewText ? '▌' : '')}</div>
          <div>{regionText || (typeText ? '▌' : '')}</div>
        </div>
      </div>
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制总结',
            onClick: () => onCopy?.([summary.overview, summary.typeLine, summary.regionLine].join('\n')),
          },
          {
            key: 'ask-overview',
            label: '生成业务概览',
            onClick: () => onAsk?.('基于当前业务清单，给我一份业务概览和重点建议'),
          },
          {
            key: 'ask-detail',
            label: '分析当前类型',
            tone: 'primary',
            onClick: () => onAsk?.(`请针对${activeCategory?.label || '当前类型'}业务做风险和优化建议`),
          },
        ]}
      />

      {showTypeSection && (
        <div className="mb-2 rounded-xl border border-[#2f679d] bg-[#0f3358] p-2">
          <div className="mb-1 text-[11px] text-[#90bce0]">业务类型</div>
          <div className="custom-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {categories.slice(0, chipVisibleCount).map((c) => {
              const active = c.code === activeCode;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setActiveCode(c.code);
                    appendFlowLog(`切换到业务类型：${c.label}`, { phase: 'list' });
                  }}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${getCategoryTone(c.code, active)}`}
                >
                  {c.label}（{c.items.length}）
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showListSection && (
        <div className="rounded-xl border border-[#2f679d] bg-[#0f3358] p-2">
          <div className="mb-1 text-[11px] text-[#90bce0]">业务清单（点击展开详情）</div>

          <div
            className="custom-scrollbar min-h-[260px] max-h-[320px] space-y-1.5 overflow-auto pr-1"
            onScroll={(e) => {
              const t = e.currentTarget;
              const nearBottom = t.scrollTop + t.clientHeight >= t.scrollHeight - 28;
              if (nearBottom && listEnabled) {
                setVisibleCount((prev) => {
                  const next = Math.min(prev + PAGE_SIZE, activeCategory?.items.length || prev);
                  if (next > prev) {
                    appendFlowLog(`继续加载清单：${next}/${activeCategory?.items.length || next}`, { phase: 'list' });
                  }
                  return next;
                });
              }
            }}
          >
            {streamedItems.map((item) => {
              const expanded = expandedItemId === item.id;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-[#34658f] bg-[rgba(22,64,98,0.45)]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedItemId(expanded ? '' : item.id)}
                    className="w-full px-2.5 py-2 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-[#e9f4ff]">{item.name}</div>
                        <div className="mt-0.5 truncate text-[10px] text-[#a9ccea]">{item.id} · {item.site} · {item.region}</div>
                      </div>
                      <ChevronDown size={13} className={`text-[#9fc8ea] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                {expanded && (
                  <div className="border-t border-white/10 bg-[rgba(30,78,114,0.38)] px-2.5 pb-2 pt-1.5">
                    <div className="mb-1 text-[10px] text-[#9ec2e2]">业务详情 · {activeCategory?.label || '-'}</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#d7ecff]">
                      {item.details.map((field) => (
                        <div key={field.label} className="col-span-1 truncate">
                          <span className="text-[#9ec2e2]">{field.label}：</span>
                          {field.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </article>
              );
            })}

            {listEnabled && streamedCount < targetItems.length && streamedItems.length > 0 && (
              <div className="animate-pulse rounded-lg border border-[#2f5d86] bg-[rgba(20,58,88,0.4)] px-2.5 py-2">
                <div className="h-2.5 w-40 rounded bg-[#2f628f]" />
                <div className="mt-2 h-2 w-60 rounded bg-[#2a567f]" />
              </div>
            )}

            {listEnabled && visibleCount < (activeCategory?.items.length || 0) && streamedCount >= targetItems.length && (
              <div className="py-1 text-center text-[10px] text-[#84b6df]">下拉加载更多...</div>
            )}
            {listEnabled && visibleCount >= (activeCategory?.items.length || 0) && streamedCount >= targetItems.length && (activeCategory?.items.length || 0) > 0 && (
              <div className="py-1 text-center text-[10px] text-[#6fa0c9]">已加载全部</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
