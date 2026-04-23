import React, { useState } from 'react';

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
      <button
        type="button"
        onClick={() => onSubmit({ title, business, desc, severity })}
        className="mt-3 w-full rounded border border-[#4aaaff] bg-[#1b5ca2] py-1.5 text-xs font-semibold text-[#eaf6ff]"
      >
        提交工单
      </button>
    </div>
  );
};
