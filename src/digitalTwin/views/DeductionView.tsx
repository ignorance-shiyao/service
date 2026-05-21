import React, { useState } from 'react';
import { dtPanel, DtSectionTitle, DtStatusBadge } from '../shared';
import { DEDUCE_TIMELINE, DEDUCE_PLANS } from '../data';
import { Target, Clock, AlertOctagon, Activity, GitBranch, Database, Play, Save, FileText, Scale } from 'lucide-react';

const StatusDot: React.FC<{ s: 'normal' | 'warning' | 'critical' | 'recovered' }> = ({ s }) => {
  const c = s === 'normal' ? '#7dd6a4' : s === 'warning' ? '#f5b963' : s === 'critical' ? '#ef5350' : '#7dd6a4';
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />;
};

const DeduceScene: React.FC = () => (
  <svg viewBox="0 0 760 460" className="h-full w-full">
    {/* 故障扩散区域 */}
    <rect x="80" y="200" width="380" height="220" fill="rgba(239, 83, 80, 0.08)" stroke="#ef5350" strokeDasharray="4 3" />
    <text x="270" y="290" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ff8a7a">A区视觉检测工位</text>
    <text x="270" y="306" textAnchor="middle" fontSize="11" fill="#ff8a7a">受影响</text>

    {/* 核心 */}
    <g>
      <rect x="340" y="40" width="84" height="36" rx="5" fill="#0d3567" stroke="#5ea6e5" />
      <text x="382" y="62" textAnchor="middle" fontSize="11" fill="#cfe5ff">核心交换机</text>
      <circle cx="416" cy="48" r="4" fill="#7dd6a4" />
    </g>

    {/* 汇聚 */}
    <g>
      <rect x="220" y="110" width="100" height="40" rx="5" fill="#0d3567" stroke="#5ea6e5" />
      <text x="270" y="135" textAnchor="middle" fontSize="11" fill="#cfe5ff">汇聚交换机-A</text>
      <circle cx="312" cy="118" r="4" fill="#7dd6a4" />
      <rect x="440" y="110" width="100" height="40" rx="5" fill="#0d3567" stroke="#5ea6e5" />
      <text x="490" y="135" textAnchor="middle" fontSize="11" fill="#cfe5ff">汇聚交换机-B</text>
      <circle cx="532" cy="118" r="4" fill="#7dd6a4" />
    </g>

    {/* 故障点 */}
    <g>
      <circle cx="160" cy="240" r="40" fill="#5a1414" stroke="#ff5a4a" strokeWidth="2">
        <animate attributeName="r" values="34;44;34" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x="160" y="236" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffe4df">SW-A-01</text>
      <text x="160" y="250" textAnchor="middle" fontSize="10" fill="#ffd4cf">接入交换机</text>
      <circle cx="195" cy="208" r="9" fill="#ef5350" /><text x="195" y="212" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">×</text>
    </g>

    {/* 终端 */}
    {[
      { x: 110, y: 340, label: '视觉检测工位1' },
      { x: 230, y: 340, label: '视觉检测工位2' },
      { x: 350, y: 340, label: '视觉检测工位3' },
    ].map(t => (
      <g key={t.label}>
        <rect x={t.x - 32} y={t.y} width="64" height="34" fill="#0d3567" stroke="#ff5a4a" />
        <text x={t.x} y={t.y + 22} textAnchor="middle" fontSize="9" fill="#ffd4cf">{t.label}</text>
        <circle cx={t.x + 26} cy={t.y + 4} r="4" fill="#ef5350" />
      </g>
    ))}
    {[
      { x: 110, y: 392, label: 'AGV终端1' },
      { x: 230, y: 392, label: 'AGV终端2' },
      { x: 350, y: 392, label: 'AGV终端3' },
    ].map(t => (
      <g key={t.label}>
        <rect x={t.x - 32} y={t.y} width="64" height="28" fill="#0d3567" stroke="#f5b963" />
        <text x={t.x} y={t.y + 18} textAnchor="middle" fontSize="9" fill="#fff0d4">{t.label}</text>
        <circle cx={t.x + 26} cy={t.y + 2} r="4" fill="#f5b963" />
      </g>
    ))}

    {/* 摄像头 */}
    {[
      { x: 110, y: 432, label: '摄像头1' },
      { x: 230, y: 432, label: '摄像头2' },
      { x: 350, y: 432, label: '摄像头3' },
    ].map(t => (
      <g key={t.label}>
        <circle cx={t.x} cy={t.y + 8} r="11" fill="#0d3567" stroke="#f5b963" />
        <text x={t.x} y={t.y + 28} textAnchor="middle" fontSize="9" fill="#fff0d4">{t.label}</text>
      </g>
    ))}

    {/* PLC控制器/边缘服务器 */}
    <g>
      <rect x="396" y="324" width="62" height="34" fill="#0d3567" stroke="#f5b963" />
      <text x="427" y="345" textAnchor="middle" fontSize="9" fill="#fff0d4">PLC控制器</text>
      <circle cx="450" cy="328" r="4" fill="#f5b963" />
      <rect x="396" y="404" width="62" height="34" fill="#0d3567" stroke="#f5b963" />
      <text x="427" y="424" textAnchor="middle" fontSize="9" fill="#fff0d4">边缘服务器</text>
      <circle cx="450" cy="408" r="4" fill="#f5b963" />
    </g>

    {/* 右侧备用路径 */}
    <g>
      <rect x="520" y="200" width="84" height="38" rx="4" fill="#0d3567" stroke="#5ea6e5" />
      <text x="562" y="218" textAnchor="middle" fontSize="10" fill="#cfe5ff">PLC控制器-备</text>
      <text x="562" y="232" textAnchor="middle" fontSize="9" fill="#7dd6a4">备</text>

      <rect x="620" y="170" width="84" height="38" rx="4" fill="#0d3567" stroke="#5ea6e5" />
      <text x="662" y="194" textAnchor="middle" fontSize="11" fill="#cfe5ff">SW-A-02</text>
      <circle cx="694" cy="178" r="4" fill="#7dd6a4" />

      <rect x="620" y="320" width="84" height="38" rx="4" fill="#0d3567" stroke="#5ea6e5" />
      <text x="662" y="344" textAnchor="middle" fontSize="11" fill="#cfe5ff">产线服务器</text>
      <circle cx="694" cy="328" r="4" fill="#7dd6a4" />
    </g>

    {/* 故障链路 */}
    <g fill="none">
      <path d="M270 150 L160 200" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M160 280 L110 340" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M160 280 L230 340" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M160 280 L350 340" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M160 280 L110 392" stroke="#ef5350" strokeDasharray="5 3" opacity="0.7" />
      <path d="M160 280 L230 392" stroke="#ef5350" strokeDasharray="5 3" opacity="0.7" />
      <path d="M160 280 L350 392" stroke="#ef5350" strokeDasharray="5 3" opacity="0.7" />

      {/* 正常链路 */}
      <path d="M490 150 L662 170" stroke="#4fc1ff" />
      <path d="M662 208 L562 220" stroke="#4fc1ff" />
      <path d="M662 208 L662 320" stroke="#4fc1ff" />
    </g>
  </svg>
);

export const DeductionView: React.FC = () => {
  const [link, setLink] = useState(80);
  const [step, setStep] = useState(5);
  const [eta, setEta] = useState(15);

  return (
    <div className="grid h-full grid-cols-12 gap-1.5">
      {/* 左列 配置 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="推演配置" right={<span className="rounded bg-[#a06b1e] px-1.5 text-[10px] font-bold text-white">模拟数据</span>} />
          <div className="flex-1 space-y-1.5 text-[12px] text-[#d8eaff]">
            <ConfigRow icon={<Target size={13} />} k="故障对象" v="SW-A-01 接入交换机" />
            <ConfigRow icon={<AlertOctagon size={13} />} k="故障类型" v={<span className="text-[#ff8a7a]">● 设备离线</span>} />
            <ConfigRow icon={<Clock size={13} />} k="持续时间" v="30 分钟" />
            <ConfigRow icon={<Clock size={13} />} k="开始时间" v="14:30" />
            <ConfigRow icon={<Activity size={13} />} k="影响模型" v="链路依赖 + 业务映射" />
            <ConfigRow icon={<Database size={13} />} k="数据来源" v="真实拓扑 / 模拟规则" />
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="推演参数" />
          <div className="flex-1 space-y-2.5 text-[12px] text-[#d8eaff]">
            <Slider label="链路切换阈值" value={link} unit="%" min={0} max={100} onChange={setLink} />
            <Slider label="告警扩散步长" value={step} unit="分钟" min={1} max={30} onChange={setStep} />
            <Slider label="业务恢复目标" value={eta} unit="分钟" min={5} max={60} onChange={setEta} />
          </div>
        </div>
        <div className={`${dtPanel} grid grid-cols-4 gap-1.5 text-[10px] text-[#bedaf8]`}>
          <Legend color="#7dd6a4" label="正常" />
          <Legend color="#f5b963" label="告警" />
          <Legend color="#ef5350" label="严重" />
          <Legend color="#7a96b6" label="离线" />
        </div>
      </div>

      {/* 中间 推演场景 */}
      <div className="col-span-6 flex flex-col gap-1.5">
        <div className={`${dtPanel} flex-1`}>
          <DtSectionTitle title="区域与网络关系视图（A区产线）" right={<button className="rounded border border-[#2d6ab1] bg-[#0b2f61] px-2 py-[1px] text-[10px] text-[#bde3ff] hover:border-[#4ea4ff]">切换区域</button>} />
          <div className="relative flex-1 overflow-hidden rounded border border-[#16508f] bg-[#03132a]">
            <DeduceScene />
            {/* 右上小地图 */}
            <div className="absolute right-2 top-2 h-16 w-24 overflow-hidden rounded border border-[#2b6aa8] bg-[#0b2f61]/85">
              <div className="flex h-full items-center justify-center text-[10px] text-[#cfe5ff]">A区 概览</div>
            </div>
            {/* 时间轴在场景中 */}
            <div className="absolute right-2 top-24 w-32 space-y-1 rounded border border-[#1f5b9b] bg-[#0b2f61]/85 p-2">
              {DEDUCE_TIMELINE.map((t, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-[#cfe5ff]">
                  <StatusDot s={t.status} />
                  <div className="leading-tight">
                    <div className="font-mono font-bold">{t.time}</div>
                    <div className="text-[#bedaf8]">{t.title}</div>
                    <div className="text-[9px] text-[#8bc4ff]">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={dtPanel} style={{ height: 142 }}>
          <DtSectionTitle title="推演时间轴（最近 30 分钟）" />
          <div className="flex flex-1 items-center gap-2 px-3">
            <button className="flex h-7 w-7 items-center justify-center rounded-full border border-[#5ea6e5] bg-[#0e3e7e] text-[#79d0ff] hover:bg-[#144279]"><Play size={13} /></button>
            <div className="relative flex-1">
              <div className="absolute inset-y-1/2 h-[3px] w-full -translate-y-1/2 rounded bg-[#0c2f5e]" />
              <div className="absolute inset-y-1/2 h-[3px] w-2/3 -translate-y-1/2 rounded bg-gradient-to-r from-[#3fa5ff] via-[#f5b963] to-[#ef5350]" />
              <div className="relative flex justify-between text-[9px] text-[#8bc4ff]">
                {['14:00','14:05','14:10','14:15','14:20','14:25','14:30','14:35','14:40','14:45','14:50','14:55','15:00'].map((t, i) => (
                  <div key={t} className="flex flex-col items-center">
                    <div className={`mb-1 h-2 w-2 rounded-full ${i === 6 ? 'bg-[#ef5350]' : i === 7 ? 'bg-[#ef5350]' : i === 9 ? 'bg-[#f5b963]' : i === 12 ? 'bg-[#7dd6a4]' : 'bg-[#3fa5ff]'}`} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] text-[#9fc8f2]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#3fa5ff]" />正常</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f5b963]" />告警</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef5350]" />严重</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7dd6a4]" />恢复</span>
          </div>
        </div>
      </div>

      {/* 右列 推演结果 */}
      <div className="col-span-3 flex flex-col gap-1.5">
        <div className={dtPanel}>
          <DtSectionTitle title="推演结果" />
          <div className="flex-1 space-y-1.5 text-[11.5px] text-[#d8eaff]">
            <KV k="受影响业务" v="视觉检测、AGV调度、视频监控" />
            <KV k="受影响设备" v="8 台终端" />
            <KV k="风险等级" v={<DtStatusBadge status="告警" />} />
            <KV k="预计恢复时间" v={<span className="font-mono">{eta} 分钟</span>} />
            <KV k="建议处置" v={
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[11px]"><span className="text-[#79d0ff]">✓</span>切换备用链路</div>
                <div className="flex items-center gap-1 text-[11px]"><span className="text-[#79d0ff]">✓</span>派发工单</div>
                <div className="flex items-center gap-1 text-[11px]"><span className="text-[#79d0ff]">✓</span>通知产线负责人</div>
              </div>
            } />
          </div>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="方案对比" />
          <table className="w-full text-[11px] text-[#d8eaff]">
            <thead className="text-[10px] text-[#8bc4ff]">
              <tr><th className="py-1 text-left">方案</th><th className="text-left">处置方式</th><th>恢复时间</th><th>风险</th></tr>
            </thead>
            <tbody>
              {DEDUCE_PLANS.map(p => {
                const riskCls = p.risk === '低' ? 'text-[#7dd6a4] bg-[#0d3a26] border-[#1d6a45]' : 'text-[#f5b963] bg-[#3a2c0d] border-[#7a5c1d]';
                return (
                  <tr key={p.id} className="border-t border-[#0e3e7e]">
                    <td className="py-1 font-semibold">{p.name}</td>
                    <td>{p.method}</td>
                    <td className="text-center font-mono">{p.eta}</td>
                    <td className="text-center"><span className={`inline-block rounded border px-1.5 py-[1px] text-[10px] ${riskCls}`}>{p.risk}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={dtPanel}>
          <DtSectionTitle title="操作" />
          <div className="grid grid-cols-3 gap-1.5">
            <ActionBtn icon={<Save size={13} />} label="保存为预案" />
            <ActionBtn icon={<FileText size={13} />} label="导出报告" />
            <ActionBtn icon={<Scale size={13} />} label="对比其他方案" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigRow: React.FC<{ icon: React.ReactNode; k: string; v: React.ReactNode }> = ({ icon, k, v }) => (
  <div className="grid grid-cols-[16px_72px_1fr] items-center gap-1.5 rounded bg-[#0e3e7e]/55 px-2 py-1.5">
    <span className="text-[#9cd3ff]">{icon}</span>
    <span className="text-[11px] text-[#8bc4ff]">{k}</span>
    <span className="text-[12px] text-[#eaf6ff]">{v}</span>
  </div>
);

const Slider: React.FC<{ label: string; value: number; unit: string; min: number; max: number; onChange: (v: number) => void }> = ({ label, value, unit, min, max, onChange }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-[11px]"><span className="text-[#bedaf8]">{label}</span><span className="font-mono font-bold text-[#79d0ff]">{value} {unit}</span></div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#3fa5ff]" />
  </div>
);

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center justify-center gap-1 rounded bg-[#0e3e7e]/55 py-1"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</div>
);

const KV: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="rounded bg-[#0e3e7e]/55 px-2 py-1.5">
    <div className="mb-0.5 text-[10px] text-[#8bc4ff]">{k}</div>
    <div className="text-[12px] text-[#eaf6ff]">{v}</div>
  </div>
);

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex items-center justify-center gap-1 rounded border border-[#2d6ab1] bg-[#0b2f61] px-1 py-1.5 text-[11px] text-[#bde3ff] transition hover:border-[#4ea4ff] hover:bg-[#12407e] hover:text-white">
    {icon}{label}
  </button>
);
