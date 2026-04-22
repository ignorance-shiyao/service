import React, { useMemo, useState } from 'react';
import { AlertTriangle, BellRing, CircleHelp, SendHorizontal } from 'lucide-react';
import { Button, Input, Modal } from '../../../../components/UI';
import { useAIDock } from '../../store/aidock';
import { ProgressStepper } from '../common/ProgressStepper';
import { TicketItem } from '../../types/ticket';

const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

const GROUP_LABEL: Record<string, string> = {
  processing: '处理中',
  restored: '已恢复',
  followup: '已关闭'
};

export const TicketTab: React.FC<{ onAdvance: (id: string) => void }> = ({ onAdvance }) => {
  const { state, appendMessage } = useAIDock();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const selected = useMemo(
    () => state.tickets.find((ticket) => ticket.id === selectedId) || null,
    [state.tickets, selectedId]
  );

  const grouped = useMemo(() => {
    const processing = state.tickets.filter((ticket) => ['accepted', 'dispatching', 'processing'].includes(ticket.status));
    const restored = state.tickets.filter((ticket) => ticket.status === 'restored');
    const followup = state.tickets.filter((ticket) => ticket.status === 'followup');
    return [
      { key: 'processing', label: GROUP_LABEL.processing, items: processing },
      { key: 'restored', label: GROUP_LABEL.restored, items: restored },
      { key: 'followup', label: GROUP_LABEL.followup, items: followup }
    ];
  }, [state.tickets]);

  const sendTicketMessage = (title: string, text: string) => {
    appendMessage({
      id: `ticket-msg-${Date.now()}`,
      role: 'assistant',
      time: now(),
      type: 'TextMessage',
      payload: { title, text }
    });
  };

  const renderListItem = (ticket: TicketItem) => {
    return (
      <button
        key={ticket.id}
        className={`w-full rounded-lg border p-2 text-left transition ${
          selectedId === ticket.id ? 'border-[#63b6ff] bg-[#143255]' : 'border-[#2f547a] bg-[#0f2540] hover:border-[#4b7ead]'
        }`}
        onClick={() => setSelectedId(ticket.id)}
      >
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-bold text-white">{ticket.id}</div>
          <div className="text-[10px] text-[#8fb6d8]">{ticket.updatedAt}</div>
        </div>
        <div className="text-xs text-[#c8ddf2]">{ticket.title}</div>
      </button>
    );
  };

  if (selected) {
    return (
      <div className="space-y-3">
        <button className="text-xs text-[#8fb6d8]" onClick={() => setSelectedId(null)}>返回工单列表</button>
        <div className="rounded-xl border border-[#32587f] bg-[#0e2440] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">{selected.id}</div>
              <div className="text-xs text-[#9fc1e1]">{selected.title}</div>
            </div>
            <div className="rounded bg-[#1f4f8b] px-2 py-1 text-[11px] text-white">{selected.bizName}</div>
          </div>

          <div className="mb-2"><ProgressStepper status={selected.status} /></div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-[#32587f] bg-[#102846] p-2">
              <div className="text-[#9fc1e1]">当前处理人</div>
              <div className="font-bold text-white">{selected.owner}</div>
            </div>
            <div className="rounded border border-[#32587f] bg-[#102846] p-2">
              <div className="text-[#9fc1e1]">预计恢复时间</div>
              <div className="font-bold text-white">{selected.eta}</div>
            </div>
          </div>

          <div className="mt-2 rounded border border-[#32587f] bg-[#102846] p-2 text-xs text-[#c8ddf2]">
            最新动作：{selected.updatedAt} 工单状态已更新。
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { onAdvance(selected.id); sendTicketMessage('已催办', `工单 ${selected.id} 已催办，值守组已确认。`); }}>
              <span className="inline-flex items-center gap-1"><BellRing size={12} />催办</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setUpgradeOpen(true)}>
              <span className="inline-flex items-center gap-1"><AlertTriangle size={12} />申请升级</span>
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="补充说明" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!note.trim()) return;
                sendTicketMessage('补充说明已提交', `工单 ${selected.id} 补充说明：${note}`);
                setNote('');
              }}
            >
              <span className="inline-flex items-center gap-1"><SendHorizontal size={12} />提交</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendTicketMessage('查看更多', `已打开工单 ${selected.id} 的完整处理记录（演示）。`)}
            >
              <span className="inline-flex items-center gap-1"><CircleHelp size={12} />查看更多</span>
            </Button>
          </div>
        </div>

        <Modal
          isOpen={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          title="申请升级"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setUpgradeOpen(false)}>取消</Button>
              <Button
                onClick={() => {
                  setUpgradeOpen(false);
                  sendTicketMessage('升级申请已提交', `工单 ${selected.id} 已提交高级支持升级申请。`);
                }}
              >
                确认升级
              </Button>
            </>
          }
        >
          <div className="text-sm text-slate-300">升级后将同步通知省级专家团队并提高处理优先级。</div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map((group) => (
        <div key={group.key} className="rounded-xl border border-[#32587f] bg-[#0e2440] p-2">
          <div className="mb-2 text-xs font-bold text-[#b9daff]">{group.label}（{group.items.length}）</div>
          <div className="space-y-2">
            {group.items.length > 0 ? group.items.map(renderListItem) : <div className="text-[11px] text-[#90b5d6]">暂无工单</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
