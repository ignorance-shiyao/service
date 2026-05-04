import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, MapPin, RadioTower, Wrench } from 'lucide-react';
import { FaultContext } from '../../store/useAiDock';
import { CardActionBar } from './CardActionBar';

type FaultBusinessOption = {
  id: string;
  label: string;
  value: string;
  type: string;
  region: string;
  site: string;
  risk?: boolean;
  riskSeverity?: string;
};

interface FaultFormCardProps {
  defaultTitle: string;
  defaultBusiness: string;
  defaultBusinesses?: string[];
  defaultDesc?: string;
  defaultSeverity?: string;
  context?: FaultContext | null;
  contexts?: FaultContext[];
  businessOptions?: FaultBusinessOption[];
  fromDiagnosis?: boolean;
  onSubmit: (payload: { title: string; business: string; businesses: string[]; desc: string; severity: string }) => void | Promise<void>;
}

export const FaultFormCard: React.FC<FaultFormCardProps> = ({
  defaultTitle,
  defaultBusiness,
  defaultBusinesses = [],
  defaultDesc = '',
  defaultSeverity = '中',
  context,
  contexts = [],
  businessOptions = [],
  fromDiagnosis,
  onSubmit,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [businesses, setBusinesses] = useState<string[]>(
    defaultBusinesses.length > 0 ? defaultBusinesses : [defaultBusiness]
  );
  const [severity, setSeverity] = useState(defaultSeverity);
  const [desc, setDesc] = useState(defaultDesc);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const riskBusinessSet = new Set(contexts.map((item) => item.business).filter(Boolean));
  if (context?.business) riskBusinessSet.add(context.business);
  const sortedBusinessOptions = businessOptions
    .map((option) => ({
      ...option,
      risk: option.risk || riskBusinessSet.has(option.value),
      riskSeverity: option.riskSeverity || contexts.find((item) => item.business === option.value)?.severity,
    }))
    .sort((a, b) => Number(Boolean(b.risk)) - Number(Boolean(a.risk)) || a.type.localeCompare(b.type, 'zh-CN'));
  const selectedOptions = sortedBusinessOptions.filter((option) => businesses.includes(option.value));
  const primaryBusiness = selectedOptions[0]?.value || businesses[0] || defaultBusiness;
  const canSubmit = businesses.length > 0 && title.trim().length > 0 && desc.trim().length >= 8;

  const applyTemplate = () => {
    const location = context?.region || selectedOptions[0]?.region || '客户业务现场';
    const site = context?.site || selectedOptions[0]?.site || '业务接入点';
    const businessText = selectedOptions.length > 0
      ? selectedOptions.map((item) => item.value).join('、')
      : businesses.join('、');
    setDesc(`故障业务：${businessText}\n故障位置：${location} / ${site}\n现象：今日上午起业务访问明显变慢，部分用户反馈无法稳定连接。\n影响：业务中断时长约10分钟，当前偶发抖动。\n诉求：请协助快速排障并给出恢复建议。`);
    if (!title.trim()) {
      setTitle('业务质量异常排查');
    }
  };

  const toggleBusiness = (value: string) => {
    setSubmitError('');
    setBusinesses((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      return [...prev, value];
    });
  };

  const submit = async () => {
    if (!canSubmit || submitting) {
      setSubmitError('请至少选择 1 条业务，并补充不少于 8 个字的问题描述。');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        business: primaryBusiness,
        businesses,
        desc: desc.trim(),
        severity,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#3f77ab] bg-[linear-gradient(180deg,#0e3360_0%,#0f2f5b_100%)] p-3 shadow-[0_12px_22px_rgba(6,29,62,0.35)]">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#e4f3ff]">
          <Wrench size={14} className="text-[#9bd4ff]" />
          发起自助报障
        </div>
        <span className="rounded-full border border-[#4b88bd] bg-[#184878] px-2 py-0.5 text-[10px] text-[#cce8ff]">
          已选 {businesses.length} 条
        </span>
      </div>
      {fromDiagnosis && <div className="mt-1 text-[11px] text-[#8fc7ff]">已带入本次诊断结果</div>}
      {(context || selectedOptions[0]) && (
        <div className="mt-2 rounded-lg border border-[#2f679d] bg-[#113864] p-2 text-[11px] text-[#d5ebff]">
          <div className="mb-1 flex items-center gap-1 text-[#9ecfff]">
            <RadioTower size={12} />
            报障业务信息
          </div>
          <div className="truncate">业务：{contexts.length > 1 ? `${contexts.length} 条业务` : context?.business || primaryBusiness}</div>
          <div className="mt-0.5 truncate">类型：{context?.businessType || selectedOptions[0]?.type || '未指定'}</div>
          <div className="mt-0.5 flex items-start gap-1">
            <MapPin size={11} className="mt-0.5 shrink-0 text-[#83bce9]" />
            <span className="min-w-0 truncate">{context?.region || selectedOptions[0]?.region || '未指定区域'} / {context?.site || selectedOptions[0]?.site || '未指定站点'}</span>
          </div>
        </div>
      )}
      <div className="mt-2 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-9 w-full rounded-md border border-[#3d77af] bg-[#174473] px-2.5 text-sm text-[#e7f4ff] placeholder:text-[#91bbdd] outline-none focus:border-[#5eb2ff]"
          placeholder="请输入工单标题"
        />
        {businessOptions.length > 0 ? (
          <div className="rounded-md border border-[#3d77af] bg-[#174473] px-2 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#cbe7ff]">选择报障业务（可多选）</div>
              <div className="text-[11px] text-[#9fd0f5]">已选 {businesses.length}</div>
            </div>
            <div className="custom-scrollbar max-h-[190px] space-y-1 overflow-y-auto pr-1">
              {sortedBusinessOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-2 rounded border px-2 py-1.5 text-[12px] text-[#d6ecff] transition hover:border-[#57a8ef] hover:bg-[#154374] ${
                    option.risk
                      ? 'border-[#c58b58] bg-[rgba(98,67,35,0.68)]'
                      : 'border-[#2f6698] bg-[#123b66]'
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-[#7ec5ff]">
                    {businesses.includes(option.value) ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={businesses.includes(option.value)}
                    onChange={() => {
                      toggleBusiness(option.value);
                      if (!context) {
                        setTitle(`${option.type}${option.region}业务异常报障`);
                      }
                    }}
                  />
                  <span className="min-w-0 flex-1 leading-5">
                    <span>{option.label}｜{option.region}</span>
                    {option.risk && (
                      <span className="ml-1 inline-flex rounded border border-[#d5a86d] bg-[rgba(111,72,31,0.82)] px-1 py-0.5 text-[10px] text-[#ffe6bf]">
                        诊断风险{option.riskSeverity ? ` · ${option.riskSeverity}` : ''}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <input value={primaryBusiness} onChange={(e) => setBusinesses([e.target.value])} className="w-full rounded border border-[var(--sys-border-secondary)] bg-[#103b70] px-2 py-1 text-xs text-[#dff1ff]" placeholder="业务" />
        )}
        <div className="rounded-md border border-[#3d77af] bg-[#174473] p-2">
          <div className="mb-1 text-xs text-[#9fd0f5]">紧急程度</div>
          <div className="flex gap-2">
          {['低', '中', '高'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                severity === s
                  ? s === '高'
                    ? 'border-[#df6b7d] bg-[#733a4a] text-[#ffe5ea]'
                    : s === '中'
                      ? 'border-[#6eb7ff] bg-[#1b4f81] text-[#ecf6ff]'
                      : 'border-[#69bf9a] bg-[#245f4d] text-[#e5fff5]'
                  : 'border-[#4b7bab] bg-[#173f6a] text-[#c3e2ff]'
              }`}
            >
              {s}
            </button>
          ))}
          </div>
        </div>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="min-h-[86px] w-full rounded-md border border-[#3d77af] bg-[#174473] px-2.5 py-2 text-sm text-[#dff1ff] placeholder:text-[#91bbdd] outline-none focus:border-[#5eb2ff]"
          placeholder="请描述问题现象（建议包含影响范围、发生时间、是否可复现）"
        />
        {(!canSubmit || submitError) && (
          <div className="inline-flex items-center gap-1 text-[11px] text-[#ffcfaf]">
            <AlertTriangle size={12} />
            {submitError || '请至少选择 1 条业务，并补充有效问题描述后再提交'}
          </div>
        )}
      </div>
      <CardActionBar
        actions={[
          {
            key: 'reset',
            label: '重置表单',
            onClick: () => {
              setTitle(defaultTitle);
              setBusinesses(defaultBusinesses.length > 0 ? defaultBusinesses : [defaultBusiness]);
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
            label: submitting ? '提交中...' : businesses.length > 1 ? `提交工单（${businesses.length}条）` : '提交工单',
            tone: 'primary',
            onClick: () => void submit(),
          },
        ]}
      />
    </div>
  );
};
