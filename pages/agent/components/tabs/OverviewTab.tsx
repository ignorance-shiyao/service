import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircleMore } from 'lucide-react';
import { useAIDock } from '../../store/aidock';
import { StatusLight } from '../common/StatusLight';
import { HealthRing } from '../common/HealthRing';
import { BizType } from '../../types/business';
import { BIZ_DETAILS } from '../../mock/businessDetails';
import { XianluDrawer } from '../drawers/XianluDrawer';
import { FiveGDrawer } from '../drawers/FiveGDrawer';
import { IDCDrawer } from '../drawers/IDCDrawer';
import { QuantumDrawer } from '../drawers/QuantumDrawer';
import { ZhisuanDrawer } from '../drawers/ZhisuanDrawer';

const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

export const OverviewTab: React.FC<{ onOpenCard?: (id: string) => void }> = ({ onOpenCard }) => {
  const { state, switchTab, appendMessage, setOverviewFocusBiz } = useAIDock();
  const [activeBiz, setActiveBiz] = useState<BizType | null>(null);
  const healthValue = state.healthMode === 'normal' ? 96 : state.healthMode === 'warning' ? 82 : 64;
  const detail = useMemo(() => (activeBiz ? BIZ_DETAILS[activeBiz] : null), [activeBiz]);

  useEffect(() => {
    if (state.overviewFocusBiz) {
      setActiveBiz(state.overviewFocusBiz);
    }
  }, [state.overviewFocusBiz]);

  const handleDrawerAction = (action: 'diagnosis' | 'history' | 'ticket' | 'manager') => {
    if (!detail) return;
    if (action === 'diagnosis') {
      switchTab('diagnosis');
      return;
    }
    if (action === 'ticket') {
      switchTab('chat');
      appendMessage({
        id: `overview-ticket-${Date.now()}`,
        role: 'assistant',
        time: now(),
        type: 'FormMessage',
        payload: { bizName: detail.title, title: `${detail.title} 申请报障` }
      });
      return;
    }
    if (action === 'manager') {
      switchTab('chat');
      appendMessage({
        id: `overview-manager-${Date.now()}`,
        role: 'assistant',
        time: now(),
        type: 'TextMessage',
        payload: { title: '已通知客户经理', text: `${state.customer.name} 的客户经理将在 10 分钟内联系您。` }
      });
      return;
    }
    switchTab('chat');
    appendMessage({
      id: `overview-history-${Date.now()}`,
      role: 'assistant',
      time: now(),
      type: 'TextMessage',
      payload: { title: '历史记录', text: `${detail.title} 近 30 天内共 2 次异常，均已恢复。` }
    });
  };

  return (
    <div className="relative space-y-3">
      <div className="rounded-xl border border-[#32587f] bg-[#0e2440] p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#9fc1e1]">整体健康度</div>
            <div className="text-sm font-bold text-white">{state.healthMode === 'normal' ? '当前一切正常' : state.healthMode === 'warning' ? '有 1 项需要关注' : '有 1 项故障需处理'}</div>
          </div>
          <HealthRing value={healthValue} status={state.healthMode} />
        </div>
      </div>
      <div className="rounded border border-[#32587f] bg-[#0e2440] px-3 py-2 text-xs text-[#8fd2ff]">您有 1 个 5G 专网开通中，预计 3 天后可用。</div>
      <div className="grid gap-2">
        {state.cards.map((card) => (
          <button
            key={card.id}
            className="rounded-xl border border-[#32587f] bg-[#0e2440] p-3 text-left transition hover:border-[#61b6ff]"
            onClick={() => {
              setActiveBiz(card.id as BizType);
              onOpenCard?.(card.id);
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white"><StatusLight status={card.status} /> {card.name}</div>
              <span className="text-xs text-[#9fc1e1]">{card.countLabel}</span>
            </div>
            <div className="text-xs text-[#bfd7f0]">{card.summary}</div>
            <div className="mt-1 text-[11px] text-[#8fd2ff]">{card.metricLabel}：{card.metricValue}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#90b5d6]">
              <MessageCircleMore size={12} />
              点击查看详情
            </div>
          </button>
        ))}
      </div>
      {detail && activeBiz === 'xianlu' && <XianluDrawer data={detail} onClose={() => { setActiveBiz(null); setOverviewFocusBiz(null); }} onAction={handleDrawerAction} />}
      {detail && activeBiz === 'fiveG' && <FiveGDrawer data={detail} onClose={() => { setActiveBiz(null); setOverviewFocusBiz(null); }} onAction={handleDrawerAction} />}
      {detail && activeBiz === 'idc' && <IDCDrawer data={detail} onClose={() => { setActiveBiz(null); setOverviewFocusBiz(null); }} onAction={handleDrawerAction} />}
      {detail && activeBiz === 'quantum' && <QuantumDrawer data={detail} onClose={() => { setActiveBiz(null); setOverviewFocusBiz(null); }} onAction={handleDrawerAction} />}
      {detail && activeBiz === 'zhisuan' && <ZhisuanDrawer data={detail} onClose={() => { setActiveBiz(null); setOverviewFocusBiz(null); }} onAction={handleDrawerAction} />}
    </div>
  );
};
