import React from 'react';
import { Activity, Cpu } from 'lucide-react';
import { CardActionBar } from './CardActionBar';

interface DiagnosisProgressProps {
  title: string;
  progress: number;
  step: string;
  running: boolean;
  status?: 'running' | 'done' | 'stopped' | string;
  logs?: Array<{ time: string; text: string }>;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const DiagnosisProgress: React.FC<DiagnosisProgressProps> = ({ title, progress, step, running, status, logs = [], onCopy, onAsk }) => {
  const statusText = status === 'stopped' ? '已停止' : running ? `分析中 ${progress}%` : '分析完成';
  const statusTone =
    status === 'stopped'
      ? 'border-[#c88383] bg-[#5a2733] text-[#ffd7d7]'
      : running
        ? 'border-[#5caee8] bg-[#1a4f82] text-[#dff2ff]'
        : 'border-[#54ba95] bg-[#1e5d4a] text-[#dfffee]';
  const stageLines = logs.length
    ? logs.map((line) => `${line.time} ${line.text}`)
    : [step || '等待任务开始'];

  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.24)]">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ddf1ff]">
          <Cpu size={14} className={running ? 'ai-dock-spin text-[#9fd8ff]' : 'text-[#9fd8ff]'} />
          {title}
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${statusTone}`}>
          {running && <i className="ai-dock-phase-ping inline-block h-1.5 w-1.5 rounded-full bg-current" />}
          {statusText}
        </div>
      </div>
      <div className="mt-1 text-xs text-[var(--sys-text-secondary)]">{step}</div>
      <div className="mt-2 h-2 rounded-full bg-[#0d315f]">
        <div className="h-2 rounded-full bg-gradient-to-r from-[#2f81d9] to-[#68beff] transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-[#9fcfff]">{statusText}</div>

      <div className="mt-2 space-y-1 rounded-lg border border-[#2d6595] bg-[rgba(14,52,90,0.55)] p-2">
        {stageLines.map((line, index) => (
          <div key={`${line}_${index}`} className="flex items-start gap-1.5 text-[11px] text-[#cfe6fb]">
            <Activity size={10} className="mt-[2px] shrink-0 text-[#7fc2f5]" />
            <span>{line}</span>
          </div>
        ))}
      </div>

      <CardActionBar
        actions={[
          {
            key: 'ask',
            label: running ? '解读当前阶段' : '生成处置建议',
            tone: 'primary',
            onClick: () =>
              onAsk?.(
                running
                  ? `诊断正在进行：${step}，请解释这个阶段在做什么`
                  : `诊断已完成（${title}），请生成下一步处置建议`
              ),
          },
          ...(onCopy
            ? [{
                key: 'copy',
                label: '复制进度',
                onClick: () => onCopy?.([`诊断任务：${title}`, `状态：${statusText}`, ...stageLines].join('\n')),
              }]
            : []),
        ]}
      />
    </div>
  );
};
