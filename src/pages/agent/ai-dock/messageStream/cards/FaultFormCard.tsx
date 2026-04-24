import React, { useState } from 'react';
import { MapPin, RadioTower, Wrench } from 'lucide-react';
import { FaultContext } from '../../store/useAiDock';
import { CardActionBar } from './CardActionBar';

type FaultBusinessOption = {
  id: string;
  label: string;
  value: string;
  type: string;
  region: string;
  site: string;
};

interface FaultFormCardProps {
  defaultTitle: string;
  defaultBusiness: string;
  defaultDesc?: string;
  defaultSeverity?: string;
  context?: FaultContext | null;
  businessOptions?: FaultBusinessOption[];
  fromDiagnosis?: boolean;
  onSubmit: (payload: { title: string; business: string; desc: string; severity: string }) => void;
}

export const FaultFormCard: React.FC<FaultFormCardProps> = ({
  defaultTitle,
  defaultBusiness,
  defaultDesc = '',
  defaultSeverity = '中',
  context,
  businessOptions = [],
  fromDiagnosis,
  onSubmit,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [business, setBusiness] = useState(defaultBusiness);
  const [severity, setSeverity] = useState(defaultSeverity);
  const [desc, setDesc] = useState(defaultDesc);
  const selectedOption = businessOptions.find((option) => option.value === business || option.label === business);

  const applyTemplate = () => {
    const location = context?.region || selectedOption?.region || '客户业务现场';
    const site = context?.site || selectedOption?.site || '业务接入点';
    setDesc(`故障业务：${business}\n故障位置：${location} / ${site}\n现象：今日上午起业务访问明显变慢，部分用户反馈无法稳定连接。\n影响：业务中断时长约10分钟，当前偶发抖动。\n诉求：请协助快速排障并给出恢复建议。`);
    if (!title.trim()) {
      setTitle('业务质量异常排查');
    }
  };

  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3">
      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e4f3ff]">
        <Wrench size={14} className="text-[#9bd4ff]" />
        发起自助报障
      </div>
      {fromDiagnosis && <div className="mt-1 text-[11px] text-[#8fc7ff]">已自动关联诊断/体检上下文</div>}
      {(context || selectedOption) && (
        <div className="mt-2 rounded-lg border border-[#2f679d] bg-[#0f3358] p-2 text-[11px] text-[#d5ebff]">
          <div className="mb-1 flex items-center gap-1 text-[#9ecfff]">
            <RadioTower size={12} />
            报障业务上下文
          </div>
          <div className="truncate">业务：{context?.business || selectedOption?.value || business}</div>
          <div className="mt-0.5 truncate">类型：{context?.businessType || selectedOption?.type || '未指定'}</div>
          <div className="mt-0.5 flex items-start gap-1">
            <MapPin size={11} className="mt-0.5 shrink-0 text-[#83bce9]" />
            <span className="min-w-0 truncate">{context?.region || selectedOption?.region || '未指定区域'} / {context?.site || selectedOption?.site || '未指定站点'}</span>
          </div>
        </div>
      )}
      <div className="mt-2 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#103b70] px-2 py-1 text-xs text-[#dff1ff]" placeholder="标题" />
        {businessOptions.length > 0 ? (
          <select
            value={business}
            onChange={(e) => {
              const next = businessOptions.find((option) => option.value === e.target.value);
              setBusiness(e.target.value);
              if (next && !context) {
                setTitle(`${next.type}${next.region}业务异常报障`);
              }
            }}
            className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#103b70] px-2 py-1 text-xs text-[#dff1ff] outline-none"
          >
            {businessOptions.map((option) => (
              <option key={option.id} value={option.value}>{option.label}｜{option.region}</option>
            ))}
          </select>
        ) : (
          <input value={business} onChange={(e) => setBusiness(e.target.value)} className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#103b70] px-2 py-1 text-xs text-[#dff1ff]" placeholder="业务" />
        )}
        <div className="flex gap-2">
          {['低', '中', '高'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`rounded border px-2 py-1 text-[11px] ${severity === s ? 'border-[#45a6ff] bg-[#165293] text-[#e7f4ff]' : 'border-[var(--sys-border-secondary)] bg-[#123f74] text-[#c3e2ff]'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[72px] w-full rounded border border-[var(--sys-border-secondary)] bg-[#103b70] px-2 py-1 text-xs text-[#dff1ff]" placeholder="请描述问题现象" />
      </div>
      <CardActionBar
        actions={[
          {
            key: 'reset',
            label: '重置表单',
            onClick: () => {
              setTitle(defaultTitle);
              setBusiness(defaultBusiness);
              setSeverity(defaultSeverity);
              setDesc(defaultDesc);
            },
          },
          {
            key: 'template',
            label: '填充示例',
            onClick: applyTemplate,
          },
          {
            key: 'submit',
            label: '提交工单',
            tone: 'primary',
            onClick: () => onSubmit({ title, business, desc, severity }),
          },
        ]}
      />
    </div>
  );
};
