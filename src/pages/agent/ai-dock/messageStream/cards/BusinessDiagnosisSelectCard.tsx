import React, { useEffect, useMemo, useState } from 'react';
import { Check, CheckSquare, ChevronRight, Minus, Square, Stethoscope } from 'lucide-react';
import { BusinessDiagnosisTarget } from '../../store/useAiDock';
import { CardActionBar } from './CardActionBar';

type BusinessQueryItem = BusinessDiagnosisTarget['item'];

type BusinessQueryCategory = {
  code: BusinessDiagnosisTarget['code'];
  label: string;
  items: BusinessQueryItem[];
};

const getCategoryTone = (code: BusinessDiagnosisTarget['code'], active: boolean) => {
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

  return tone[code] || (active
    ? 'border-[#58b8ff] bg-[#1f5b88] text-[#ecf7ff]'
    : 'border-[#2f5e8b] bg-[#173c63] text-[#b9d7f1]');
};

interface BusinessDiagnosisSelectCardProps {
  categories: BusinessQueryCategory[];
  onSubmit: (targets: BusinessDiagnosisTarget[]) => void;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const BusinessDiagnosisSelectCard: React.FC<BusinessDiagnosisSelectCardProps> = ({ categories, onSubmit, onCopy, onAsk }) => {
  const [activeCode, setActiveCode] = useState(categories[0]?.code || '');
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    Array.from(new Set(categories.flatMap((category) => category.items.map((item) => item.id))))
  );
  const [recommendHint, setRecommendHint] = useState('');
  const [typeText, setTypeText] = useState('');
  const [countText, setCountText] = useState('');
  const [showTypeSection, setShowTypeSection] = useState(false);
  const [showListSection, setShowListSection] = useState(false);
  const [chipVisibleCount, setChipVisibleCount] = useState(0);
  const activeCategory = categories.find((item) => item.code === activeCode) || categories[0];
  const activeItems = activeCategory?.items || [];

  const summary = useMemo(() => {
    const typeLine = `可诊断业务类型：${categories.map((c) => c.label).join('、')}。`;
    const countLine = `数量统计：${categories.map((c) => `${c.label}${c.items.length}条`).join('、')}。`;
    return { typeLine, countLine };
  }, [categories]);

  const selectedTargets = useMemo<BusinessDiagnosisTarget[]>(() => {
    return categories.flatMap((category) =>
      category.items
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => ({ code: category.code, label: category.label, item }))
    );
  }, [categories, selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const getCategorySelectedCount = (category: BusinessQueryCategory) =>
    category.items.reduce((count, item) => count + (selectedIds.includes(item.id) ? 1 : 0), 0);

  const toggleCategory = (category: BusinessQueryCategory) => {
    const ids = category.items.map((item) => item.id);
    const selectedCount = getCategorySelectedCount(category);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selectedCount === category.items.length) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return Array.from(next);
    });
  };

  const selectActiveCategory = () => {
    const ids = activeItems.map((item) => item.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearActiveCategory = () => {
    const idSet = new Set(activeItems.map((item) => item.id));
    setSelectedIds((prev) => prev.filter((id) => !idSet.has(id)));
  };

  const recommendSelection = () => {
    const pickedIds = new Set<string>();
    const categoryHints: string[] = [];

    categories.forEach((category) => {
      if (!category.items.length) return;
      const baseRatio =
        category.code === 'LINE' ? 0.42 :
        category.code === '5G' ? 0.34 :
        category.code === 'SDWAN' ? 0.31 :
        category.code === 'IDC' ? 0.27 : 0.24;
      const ratio = Math.min(0.65, Math.max(0.18, baseRatio + (Math.random() - 0.5) * 0.16));
      const minPick = category.code === 'LINE' ? Math.min(3, category.items.length) : 1;
      const target = Math.max(minPick, Math.min(category.items.length, Math.round(category.items.length * ratio)));
      const shuffled = [...category.items].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, target);
      selected.forEach((item) => pickedIds.add(item.id));
      categoryHints.push(`${category.label}${selected.length}条`);
    });

    const result = Array.from(pickedIds);
    setSelectedIds(result);
    const firstCode = categories.find((category) => category.items.some((item) => pickedIds.has(item.id)))?.code;
    if (firstCode) setActiveCode(firstCode);
    setRecommendHint(`已按业务重要性推荐：${categoryHints.join('、')}，共 ${result.length} 条。可继续手动调整后再开始诊断。`);
  };

  useEffect(() => {
    setSelectedIds(Array.from(new Set(categories.flatMap((category) => category.items.map((item) => item.id)))));
    setRecommendHint('');
    if (!categories.some((category) => category.code === activeCode)) {
      setActiveCode(categories[0]?.code || '');
    }
  }, [categories, activeCode]);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
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
      setTypeText('');
      setCountText('');
      setShowTypeSection(false);
      setShowListSection(false);
      setChipVisibleCount(0);
      await runText(summary.typeLine, setTypeText);
      if (cancelled) return;
      await sleep(140);
      await runText(summary.countLine, setCountText);
      if (cancelled) return;
      setShowTypeSection(true);
      for (let i = 1; i <= categories.length; i += 1) {
        setChipVisibleCount(i);
        await sleep(80 + Math.floor(Math.random() * 45));
        if (cancelled) return;
      }
      setShowListSection(true);
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [categories, summary.countLine, summary.typeLine]);

  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e3f3ff]">
          <Stethoscope size={14} className="text-[#9bd4ff]" />
          选择诊断业务
        </div>
        <span className="rounded-full border border-[#3972a8] bg-[#133e6a] px-2 py-0.5 text-[10px] text-[#bfe1ff]">
          已选 {selectedTargets.length}
        </span>
      </div>

      <div className="mt-2 rounded-lg border border-[#2f679d] bg-[#0f3358] p-2">
        <div className="mb-1 text-[11px] text-[#90bce0]">业务类型与数量</div>
        <div className="space-y-0.5 text-[11px] leading-5 text-[#cfe5fa]">
          <div>{typeText || '▌'}</div>
          <div>{countText || (typeText ? '▌' : '')}</div>
        </div>
        {recommendHint && (
          <div className="mt-1.5 rounded-md border border-[#3b7eb6] bg-[#184a74] px-2 py-1 text-[10px] leading-4 text-[#d7efff]">
            {recommendHint}
          </div>
        )}
      </div>

      <div className="mt-2 space-y-2">
        {showTypeSection && (
        <div className="rounded-lg border border-[#2f679d] bg-[#0f3358] p-2">
          <div className="mb-1 text-[11px] text-[#a7cdec]">业务类型</div>
          <div className="custom-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {categories.slice(0, chipVisibleCount).map((category) => {
            const active = category.code === activeCode;
            const count = getCategorySelectedCount(category);
            const allChecked = count === category.items.length && category.items.length > 0;
            const partialChecked = count > 0 && !allChecked;
            return (
              <button
                key={category.code}
                type="button"
                onClick={() => setActiveCode(category.code)}
                className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-1.5 text-left text-[11px] ${getCategoryTone(category.code, active)}`}
              >
                <span
                  role="checkbox"
                  aria-checked={allChecked ? true : partialChecked ? 'mixed' : false}
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCategory(category);
                    }
                  }}
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    allChecked || partialChecked ? 'border-[#7bd1ff] bg-[#1f6fa4] text-[#eaffff]' : 'border-[#547fa5] bg-[#10385f] text-[#7ca8cc]'
                  }`}
                  title={allChecked ? '取消选择该类型全部业务' : '选择该类型全部业务'}
                >
                  {allChecked ? <Check size={11} /> : partialChecked ? <Minus size={11} /> : <Square size={10} />}
                </span>
                <span className="flex min-w-0 items-center gap-1">
                  <span className="truncate">{category.label}</span>
                  <span className="inline-flex items-center gap-1 text-[10px]">
                  {count}/{category.items.length}
                  </span>
                </span>
              </button>
            );
          })}
          </div>
        </div>
        )}

        {showListSection && (
        <div className="rounded-lg border border-[#2f679d] bg-[#0f3358] p-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[11px] text-[#a7cdec]">
              {activeCategory?.label || '业务清单'}（{activeCategory ? getCategorySelectedCount(activeCategory) : 0}/{activeItems.length}）
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={selectActiveCategory} className="text-[10px] text-[#88d6ff] hover:text-[#e8f7ff]">
                全选本类
              </button>
              <button type="button" onClick={clearActiveCategory} className="text-[10px] text-[#9fbfdb] hover:text-[#e8f7ff]">
                清空本类
              </button>
            </div>
          </div>
          <div className="custom-scrollbar max-h-[246px] space-y-1 overflow-y-auto pr-1">
            {activeItems.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`w-full rounded-md border px-2 py-1.5 text-left ${
                    checked ? 'border-[#61c7ff] bg-[#1b5d8f]' : 'border-[#2f5d86] bg-[rgba(20,58,88,0.55)]'
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <CheckSquare size={13} className={checked ? 'mt-0.5 text-[#8fe4ff]' : 'mt-0.5 text-[#6d95b9]'} />
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-medium text-[#e8f4ff]">{item.name}</div>
                      <div className="mt-0.5 truncate text-[10px] text-[#9fc4e4]">{item.region} · {item.site}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        )}
      </div>

      <CardActionBar
        actions={[
          {
            key: 'clear',
            label: '清空选择',
            onClick: () => setSelectedIds([]),
          },
          {
            key: 'copy',
            label: '复制已选',
            onClick: () => onCopy?.(selectedTargets.map((item) => `${item.label}：${item.item.name}`).join('\n') || '未选择业务'),
          },
          {
            key: 'ask',
            label: '推荐诊断范围',
            onClick: recommendSelection,
          },
          {
            key: 'submit',
            label: '开始诊断',
            tone: 'primary',
            onClick: () => selectedTargets.length > 0 && onSubmit(selectedTargets),
          },
        ]}
      />
    </div>
  );
};
