import React from 'react';
import { CardActionBar } from './CardActionBar';

type ReceiptAction = {
  key: string;
  label: string;
  ask?: string;
  tone?: 'primary' | 'normal';
};

type ReceiptCardData = {
  title: string;
  fields: Array<{ label: string; value: string }>;
  nextSteps?: string[];
  actions?: ReceiptAction[];
};

interface ReceiptCardProps {
  data: ReceiptCardData;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ data, onCopy, onAsk }) => {
  const copyText = [
    `【${data.title}】`,
    ...data.fields.map((field) => `${field.label}：${field.value}`),
    ...(data.nextSteps?.length ? ['', '【下一步】', ...data.nextSteps.map((step, i) => `${i + 1}. ${step}`)] : []),
  ].join('\n');

  return (
    <div className="rounded-xl border border-[#4278aa] bg-[linear-gradient(180deg,#123a66_0%,#11345f_100%)] p-3 shadow-[0_10px_20px_rgba(7,31,67,0.28)]">
      <div className="text-sm font-semibold text-[#eef6ff]">{data.title}</div>
      <div className="mt-2 grid gap-1.5">
        {data.fields.map((field) => (
          <div key={field.label} className="flex gap-2 text-[11px]">
            <span className="w-[74px] shrink-0 text-[#99c3e5]">{field.label}</span>
            <span className="text-[#dff1ff]">{field.value}</span>
          </div>
        ))}
      </div>
      {data.nextSteps && data.nextSteps.length > 0 && (
        <div className="mt-2 rounded border border-[#3a6d9d] bg-[#0f3156] px-2 py-1.5">
          <div className="text-[11px] font-semibold text-[#cde8ff]">下一步</div>
          <div className="mt-1 space-y-1 text-[11px] text-[#b8daf4]">
            {data.nextSteps.map((step, idx) => (
              <div key={step}>{idx + 1}. {step}</div>
            ))}
          </div>
        </div>
      )}
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '复制回执',
            onClick: () => onCopy?.(copyText),
          },
          ...((data.actions || []).map((action) => ({
            key: action.key,
            label: action.label,
            tone: action.tone || 'normal',
            onClick: () => {
              if (action.ask) onAsk?.(action.ask);
            },
          }))),
        ]}
      />
    </div>
  );
};

