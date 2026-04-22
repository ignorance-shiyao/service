import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { BizDetailData } from '../../mock/businessDetails';
import { TermTooltip } from '../common/TermTooltip';

interface Props {
  data: BizDetailData;
  onClose: () => void;
  onAction: (action: 'diagnosis' | 'history' | 'ticket' | 'manager') => void;
}

export const BizDetailDrawerBase: React.FC<Props> = ({ data, onClose, onAction }) => {
  const max = Math.max(...data.trendSeries.map((x) => x.value), 1);

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-[#020617]/70 backdrop-blur-[1px]">
      <div className="h-full w-full max-w-[88%] overflow-y-auto border-l border-[#2a5d90] bg-[linear-gradient(180deg,#0a2040_0%,#07172d_100%)] p-3">
        <div className="mb-3 flex items-center justify-between border-b border-[#23486f] pb-2">
          <div>
            <div className="text-sm font-bold text-[#d8eeff]">{data.title}</div>
            <div className="text-xs text-[#95b9d9]">{data.banner}</div>
          </div>
          <button className="rounded border border-[#3f6ea2] bg-[#123b68] p-1 text-[#a9d5ff]" onClick={onClose}>
            <X size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {data.metrics.map((metric) => (
            <div key={metric.label} className="rounded border border-[#32587f] bg-[#0e2440] p-2">
              <div className="mb-1 text-[11px] text-[#9fc1e1]">
                {metric.hint ? <TermTooltip term={metric.label} hint={metric.hint} /> : metric.label}
              </div>
              <div className="text-sm font-bold text-white">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded border border-[#32587f] bg-[#0e2440] p-2">
          <div className="mb-2 text-xs font-bold text-[#b9daff]">{data.trendTitle}</div>
          <div className="flex items-end gap-1">
            {data.trendSeries.map((point) => (
              <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-[#2f86db]" style={{ height: `${Math.max((point.value / max) * 72, 10)}px` }} />
                <div className="text-[10px] text-[#90b5d6]">{point.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded border border-[#32587f] bg-[#0e2440] p-2">
          <div className="mb-1 text-xs font-bold text-[#b9daff]">异常事件</div>
          {data.events.map((event) => (
            <div key={event} className="text-[11px] text-[#bfd7f0]">· {event}</div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onAction('diagnosis')}>一键体检</Button>
          <Button size="sm" variant="secondary" onClick={() => onAction('history')}>查看历史</Button>
          <Button size="sm" variant="secondary" onClick={() => onAction('ticket')}>报障</Button>
          <Button size="sm" variant="secondary" onClick={() => onAction('manager')}>咨询客户经理</Button>
        </div>
      </div>
    </div>
  );
};
