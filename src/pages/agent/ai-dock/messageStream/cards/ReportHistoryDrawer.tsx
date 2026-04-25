import React from 'react';
import { ReportItem } from '../../../../../mock/assistant';

interface ReportHistoryDrawerProps {
  list: ReportItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const ReportHistoryDrawer: React.FC<ReportHistoryDrawerProps> = ({ list, onSelect, onClose }) => {
  const [tab, setTab] = React.useState<'month' | 'week' | 'quarter'>('month');
  const filtered = list.filter((r) => r.periodType === tab);

  return (
    <div className="absolute inset-y-0 right-0 z-[40] w-[360px] border-l border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--sys-border-primary)] px-4 py-3 text-sm font-semibold text-[#dff1ff]">历史报告</div>
        <div className="border-b border-[var(--sys-border-primary)] px-3 py-2">
          <div className="flex gap-2">
            {[
              { key: 'month', label: '月报' },
              { key: 'week', label: '周报' },
              { key: 'quarter', label: '季报' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key as 'month' | 'week' | 'quarter')}
                className={`rounded-full px-2 py-1 text-[11px] ${
                  tab === item.key
                    ? 'bg-[#185292] text-[#e8f5ff]'
                    : 'bg-[#123f74] text-[#b7daff]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2 custom-scrollbar">
          {filtered.map((r) => (
            <button
              type="button"
              key={r.id}
              className="w-full rounded border border-[var(--sys-border-primary)] bg-[#103f74] px-3 py-2 text-left hover:bg-[#165394]"
              onClick={() => onSelect(r.id)}
            >
              <div className="text-xs font-semibold text-[#d8edff]">{r.title}</div>
              <div className="mt-1 text-[11px] text-[var(--sys-text-secondary)] line-clamp-2">{r.summary}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded border border-[var(--sys-border-primary)] bg-[#103f74] px-3 py-2 text-[11px] text-[var(--sys-text-secondary)]">
              暂无该类型报告
            </div>
          )}
        </div>
        <div className="border-t border-[var(--sys-border-primary)] p-3">
          <button type="button" onClick={onClose} className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#113f72] py-1.5 text-xs text-[#d7ecff]">关闭</button>
        </div>
      </div>
    </div>
  );
};
