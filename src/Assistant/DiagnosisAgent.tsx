
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Search, Network, Zap, ShieldAlert, CheckCircle2, 
  AlertTriangle, Loader2, Send, ChevronRight, History, 
  Database, Radio, FileSearch, ArrowRightLeft, AlertCircle, Sparkles,
  Pause, Play, SkipForward, ArrowLeft, RefreshCcw, TrendingDown, X
} from 'lucide-react';
import { Button, Badge, SectionTitle, Input } from '../components/UI';
import { DiagnosisStep } from './types';

interface DiagnosisAgentProps {
  onTransfer: (data: any) => void;
  embedded?: boolean;
  onClose?: () => void;
}

export const DiagnosisAgent: React.FC<DiagnosisAgentProps> = ({ onTransfer, embedded = false, onClose }) => {
  const [stage, setStage] = useState<'input' | 'processing' | 'conclusion' | 'jump'>('input');
  const [isPaused, setIsPaused] = useState(false);
  const [simMode, setSimMode] = useState<'normal' | 'cut' | 'voice' | 'quality'>('normal');
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [userInput, setUserInput] = useState('');
  const [context, setContext] = useState<any>({
    customer: '安徽省电力公司',
    bizType: '互联网专线',
    instanceId: 'AH-POWER-INET-001',
  });
  
  const [steps, setSteps] = useState<DiagnosisStep[]>([
    { id: '1', name: '运营商侧物理接口探测', status: 'pending' },
    { id: '2', name: '全路路径告警核查', status: 'pending' },
    { id: '3', name: '业务层面分流拨测 (ICMP/SIP)', status: 'pending' },
    { id: '4', name: '端到端性能快照导出', status: 'pending' }
  ]);

  const [evidence, setEvidence] = useState<any[]>([]);
  const [conclusion, setConclusion] = useState<string>('');
  const [evidenceValues, setEvidenceValues] = useState<any>({});

  // 核心控制逻辑
  useEffect(() => {
    let timer: any;
    if (stage === 'processing' && !isPaused && currentStepIdx < steps.length) {
        timer = setTimeout(() => {
            executeNextStep();
        }, 1500);
    }
    return () => clearTimeout(timer);
  }, [stage, isPaused, currentStepIdx]);

  const executeNextStep = async () => {
      const idx = currentStepIdx === -1 ? 0 : currentStepIdx;
      if (idx >= steps.length) return;

      const step = steps[idx];
      updateStep(step.id, 'processing');

      // 模拟每步逻辑
      if (idx === 0) {
          if (simMode === 'cut') {
              updateStep(step.id, 'error', '端口状态: DOWN (LOS告警)');
              finishDiagnosis('运营商侧外线物理中断。检测到物理层信号丢失，已自动派单至线路维保组。');
              return;
          }
          updateStep(step.id, 'success', '接口状态: NORMAL');
          addEvidence('接口探测', '上联端口 A/B 路负载均衡正常，未见物理翻转。');
      } else if (idx === 1) {
          updateStep(step.id, 'success', '全路告警核查完成');
          addEvidence('告警分析', '查得近1小时内无异常掉电或高阶路径LOS告警。');
      } else if (idx === 2) {
          if (context.bizType === '语音专线') {
              updateStep(step.id, 'error', '企业侧 PBX 拨测超时');
              setEvidenceValues({ sip: 'Auth Failed', gateway: 'Unreachable' });
              addEvidence('业务拨测', 'SIP 信令握手失败，对端网关 10.224.1.5 无响应。');
              finishDiagnosis('语音专线业务异常。定位为客户侧企业网关（PBX）宕机或配置丢失，请检查本地供电及配置态。');
              return;
          }
          // 互联网专线质量问题
          if (simMode === 'quality') {
              updateStep(step.id, 'success', 'PING 丢包率: 15%');
              setEvidenceValues({ ping: '15%', gateway: 'Normal' });
              addEvidence('质量拨测', '关键路径存在突发性丢包，物理链路通畅但业务质差。');
          } else {
              updateStep(step.id, 'success', '拨测正常');
              addEvidence('业务拨测', 'PING丢包率 0%，时延 8ms。');
          }
      } else if (idx === 3) {
          updateStep(step.id, 'success', '性能指标导出成功');
          addEvidence('性能快照', '光功率: -14.2dBm, 流量峰值: 45Mbps。');
          
          // 最后流转判断
          if (context.bizType === '互联网专线' && simMode === 'quality') {
              setStage('jump');
          } else {
              finishDiagnosis('业务运行基本正常。未发现明显故障根因，建议联系二线专家进行更深层次的数据流包头分析。');
          }
          return;
      }

      setCurrentStepIdx(idx + 1);
  };

  const handleStart = (mode: 'normal' | 'cut' | 'voice' | 'quality') => {
    setSimMode(mode);
    setContext({
        customer: mode === 'voice' ? '江淮汽车集团' : '安徽省电力公司',
        bizType: mode === 'voice' ? '语音专线' : '互联网专线',
        instanceId: mode === 'voice' ? 'JAC-VOICE-102' : 'AH-POWER-INET-001'
    });
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending', result: undefined })));
    setEvidence([]);
    setEvidenceValues({});
    setCurrentStepIdx(0);
    setStage('processing');
    setIsPaused(false);
  };

  const updateStep = (id: string, status: any, result?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, result } : s));
  };

  const addEvidence = (label: string, value: string) => {
    setEvidence(prev => [...prev, { label, value }]);
  };

  const finishDiagnosis = (msg: string) => {
    setConclusion(msg);
    setStage('conclusion');
  };

  const resetAll = () => {
    if (onClose) onClose();
    setStage('input');
    setSimMode('normal');
    setCurrentStepIdx(-1);
    setEvidence([]);
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${embedded ? 'min-h-[450px] bg-[var(--sys-bg-page)]' : 'bg-[var(--sys-bg-page)]'}`}>
      {stage === 'input' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 animate-in fade-in zoom-in duration-500 relative">
            {embedded && (
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            )}
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 shadow-lg mb-4">
                    <Activity size={32} className="text-indigo-500 animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-white">一键自动化诊断引擎</h2>
                <p className="text-slate-500 text-xs mt-1">智能编排多源拨测，即刻定位业务根因</p>
            </div>
            
            <div className="w-full max-w-lg bg-[var(--sys-bg-header)] border border-slate-800 rounded-2xl p-1.5 flex gap-2 shadow-2xl focus-within:border-indigo-500/50 transition-all">
                <input 
                    className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-slate-600 outline-none"
                    placeholder="输入业务标识或客户名称..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                />
                <Button 
                    className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-500 border-none h-10 text-xs font-bold"
                    onClick={() => handleStart('normal')}
                    disabled={!userInput.trim()}
                >
                    发起诊断
                </Button>
            </div>

            <div className="space-y-3 w-full max-w-lg">
                <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest text-center">快捷演示场景</div>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleStart('cut')} className="group flex flex-col items-center gap-2 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-red-500/50 hover:bg-red-500/5 transition-all text-center">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertCircle size={20}/>
                        </div>
                        <div className="text-[10px] font-bold text-white">物理层中断</div>
                    </button>
                    <button onClick={() => handleStart('voice')} className="group flex flex-col items-center gap-2 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Radio size={20}/>
                        </div>
                        <div className="text-[10px] font-bold text-white">语音业务故障</div>
                    </button>
                    <button onClick={() => handleStart('quality')} className="group flex flex-col items-center gap-2 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-center">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingDown size={20}/>
                        </div>
                        <div className="text-[10px] font-bold text-white">丢包/质差</div>
                    </button>
                </div>
            </div>
        </div>
      )}

      {(stage === 'processing' || stage === 'jump' || stage === 'conclusion') && (
        <div className="flex-1 flex overflow-hidden animate-in slide-in-from-right-10 duration-500">
            {/* Left Control Column */}
            <div className={`w-64 border-r border-slate-800 p-6 flex flex-col bg-[var(--sys-bg-header)]/20 ${embedded ? 'hidden md:flex' : ''}`}>
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">任务编排流水线</span>
                    <button onClick={resetAll} className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white" title="重置诊断">
                        <ArrowLeft size={16}/>
                    </button>
                </div>
                
                <div className="space-y-4 flex-1">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="relative pl-8">
                            <div className={`absolute left-0 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                step.status === 'success' ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                (step.status === 'processing' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 
                                (step.status === 'error' ? 'bg-red-500 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-600'))
                            }`}>
                                {step.status === 'success' ? <CheckCircle2 size={12}/> : (step.status === 'processing' ? <Loader2 size={12} className="animate-spin"/> : (step.status === 'error' ? <AlertCircle size={12}/> : <span className="text-[10px]">{idx+1}</span>))}
                            </div>
                            {idx < steps.length - 1 && <div className="absolute left-[10px] top-6 bottom-[-16px] w-[1px] bg-slate-800"></div>}
                            
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-bold ${step.status === 'processing' ? 'text-indigo-400' : (step.status === 'pending' ? 'text-slate-500' : 'text-slate-200')}`}>{step.name}</span>
                                {step.result && <span className={`text-[9px] mt-1 italic ${step.status === 'error' ? 'text-red-400' : 'text-slate-500'}`}>{step.result}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {stage === 'processing' && (
                    <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-3">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-slate-800 hover:bg-slate-700 border-none h-8 text-[10px]"
                            onClick={() => setIsPaused(!isPaused)}
                            icon={isPaused ? <Play size={12}/> : <Pause size={12}/>}
                        >
                            {isPaused ? '运行' : '暂停'}
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-slate-800 hover:bg-slate-700 border-none h-8 text-[10px]"
                            onClick={() => executeNextStep()}
                            disabled={isPaused}
                            icon={<SkipForward size={12}/>}
                        >
                            跳过
                        </Button>
                    </div>
                )}
            </div>

            {/* Right Evidence Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Database size={18} className="text-indigo-500" />
                        自动化证据链采集
                    </h2>
                    {(stage === 'conclusion' || stage === 'jump') && (
                        <Button size="sm" variant="secondary" onClick={resetAll} className="h-8 text-[10px]" icon={<RefreshCcw size={12}/>}>重新诊断</Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {evidence.map((ev, i) => (
                        <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all group relative overflow-hidden animate-in fade-in slide-in-from-left-4">
                            <div className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">{ev.label}</div>
                            <div className="text-xs text-slate-200 leading-relaxed font-medium">{ev.value}</div>
                        </div>
                    ))}
                    {stage === 'processing' && (
                        <div className="col-span-1 md:col-span-2 py-6 flex flex-col items-center justify-center text-slate-700 border-2 border-dashed border-slate-800 rounded-2xl">
                            <Loader2 size={24} className="animate-spin mb-2 opacity-20"/>
                            <span className="text-xs font-medium">实时证据采集中...</span>
                        </div>
                    )}
                </div>

                {stage === 'conclusion' && (
                    <div className="mt-auto bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden animate-in zoom-in duration-500 shadow-2xl">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Sparkles size={60} className="text-indigo-500"/></div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-red-500 rounded-lg shadow-lg">
                                <ShieldAlert size={18} className="text-white" />
                            </div>
                            <h3 className="text-base font-black text-white tracking-tight">智能诊断结论</h3>
                        </div>
                        <p className="text-lg font-bold text-indigo-50 text-left leading-snug mb-6">{conclusion}</p>
                        
                        <div className="flex gap-4">
                            {evidenceValues.ping && (
                                <div className="bg-black/40 px-4 py-3 rounded-xl border border-slate-800">
                                    <div className="text-[9px] text-slate-500 uppercase font-black mb-0.5">PING 丢包</div>
                                    <div className="text-base font-black text-red-400 font-mono">{evidenceValues.ping}</div>
                                </div>
                            )}
                            {evidenceValues.sip && (
                                <div className="bg-black/40 px-4 py-3 rounded-xl border border-slate-800">
                                    <div className="text-[9px] text-slate-500 uppercase font-black mb-0.5">SIP 状态</div>
                                    <div className="text-base font-black text-red-400 font-mono">{evidenceValues.sip}</div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-slate-500">
                                <AlertCircle size={12}/>
                                <span className="text-[10px] font-medium">置信度：98.4%</span>
                            </div>
                            <Button 
                              onClick={() => onTransfer({ context, evidence, conclusion })}
                              className="bg-indigo-600 hover:bg-indigo-500 border-none px-6 h-10 rounded-xl text-xs font-bold shadow-xl shadow-indigo-900/40"
                            >
                              转入人工专家席位
                            </Button>
                        </div>
                    </div>
                )}

                {stage === 'jump' && (
                    <div className="mt-auto bg-blue-900/10 border border-blue-500/30 rounded-2xl p-8 text-center space-y-4 animate-in slide-in-from-bottom-6 duration-700 shadow-2xl relative overflow-hidden">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-blue-500/10">
                            <ArrowRightLeft size={32} className="text-blue-400 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black text-white">进入互联网业务多维定界</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">系统检测到业务质差。正在携带 12 项技术证据同步跳转至定界分析平台...</p>
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin text-blue-500" />
                            <span className="text-[9px] text-blue-400 font-black tracking-widest uppercase">证据同步中: 物理/告警/SIP</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
