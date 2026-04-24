import React, { useState } from 'react';
import { CardActionBar } from './CardActionBar';

interface FaultFormCardProps {
  defaultTitle: string;
  defaultBusiness: string;
  fromDiagnosis?: boolean;
  onSubmit: (payload: { title: string; business: string; desc: string; severity: string }) => void;
}

export const FaultFormCard: React.FC<FaultFormCardProps> = ({ defaultTitle, defaultBusiness, fromDiagnosis, onSubmit }) => {
  const [title, setTitle] = useState(defaultTitle);
  const [business, setBusiness] = useState(defaultBusiness);
  const [severity, setSeverity] = useState('中');
  const [desc, setDesc] = useState('');

  const applyTemplate = () => {
    setDesc('现象：今日上午起业务访问明显变慢，部分用户反馈无法稳定连接。\n影响：业务中断时长约10分钟，当前偶发抖动。\n诉求：请协助快速排障并给出恢复建议。');
    if (!title.trim()) {
      setTitle('业务质量异常排查');
    }
  };

  return (
    <div className="rounded-xl border border-[var(--sys-border-primary)] bg-[var(--sys-bg-header)] p-3">
      <div className="text-sm font-semibold text-[#e4f3ff]">发起自助报障</div>
      {fromDiagnosis && <div className="mt-1 text-[11px] text-[#8fc7ff]">已自动关联诊断结果</div>}
      <div className="mt-2 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#103b70] px-2 py-1 text-xs text-[#dff1ff]" placeholder="标题" />
        <input value={business} onChange={(e) => setBusiness(e.target.value)} className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#103b70] px-2 py-1 text-xs text-[#dff1ff]" placeholder="业务" />
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
              setSeverity('中');
              setDesc('');
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
