import React, { useMemo, useState } from 'react';
import { BaseChart } from '../../../../../components/BaseChart';
import { ReportItem } from '../../mocks/reports';
import { ManagedBusiness } from '../../mocks/businesses';
import { BarChart3 } from 'lucide-react';
import { CardActionBar } from './CardActionBar';

interface ReportCardProps {
  report: ReportItem;
  businesses: ManagedBusiness[];
  onOpenHistory: () => void;
  onExport: (type: 'pdf' | 'image') => void;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, businesses, onOpenHistory, onExport, onCopy, onAsk }) => {
  const [expanded, setExpanded] = useState(false);

  const option = useMemo(() => ({
    legend: { top: 0, data: ['本期', '上期', '同期'] },
    grid: { top: 26, left: 22, right: 12, bottom: 20 },
    xAxis: { type: 'category', data: report.trend.map((i) => i.day) },
    yAxis: { type: 'value' },
    series: [
      { name: '本期', type: 'line', data: report.trend.map((i) => Number(i.current.toFixed(2))), lineStyle: { color: '#34d3ff' } },
      { name: '上期', type: 'line', data: report.trend.map((i) => Number(i.prev.toFixed(2))), lineStyle: { color: '#79b2ff' } },
      { name: '同期', type: 'line', data: report.trend.map((i) => Number(i.yoy.toFixed(2))), lineStyle: { color: '#9f7dff' } },
    ],
  }), [report]);

  return (
    <div className="rounded-xl border border-[#4f7ec0] bg-[#244f8b] p-4 shadow-[0_12px_24px_rgba(8,33,71,0.32)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#edf7ff]">
          <BarChart3 size={16} className="text-[#96ddff]" />
          {report.title}
        </div>
        <span className="rounded-full border border-[rgba(179,228,255,0.5)] bg-[rgba(24,86,132,0.36)] px-1.5 py-0.5 text-[10px] text-[#b9ddf8]">运行分析</span>
      </div>
      <p className="mt-1 text-xs text-[#d3e8f9]">{report.summary}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {report.metrics.map((m, idx) => (
          <div
            key={m.label}
            className={`rounded border px-2 py-1 text-[11px] shadow-[inset_0_1px_0_rgba(189,230,255,0.15)] ${
              idx % 3 === 0
                ? 'border-[#4c87bb] bg-[rgba(19,87,135,0.48)] text-[#d9efff]'
                : idx % 3 === 1
                  ? 'border-[#5b7ec8] bg-[rgba(45,78,144,0.48)] text-[#dde7ff]'
                  : 'border-[#4f9e88] bg-[rgba(23,109,102,0.4)] text-[#d6fff6]'
            }`}
          >
            <span className="text-[#a8c8e6]">{m.label}</span>
            <div className="font-semibold">{m.value}</div>
          </div>
        ))}
      </div>
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制摘要',
            onClick: () => onCopy?.(`${report.title}\n${report.summary}`),
          },
          {
            key: 'ask',
            label: '生成解读',
            onClick: () => onAsk?.(`请解读《${report.title}》，给出重点结论和建议`),
          },
          {
            key: 'expand',
            label: expanded ? '收起全文' : '查看全文',
            tone: 'primary',
            onClick: () => setExpanded((v) => !v),
          },
          {
            key: 'history',
            label: '历史报告',
            onClick: onOpenHistory,
          },
        ]}
      />

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-[#5a84be] pt-3">
          <div>
            <div className="mb-1 text-[11px] text-[#bfe1ff]">业务运行情况</div>
            <div className="space-y-1.5">
              {businesses.map((b) => (
                <div key={b.id} className="rounded border border-[#4f7cb7] bg-[rgba(16,67,117,0.52)] px-2 py-1.5 text-[11px] text-[#d6ecff]">
                  <div className="flex items-center justify-between">
                    <span>{b.name}</span>
                    <span className="inline-flex items-center gap-1">
                      <i
                        className={`h-1.5 w-1.5 rounded-full ${
                          b.status === 'danger' ? 'bg-[#ff6b7d]' : b.status === 'warning' ? 'bg-[#ffb347]' : 'bg-[#38d39f]'
                        }`}
                      />
                      {b.onlineRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-[#acc9e4]">时延 {b.latency}ms · 丢包 {b.loss}%</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] text-[#bfe1ff]">关键事件</div>
            <div className="space-y-1 text-xs text-[#c4d9ed]">
              {report.events.map((e) => (
                <div key={`${e.time}_${e.text}`}>• {e.time} · {e.text}</div>
              ))}
            </div>
          </div>
          <div className="h-[160px] rounded border border-[#5a82bd] bg-[rgba(13,55,103,0.58)] p-2">
            <BaseChart option={option} />
          </div>
          <div>
            <div className="mb-1 text-[11px] text-[#bfe1ff]">后续建议</div>
            <div className="space-y-1 text-xs text-[#c4d9ed]">
              {report.suggestions.map((s) => <div key={s}>• {s}</div>)}
            </div>
          </div>
          <CardActionBar
            actions={[
              { key: 'pdf', label: '导出 PDF', tone: 'primary', onClick: () => onExport('pdf') },
              { key: 'image', label: '导出长图', onClick: () => onExport('image') },
            ]}
          />
        </div>
      )}
    </div>
  );
};
