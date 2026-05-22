import React, { useState } from 'react';
import { dtPanel, DtSectionTitle, DtStatusBadge } from '../shared';
import { DEDUCE_TIMELINE, DEDUCE_PLANS } from '../data';
import { Target, Clock, AlertOctagon, Activity, GitBranch, Database, Play, Save, FileText, Scale, CheckCircle2 } from 'lucide-react';
import { DtSceneHeader } from '../DigitalTwinDashboard';

const StatusDot: React.FC<{ s: 'normal' | 'warning' | 'critical' | 'recovered' }> = ({ s }) => {
  const c = s === 'normal' ? '#6ce09a' : s === 'warning' ? '#f5b963' : s === 'critical' ? '#ef5350' : '#6ce09a';
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />;
};

// ── 区域故障扩散场景 ─────────────────────────────────────────────────
const DeduceScene: React.FC = () => (
  <svg viewBox="0 0 900 540" className="h-full w-full">
    <defs>
      <radialGradient id="dGround" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stopColor="#0a3068" />
        <stop offset="100%" stopColor="#04132c" />
      </radialGradient>
      <pattern id="dGrid" width="44" height="44" patternUnits="userSpaceOnUse">
        <path d="M44 0 L0 0 0 44" fill="none" stroke="rgba(35,76,124,0.35)" strokeWidth="0.5" />
      </pattern>
      <linearGradient id="nodeG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#114a8a" />
        <stop offset="100%" stopColor="#0a2c5e" />
      </linearGradient>
    </defs>
    <rect width="900" height="540" fill="url(#dGround)" />
    <rect width="900" height="540" fill="url(#dGrid)" />

    {/* 故障影响区域（红色虚线框） */}
    <rect x="60" y="220" width="430" height="280" fill="rgba(239,83,80,0.06)" stroke="#ef5350" strokeDasharray="6 4" />
    <text x="275" y="320" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#ff8a7a">A区视觉检测工位</text>
    <text x="275" y="338" textAnchor="middle" fontSize="11" fill="#ff8a7a">受影响</text>

    {/* 核心交换机 */}
    <g>
      <rect x="370" y="56" width="100" height="44" rx="6" fill="url(#nodeG)" stroke="#5fb4ff" />
      <text x="420" y="76" textAnchor="middle" fontSize="11" fill="#cfe5ff">核心交换机</text>
      <text x="420" y="92" textAnchor="middle" fontSize="10" fill="#a9c8ee">Core-01</text>
      <circle cx="460" cy="64" r="3.5" fill="#6ce09a" />
    </g>

    {/* 汇聚 */}
    <g>
      <rect x="240" y="130" width="120" height="46" rx="6" fill="url(#nodeG)" stroke="#5fb4ff" />
      <text x="300" y="150" textAnchor="middle" fontSize="11" fill="#cfe5ff">汇聚交换机-A</text>
      <text x="300" y="166" textAnchor="middle" fontSize="10" fill="#a9c8ee">AGG-01</text>
      <circle cx="350" cy="138" r="3.5" fill="#6ce09a" />
      <rect x="500" y="130" width="120" height="46" rx="6" fill="url(#nodeG)" stroke="#5fb4ff" />
      <text x="560" y="150" textAnchor="middle" fontSize="11" fill="#cfe5ff">汇聚交换机-B</text>
      <text x="560" y="166" textAnchor="middle" fontSize="10" fill="#a9c8ee">AGG-02</text>
      <circle cx="610" cy="138" r="3.5" fill="#6ce09a" />
    </g>

    {/* 故障源 SW-A-01 */}
    <g>
      <circle cx="180" cy="270" r="48" fill="rgba(90,20,20,0.7)" stroke="#ef5a4a" strokeWidth="2">
        <animate attributeName="r" values="42;54;42" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <text x="180" y="266" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffe4df">SW-A-01</text>
      <text x="180" y="282" textAnchor="middle" fontSize="10" fill="#ffd4cf">接入交换机</text>
      <circle cx="220" cy="230" r="11" fill="#ef5350" stroke="#fff" strokeWidth="1.5" />
      <text x="220" y="234" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">×</text>
    </g>

    {/* 视觉检测工位 1-3 */}
    {[
      { x: 95,  y: 380, label: '视觉检测工位1' },
      { x: 215, y: 380, label: '视觉检测工位2' },
      { x: 335, y: 380, label: '视觉检测工位3' },
    ].map(t => (
      <g key={t.label}>
        <rect x={t.x - 38} y={t.y} width="76" height="38" rx="3" fill="url(#nodeG)" stroke="#ef5a4a" />
        <rect x={t.x - 30} y={t.y + 6} width="60" height="20" rx="2" fill="#0a1f3d" stroke="#3f86c8" />
        <text x={t.x} y={t.y + 54} textAnchor="middle" fontSize="10" fill="#ffd4cf">{t.label}</text>
        <circle cx={t.x + 32} cy={t.y - 4} r="4" fill="#ef5350" />
      </g>
    ))}

    {/* AGV 终端 1-3 */}
    {[
      { x: 95,  y: 430, label: 'AGV终端1' },
      { x: 215, y: 430, label: 'AGV终端2' },
      { x: 335, y: 430, label: 'AGV终端3' },
    ].map(t => (
      <g key={t.label}>
        <rect x={t.x - 32} y={t.y} width="64" height="30" rx="6" fill="url(#nodeG)" stroke="#f5b963" />
        <rect x={t.x - 22} y={t.y + 4} width="44" height="14" rx="2" fill="#0a1f3d" stroke="#79d0ff" />
        <text x={t.x} y={t.y + 46} textAnchor="middle" fontSize="10" fill="#fff0d4">{t.label}</text>
        <circle cx={t.x + 28} cy={t.y - 2} r="4" fill="#f5b963" />
      </g>
    ))}

    {/* 摄像头 1-3 */}
    {[95, 215, 335].map((x, i) => (
      <g key={i}>
        <circle cx={x} cy={490} r="13" fill="url(#nodeG)" stroke="#f5b963" />
        <rect x={x - 8} y={486} width="16" height="8" rx="1" fill="#0a1f3d" stroke="#79d0ff" />
        <text x={x} y={518} textAnchor="middle" fontSize="10" fill="#fff0d4">摄像头{i + 1}</text>
      </g>
    ))}

    {/* PLC控制器 / 边缘服务器 */}
    <g>
      <rect x="400" y="370" width="76" height="40" rx="3" fill="url(#nodeG)" stroke="#f5b963" />
      <rect x="408" y="378" width="60" height="22" rx="2" fill="#0a1f3d" stroke="#3f86c8" />
      <text x="438" y="424" textAnchor="middle" fontSize="10" fill="#fff0d4">PLC控制器</text>
      <circle cx="466" cy="366" r="4" fill="#f5b963" />

      <rect x="400" y="450" width="76" height="40" rx="3" fill="url(#nodeG)" stroke="#f5b963" />
      <rect x="408" y="458" width="60" height="22" rx="2" fill="#0a1f3d" stroke="#3f86c8" />
      <text x="438" y="504" textAnchor="middle" fontSize="10" fill="#fff0d4">边缘服务器</text>
      <circle cx="466" cy="446" r="4" fill="#f5b963" />
    </g>

    {/* PLC控制器-备 / SW-A-02 / 产线服务器 */}
    <g>
      <rect x="540" y="230" width="100" height="44" rx="5" fill="url(#nodeG)" stroke="#5fb4ff" />
      <text x="590" y="252" textAnchor="middle" fontSize="11" fill="#cfe5ff">PLC控制器-备</text>
      <text x="590" y="266" textAnchor="middle" fontSize="10" fill="#6ce09a">备</text>

      <rect x="690" y="200" width="100" height="44" rx="5" fill="url(#nodeG)" stroke="#5fb4ff" />
      <text x="740" y="220" textAnchor="middle" fontSize="11" fill="#cfe5ff">SW-A-02</text>
      <circle cx="780" cy="210" r="3.5" fill="#6ce09a" />

      <rect x="690" y="370" width="100" height="44" rx="5" fill="url(#nodeG)" stroke="#5fb4ff" />
      <text x="740" y="392" textAnchor="middle" fontSize="11" fill="#cfe5ff">产线服务器</text>
      <circle cx="780" cy="380" r="3.5" fill="#6ce09a" />
    </g>

    {/* 链路 */}
    <g fill="none">
      {/* 故障链路 */}
      <path d="M300 176 L180 230" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M180 320 L95 380" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M180 320 L215 380" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M180 320 L335 380" stroke="#ef5350" strokeDasharray="5 3" />
      <path d="M180 320 L95 430"  stroke="#ef5350" strokeDasharray="5 3" opacity="0.6" />
      <path d="M180 320 L215 430" stroke="#ef5350" strokeDasharray="5 3" opacity="0.6" />
      <path d="M180 320 L335 430" stroke="#ef5350" strokeDasharray="5 3" opacity="0.6" />
      <path d="M180 320 L95 490"  stroke="#ef5350" strokeDasharray="5 3" opacity="0.4" />
      <path d="M180 320 L215 490" stroke="#ef5350" strokeDasharray="5 3" opacity="0.4" />
      <path d="M180 320 L335 490" stroke="#ef5350" strokeDasharray="5 3" opacity="0.4" />
      {/* 正常链路 */}
      <path d="M560 176 L740 200" stroke="#4fc1ff" />
      <path d="M740 244 L590 230" stroke="#4fc1ff" />
      <path d="M740 244 V370" stroke="#4fc1ff" />
      <path d="M438 410 L438 450" stroke="#4fc1ff" strokeDasharray="2 2" />
    </g>
  </svg>
);

// ── 时间轴右上角浮窗 ─────────────────────────────────────────────────
const TimelineCard: React.FC = () => (
  <div className="absolute right-3 top-20 w-[150px] rounded border border-[#1b4378] bg-[#082040]/92 p-2 backdrop-blur-sm">
    <div className="mb-1.5 flex items-center text-[11px] text-[#a9c8ee]">
      <span className="mr-1.5 inline-block h-2.5 w-[3px] rounded-sm bg-[#4fc1ff]" />
      推演时间轴
    </div>
    <div className="space-y-1.5">
      {DEDUCE_TIMELINE.map((t, i) => (
        <div key={i} className="flex items-start gap-1.5 text-[10.5px]">
          <div className="mt-1"><StatusDot s={t.status} /></div>
          <div className="leading-tight">
            <div className="font-mono font-bold text-[#e8f3ff]">{t.time}</div>
            <div className="text-[#a9c8ee]">{t.title}</div>
            <div className="text-[10px] text-[#7e9fc8]">{t.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ConfigRow: React.FC<{ icon: React.ReactNode; k: string; v: React.ReactNode }> = ({ icon, k, v }) => (
  <div className="grid grid-cols-[18px_80px_1fr] items-center gap-2 rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
    <span className="text-[#79d0ff]">{icon}</span>
    <span className="text-[11.5px] text-[#7e9fc8]">{k}</span>
    <span className="text-[12px] text-[#e8f3ff]">{v}</span>
  </div>
);

const Slider: React.FC<{ label: string; value: number; unit: string; min: number; max: number; onChange: (v: number) => void }> = ({ label, value, unit, min, max, onChange }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-[11.5px]">
      <span className="text-[#a9c8ee]">{label}</span>
      <span className="font-mono font-bold text-[#79d0ff]">{value} {unit}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="dt-range w-full" />
    <style>{`
      input.dt-range { -webkit-appearance: none; appearance: none; height: 4px; background: #0a1f3d; border-radius: 2px; outline: none; }
      input.dt-range::-webkit-slider-runnable-track { height: 4px; background: linear-gradient(90deg,#4fc1ff,#79d0ff); border-radius: 2px; }
      input.dt-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #79d0ff; border: 2px solid #cfe9ff; margin-top: -5px; box-shadow: 0 0 6px #4fc1ff; cursor: pointer; }
    `}</style>
  </div>
);

const KV: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="rounded border border-[#143258] bg-[#081f3d]/65 px-2.5 py-1.5">
    <div className="mb-0.5 text-[10.5px] text-[#7e9fc8]">{k}</div>
    <div className="text-[12.5px] text-[#e8f3ff]">{v}</div>
  </div>
);

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex items-center justify-center gap-1 rounded border border-[#2b6aa8] bg-[linear-gradient(180deg,#0d2e5b_0%,#0a2547_100%)] px-2 py-1.5 text-[11.5px] font-semibold text-[#a9c8ee] transition hover:border-[#4fc1ff] hover:bg-[#103968] hover:text-[#e8f3ff]">
    {icon}{label}
  </button>
);

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center justify-center gap-1 rounded border border-[#143258] bg-[#081f3d]/65 py-1 text-[10.5px] text-[#a9c8ee]">
    <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />{label}
  </div>
);

export const DeductionView: React.FC = () => {
  const [link, setLink] = useState(80);
  const [step, setStep] = useState(5);
  const [eta, setEta] = useState(15);

  return (
    <div
      className="grid h-full min-h-0 gap-1.5"
      style={{ gridTemplateColumns: 'minmax(220px, clamp(220px, 18vw, 320px)) minmax(0, 1fr) minmax(240px, clamp(260px, 20vw, 340px))' }}
    >
      {/* ===== 左列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[6] min-h-0 overflow-hidden'}>
          <DtSectionTitle
            title="推演配置"
            right={<span className="rounded bg-[#b07a2a] px-1.5 py-[1px] text-[10.5px] font-bold text-white">模拟数据</span>}
          />
          <div className="flex-1 space-y-1.5">
            <ConfigRow icon={<Target size={13} />}      k="故障对象" v="SW-A-01 接入交换机" />
            <ConfigRow icon={<AlertOctagon size={13} />} k="故障类型" v={<span className="text-[#ff8a7a]">● 设备离线</span>} />
            <ConfigRow icon={<Clock size={13} />}        k="持续时间" v="30 分钟" />
            <ConfigRow icon={<Clock size={13} />}        k="开始时间" v="14:30" />
            <ConfigRow icon={<Activity size={13} />}     k="影响模型" v="链路依赖 + 业务映射" />
            <ConfigRow icon={<Database size={13} />}     k="数据来源" v="真实拓扑 / 模拟规则" />
          </div>
        </div>

        <div className={dtPanel + ' flex-[3] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="推演参数" />
          <div className="flex-1 space-y-3 overflow-auto text-[#e8f3ff] custom-scrollbar pr-0.5">
            <Slider label="链路切换阈值" value={link} unit="%"     min={0} max={100} onChange={setLink} />
            <Slider label="告警扩散步长" value={step} unit="分钟"  min={1} max={30}  onChange={setStep} />
            <Slider label="业务恢复目标" value={eta}  unit="分钟"  min={5} max={60}  onChange={setEta} />
          </div>
        </div>

        <div className={dtPanel + ' flex-[1] min-h-0 overflow-hidden'}>
          <div className="mb-1 flex items-center text-[11px] text-[#a9c8ee]">
            <span className="mr-2 inline-block h-2.5 w-[3px] rounded-sm bg-[#4fc1ff]" />
            状态图例
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <Legend color="#6ce09a" label="正常" />
            <Legend color="#f5b963" label="告警" />
            <Legend color="#ef5350" label="严重" />
            <Legend color="#7a96b6" label="离线" />
          </div>
        </div>
      </div>

      {/* ===== 中间推演场景 ===== */}
      <div className={dtPanel + ' min-h-0 overflow-hidden'}>
        <DtSceneHeader
          title="A区产线 · 区域/网络关系"
          right={<button className="ml-1.5 rounded border border-[#2b6aa8] bg-[#0d2e5b] px-2 py-[3px] text-[11px] text-[#a9c8ee] hover:border-[#4fc1ff]">切换区域</button>}
        />
        <div className="relative mb-1.5 min-h-0 flex-[4] overflow-hidden rounded border border-[#1b4378] bg-[#03132a]">
          <DeduceScene />
          {/* 右上小地图 */}
          <div className="absolute right-3 top-3 h-[60px] w-[100px] overflow-hidden rounded border border-[#2b6aa8] bg-[#0b2f61]/80 backdrop-blur-sm">
            <div className="flex h-full items-center justify-center text-[11px] font-bold text-[#cfe5ff]">A区 概览</div>
          </div>
          <TimelineCard />
        </div>

        {/* 底部推演时间轴 */}
        <div className="flex min-h-0 flex-[1] shrink-0 flex-col rounded border border-[#1b4378] bg-[#081c3a] p-2">
          <div className="mb-1 flex items-center text-[11.5px] text-[#a9c8ee]">
            <span className="mr-2 inline-block h-2.5 w-[3px] rounded-sm bg-[#4fc1ff]" />
            推演时间轴（最近 30 分钟）
          </div>
          <div className="mt-1 flex items-center gap-3 px-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-[#5fb4ff] bg-[linear-gradient(180deg,#114a8a,#0a2f63)] text-[#79d0ff] hover:brightness-110">
              <Play size={14} />
            </button>
            <div className="relative flex-1">
              <div className="absolute inset-y-1/2 h-[4px] w-full -translate-y-1/2 rounded bg-[#0a1f3d]" />
              <div className="absolute inset-y-1/2 h-[4px] w-[80%] -translate-y-1/2 rounded bg-[linear-gradient(90deg,#4fc1ff,#f5b963_55%,#ef5350_72%,#6ce09a)]" />
              <div className="relative flex justify-between text-[9px] text-[#7e9fc8]">
                {['14:00','14:05','14:10','14:15','14:20','14:25','14:30','14:35','14:40','14:45','14:50','14:55','15:00'].map((t, i) => {
                  const dotColor = i === 6 || i === 7 ? '#ef5350' : i === 9 ? '#f5b963' : i === 12 ? '#6ce09a' : '#4fc1ff';
                  return (
                    <div key={t} className="flex flex-col items-center">
                      <div className="mb-1 h-2.5 w-2.5 rounded-full" style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }} />
                      <span className="font-mono">{t}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-[#7e9fc8]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#4fc1ff]" />正常</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f5b963]" />告警</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef5350]" />严重</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#6ce09a]" />恢复</span>
          </div>
        </div>
      </div>

      {/* ===== 右列 ===== */}
      <div className="flex min-h-0 flex-col gap-1.5">
        <div className={dtPanel + ' flex-[5] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="推演结果" />
          <div className="flex-1 space-y-1.5 overflow-auto custom-scrollbar pr-0.5">
            <KV k="受影响业务"      v="视觉检测、AGV调度、视频监控" />
            <KV k="受影响设备"      v="8 台终端" />
            <KV k="风险等级"        v={<DtStatusBadge status="严重" />} />
            <KV k="预计恢复时间"    v={<span className="font-mono font-bold text-[#e8f3ff]">{eta} 分钟</span>} />
            <KV k="建议处置" v={
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11.5px]"><CheckCircle2 size={12} className="text-[#6ce09a]" />切换备用链路</div>
                <div className="flex items-center gap-1.5 text-[11.5px]"><CheckCircle2 size={12} className="text-[#6ce09a]" />派发工单</div>
                <div className="flex items-center gap-1.5 text-[11.5px]"><CheckCircle2 size={12} className="text-[#6ce09a]" />通知产线负责人</div>
              </div>
            } />
          </div>
        </div>

        <div className={dtPanel + ' flex-[4] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="方案对比" />
          <div className="flex-1 overflow-auto custom-scrollbar pr-0.5">
          <table className="w-full text-[11.5px] text-[#e8f3ff]">
            <thead>
              <tr className="text-[10.5px] text-[#7e9fc8]">
                <th className="pb-1 text-left">方案</th>
                <th className="pb-1 text-left">处置方式</th>
                <th className="pb-1 text-center">恢复时间</th>
                <th className="pb-1 text-center">风险</th>
              </tr>
            </thead>
            <tbody>
              {DEDUCE_PLANS.map(p => {
                const riskCls = p.risk === '低'
                  ? { color: '#6ce09a', border: '#1d6a45', bg: 'rgba(15,68,42,0.55)' }
                  : { color: '#f5d263', border: '#7a5c1d', bg: 'rgba(80,60,16,0.55)' };
                return (
                  <tr key={p.id} className="border-t border-[#143258]">
                    <td className="py-1.5 font-bold text-[#cfe9ff]">{p.name}</td>
                    <td>{p.method}</td>
                    <td className="text-center font-mono">{p.eta}</td>
                    <td className="text-center">
                      <span
                        className="inline-flex h-[18px] items-center rounded border px-2 text-[10.5px] font-bold leading-none"
                        style={{ color: riskCls.color, borderColor: riskCls.border, background: riskCls.bg }}
                      >
                        {p.risk}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        <div className={dtPanel + ' flex-[1.5] min-h-0 overflow-hidden'}>
          <DtSectionTitle title="操作" />
          <div className="grid grid-cols-3 gap-1.5">
            <ActionBtn icon={<Save size={13} />}     label="保存为预案" />
            <ActionBtn icon={<FileText size={13} />} label="导出报告" />
            <ActionBtn icon={<Scale size={13} />}    label="对比其他方案" />
          </div>
        </div>
      </div>
    </div>
  );
};
