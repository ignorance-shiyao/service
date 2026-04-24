import React, { useMemo, useState } from 'react';
import { CheckSquare, ChevronRight, Stethoscope } from 'lucide-react';
import { BusinessDiagnosisTarget } from '../../store/useAiDock';
import { CardActionBar } from './CardActionBar';

type BusinessQueryItem = BusinessDiagnosisTarget['item'];

type BusinessQueryCategory = {
  code: BusinessDiagnosisTarget['code'];
  label: string;
  items: BusinessQueryItem[];
};

interface BusinessDiagnosisSelectCardProps {
  categories: BusinessQueryCategory[];
  onSubmit: (targets: BusinessDiagnosisTarget[]) => void;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const BusinessDiagnosisSelectCard: React.FC<BusinessDiagnosisSelectCardProps> = ({ categories, onSubmit, onCopy, onAsk }) => {
  const [activeCode, setActiveCode] = useState(categories[0]?.code || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const activeCategory = categories.find((item) => item.code === activeCode) || categories[0];

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

  const selectVisible = () => {
    const visibleIds = activeCategory?.items.slice(0, 12).map((item) => item.id) || [];
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e3f3ff]">
          <Stethoscope size={14} className="text-[#9bd4ff]" />
          选择体检业务
        </div>
        <span className="rounded-full border border-[#3972a8] bg-[#133e6a] px-2 py-0.5 text-[10px] text-[#bfe1ff]">
          已选 {selectedTargets.length}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-[116px_1fr] gap-2">
        <div className="custom-scrollbar max-h-[286px] space-y-1 overflow-y-auto pr-1">
          {categories.map((category) => {
            const active = category.code === activeCode;
            const count = selectedIds.filter((id) => category.items.some((item) => item.id === id)).length;
            return (
              <button
                key={category.code}
                type="button"
                onClick={() => setActiveCode(category.code)}
                className={`flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-[11px] ${
                  active ? 'border-[#60b6f4] bg-[#1a568f] text-[#eff8ff]' : 'border-[#315f89] bg-[#123b63] text-[#a9cdea]'
                }`}
              >
                <span className="truncate">{category.label}</span>
                <span className="ml-1 inline-flex items-center gap-1 text-[10px]">
                  {count > 0 ? count : category.items.length}
                  <ChevronRight size={10} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-[#2f679d] bg-[#0f3358] p-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[11px] text-[#a7cdec]">{activeCategory?.label || '业务清单'}</div>
            <button type="button" onClick={selectVisible} className="text-[10px] text-[#88d6ff] hover:text-[#e8f7ff]">
              选中前12条
            </button>
          </div>
          <div className="custom-scrollbar max-h-[246px] space-y-1 overflow-y-auto pr-1">
            {(activeCategory?.items.slice(0, 36) || []).map((item) => {
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
            label: '推荐体检范围',
            onClick: () => onAsk?.('请根据业务重要性推荐本次业务体检范围'),
          },
          {
            key: 'submit',
            label: '开始体检',
            tone: 'primary',
            onClick: () => selectedTargets.length > 0 && onSubmit(selectedTargets),
          },
        ]}
      />
    </div>
  );
};

