import React, { useState } from 'react';
import { Button, Input } from '../../../../components/UI';
import { useAIDock } from '../../store/aidock';

interface Props {
  onCreateTicket: (note: string) => void;
}

export const DiagnosisTab: React.FC<Props> = ({ onCreateTicket }) => {
  const { state, runDiagnosis, appendMessage } = useAIDock();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const latest = state.diagnosisHistory[0];

  const handleRun = () => {
    setLoading(true);
    setTimeout(() => {
      runDiagnosis();
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
        <div className="mb-2 text-sm font-bold text-white">自助排障</div>
        <Button onClick={handleRun} disabled={loading}>{loading ? '正在体检...' : '一键体检'}</Button>
      </div>
      {latest && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-sm text-slate-100">
          <div className="font-bold text-amber-300">问题判断</div>
          <div className="mt-1">{latest.summary}</div>
          <div className="mt-2 text-xs">
            <div className="font-bold">影响范围</div>
            {latest.impact.map((x) => <div key={x}>· {x}</div>)}
          </div>
          <div className="mt-2 text-xs">
            <div className="font-bold">可能原因</div>
            {latest.reasons.map((x, i) => <div key={x}>{i + 1}. {x}</div>)}
          </div>
          <div className="mt-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="补充说明（可选）" />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => onCreateTicket(note)}>一键报障</Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  appendMessage({
                    id: `diag-history-${Date.now()}`,
                    role: 'assistant',
                    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                    type: 'TextMessage',
                    payload: { title: '历史类似故障', text: '近 30 天内同类故障 2 次，平均恢复时长 28 分钟。' }
                  })
                }
              >
                查看历史类似故障
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="rounded border border-slate-700 bg-slate-900/60 p-2 text-xs text-slate-300">
        历史记录：{state.diagnosisHistory.length} 条
      </div>
    </div>
  );
};
