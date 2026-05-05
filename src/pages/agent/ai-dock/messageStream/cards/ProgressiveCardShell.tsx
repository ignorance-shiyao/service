import React, { useEffect, useMemo, useState } from 'react';
import { AiMessage } from '../../store/useAiDock';

interface ProgressiveCardShellProps {
  message: AiMessage;
  children: React.ReactNode;
}

const PHASE_MAP: Partial<Record<AiMessage['kind'], string[]>> = {
  businessQuery: ['识别查询范围', '聚合业务清单', '生成结构化结果'],
  reportCard: ['分析业务指标', '提取风险趋势', '整理报告视图'],
  qa: ['理解问题语义', '检索关联知识', '组织可读结论'],
  knowledgeCard: ['定位知识条目', '提炼核心摘要', '构建阅读卡片'],
  diagnosisSelect: ['识别诊断意图', '筛选可诊断业务', '准备诊断入口'],
  diagnosisReport: ['汇总检测结果', '分析根因线索', '生成诊断结论'],
  ticketCard: ['提取工单上下文', '同步处理状态', '组装工单卡片'],
  faultForm: ['匹配报障模板', '填充业务上下文', '准备提交流程'],
  fallback: ['理解输入问题', '检索可用信息', '整理处理建议'],
};

const TIMELINE_MAP: Partial<Record<AiMessage['kind'], [number, number, number]>> = {
  businessQuery: [560, 1680, 3380],
  reportCard: [520, 1520, 3120],
  qa: [460, 1350, 2740],
  knowledgeCard: [460, 1340, 2720],
  diagnosisSelect: [520, 1480, 2980],
  diagnosisReport: [560, 1600, 3240],
  ticketCard: [500, 1420, 2860],
  faultForm: [500, 1460, 2920],
  fallback: [420, 1200, 2480],
};

const hashMs = (id: string, base: number, span: number) => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return base + (h % span);
};

export const ProgressiveCardShell: React.FC<ProgressiveCardShellProps> = ({ message, children }) => {
  const phases = useMemo(() => PHASE_MAP[message.kind] || ['理解问题上下文', '检索关联数据', '整理输出结构'], [message.kind]);
  const timeline = useMemo(() => TIMELINE_MAP[message.kind] || [500, 1400, 2860], [message.kind]);
  const shouldRenderFinalImmediately = Date.now() - message.createdAt > 8_000;
  const [stage, setStage] = useState(() => (shouldRenderFinalImmediately ? 3 : 0));

  useEffect(() => {
    if (shouldRenderFinalImmediately) {
      setStage(3);
      return;
    }
    setStage(0);
    const t1 = window.setTimeout(() => setStage(1), hashMs(message.id, timeline[0], 210));
    const t2 = window.setTimeout(() => setStage(2), hashMs(message.id, timeline[1], 280));
    const t3 = window.setTimeout(() => setStage(3), hashMs(message.id, timeline[2], 420));
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [message.id, shouldRenderFinalImmediately, timeline]);

  if (stage >= 3) {
    return <div className="ai-dock-card-reveal">{children}</div>;
  }

  return (
    <div className="rounded-xl border border-[#3f7ab0] bg-[linear-gradient(165deg,rgba(18,57,95,0.96)_0%,rgba(15,45,78,0.96)_100%)] px-3 py-2.5 shadow-[0_10px_22px_rgba(4,22,50,0.32)]">
      <div className="mb-1 text-[10px] text-[#8fc1e7]">智能分析中</div>
      <div className="space-y-1.5">
        {phases.map((label, i) => {
          const done = stage > i;
          const active = stage === i;
          return (
            <div key={label} className="flex items-center gap-2 text-[11px]">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${done ? 'bg-[#4ed8a8]' : active ? 'bg-[#7ec8ff] ai-dock-phase-ping' : 'bg-[#3f6f96]'}`}
              />
              <span className={done ? 'text-[#cfe8ff]' : active ? 'text-[#b9dcf9]' : 'text-[#6f98bd]'}>{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#15395f]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#55b8ff_0%,#5bd4d9_55%,#63d9a8_100%)] transition-all duration-300"
          style={{ width: `${Math.max(16, stage * 32)}%` }}
        />
      </div>
    </div>
  );
};
