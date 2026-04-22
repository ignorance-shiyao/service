import React, { useMemo, useState } from 'react';
import { ArrowLeft, Image, SendHorizontal } from 'lucide-react';
import { Button, Modal, Select } from '../../../../components/UI';
import { REPORT_LIST } from '../../mock/reports';
import { useAIDock } from '../../store/aidock';

const CONTACTS = [
  { label: '张经理（运营）', value: 'zhang' },
  { label: '李主管（网络）', value: 'li' },
  { label: '王主任（信息化）', value: 'wang' }
];

const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

export const ReportTab: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [contact, setContact] = useState('zhang');
  const { state, appendMessage, toggleMax } = useAIDock();
  const active = useMemo(() => REPORT_LIST.find((x) => x.id === activeId) || null, [activeId]);

  const handleExport = (mode: 'pdf' | 'image') => {
    appendMessage({
      id: `report-export-${Date.now()}`,
      role: 'assistant',
      time: now(),
      type: 'TextMessage',
      payload: {
        title: '导出完成',
        text: `${active?.title || '当前报告'} 已导出为${mode === 'pdf' ? ' PDF' : ' 长图'}（模拟）。`
      }
    });
  };

  if (active) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 text-xs text-[#9fc1e1]" onClick={() => setActiveId(null)}>
              <ArrowLeft size={12} />
              返回报告列表
            </button>
            {state.maximized && (
              <button className="rounded border border-[#32587f] bg-[#143253] px-2 py-1 text-[11px] text-[#d5e8f8]" onClick={toggleMax}>
                退出最大化
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleExport('pdf')}>导出 PDF</Button>
            <Button size="sm" variant="secondary" onClick={() => handleExport('image')}>
              <span className="inline-flex items-center gap-1"><Image size={12} />导出长图</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSendOpen(true)}>
              <span className="inline-flex items-center gap-1"><SendHorizontal size={12} />发送同事</span>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[#32587f] bg-[#0e2440] p-3">
          <div className="mb-1 text-lg font-black text-white">{active.title}</div>
          <div className="text-xs text-[#9fc1e1]">{active.range}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded border border-[#32587f] bg-[#102846] p-2">
              <div className="text-[11px] text-[#9fc1e1]">本月亮点</div>
              <div className="text-sm text-white">核心业务运行稳定，响应速度整体良好。</div>
            </div>
            <div className="rounded border border-[#32587f] bg-[#102846] p-2">
              <div className="text-[11px] text-[#9fc1e1]">需关注事项</div>
              <div className="text-sm text-white">阜阳专线偶发波动，建议加强巡检。</div>
            </div>
            <div className="rounded border border-[#32587f] bg-[#102846] p-2">
              <div className="text-[11px] text-[#9fc1e1]">合同承诺达标情况</div>
              <div className="mt-1 h-2 rounded bg-[#1b3b60]">
                <div className="h-full w-[96%] rounded bg-[#2f86db]" />
              </div>
            </div>
            <div className="rounded border border-[#32587f] bg-[#102846] p-2">
              <div className="text-[11px] text-[#9fc1e1]">优化建议</div>
              <div className="text-sm text-white">将高峰流量业务切换到业务优先通道。</div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={sendOpen}
          onClose={() => setSendOpen(false)}
          title="发送给同事"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSendOpen(false)}>取消</Button>
              <Button onClick={() => {
                setSendOpen(false);
                appendMessage({
                  id: `report-send-${Date.now()}`,
                  role: 'assistant',
                  time: now(),
                  type: 'TextMessage',
                  payload: { title: '发送成功', text: `${active.title} 已发送给 ${CONTACTS.find((x) => x.value === contact)?.label}。` }
                });
              }}>确认发送</Button>
            </>
          }
        >
          <Select label="联系人" value={contact} onChange={(e) => setContact(e.target.value)} options={CONTACTS} />
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className={`rounded px-2 py-1 text-xs ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`} onClick={() => setPeriod('week')}>周报</button>
        <button className={`rounded px-2 py-1 text-xs ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`} onClick={() => setPeriod('month')}>月报</button>
        <button className={`rounded px-2 py-1 text-xs ${period === 'quarter' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`} onClick={() => setPeriod('quarter')}>季报</button>
      </div>
      {REPORT_LIST.map((report) => (
        <div key={report.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
          <div className="text-sm font-bold text-white">{report.title}</div>
          <div className="mt-1 text-xs text-slate-300">{report.summary}</div>
          <div className="mt-1 text-[11px] text-indigo-300">{report.score} · {report.range}</div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => {
              setActiveId(report.id);
              if (!state.maximized) toggleMax();
              appendMessage({
                id: `report-open-${Date.now()}`,
                role: 'assistant',
                time: now(),
                type: 'ReportCardMessage',
                payload: { title: report.title, summary: '已切换最大化阅读模式。' }
              });
            }}>查看全文</Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                appendMessage({
                  id: `report-export-${Date.now()}`,
                  role: 'assistant',
                  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                  type: 'TextMessage',
                  payload: { title: '导出完成', text: `${report.title} 已下载（模拟）。` }
                })
              }
            >
              导出 PDF
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
