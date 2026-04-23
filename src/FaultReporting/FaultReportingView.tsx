
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, 
  Loader2, Maximize2, Minimize2, X, Zap, Network, Signal, 
  Cpu, FileText, Send, ChevronRight, BarChart3, Search,
  ArrowRight, Link as LinkIcon, Check
} from 'lucide-react';
import { Button, Badge, SectionTitle, Input } from '../components/UI';
import { AssetDiagnostic, AssetType, DiagnosticStatus } from './types';

interface FaultReportingProps {
  mode: 'full' | 'half';
  onToggleMode: () => void;
  onClose: () => void;
}

export const FaultReportingView: React.FC<FaultReportingProps> = ({ mode, onToggleMode, onClose }) => {
  const [step, setStep] = useState<'idle' | 'scanning' | 'report' | 'form'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<AssetDiagnostic[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetDiagnostic | null>(null);
  const [ticketMemo, setTicketMemo] = useState('');

  // 模拟探测逻辑
  const startDetection = () => {
    setStep('scanning');
    setScanProgress(0);
    setResults([]);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(generateMockResults, 500);
          return 100;
        }
        return prev + 4;
      });
    }, 60);
  };

  const generateMockResults = () => {
    const mockResults: AssetDiagnostic[] = [
      {
        id: 'ast-001',
        name: '合肥-南京 10G 政企专线',
        type: 'LINE',
        uuid: 'LINE-HF-NJ-001-QAX',
        overallStatus: 'fault',
        suggestion: '检测到链路丢包率持续异常，物理层可能存在光功率衰减，建议立即报障。',
        metrics: [
          { name: 'Ping 时延', value: '45', unit: 'ms', status: 'warning' },
          { name: '抖动', value: '12', unit: 'ms', status: 'warning' },
          { name: '丢包率', value: '18.5', unit: '%', status: 'fault' },
          { name: '出口带宽利用率', value: '92.4', unit: '%', status: 'warning' }
        ]
      },
      {
        id: 'ast-002',
        name: '海尔智能工厂 5G-CPE-05',
        type: '5G',
        uuid: '5G-CPE-HEIL-05',
        overallStatus: 'normal',
        metrics: [
          { name: '信号强度 (RSRP)', value: '-85', unit: 'dBm', status: 'normal' },
          { name: '信噪比 (SINR)', value: '22', unit: 'dB', status: 'normal' },
          { name: 'SIM 卡状态', value: '正常', unit: '', status: 'normal' },
          { name: '限速状态', value: '未限速', unit: '', status: 'normal' }
        ]
      },
      {
        id: 'ast-003',
        name: '智算中心 A1 节点集群',
        type: 'IDC',
        uuid: 'GPU-CLUSTER-A1-NODE',
        overallStatus: 'warning',
        suggestion: '节点心跳正常，但动环系统监测到环境湿度超出阈值（预警线）。',
        metrics: [
          { name: '心跳状态', value: 'Active', unit: '', status: 'normal' },
          { name: '节点利用率', value: '76', unit: '%', status: 'normal' },
          { name: '机柜湿度', value: '72', unit: '%RH', status: 'warning' },
          { name: 'PUE 效能', value: '1.25', unit: '', status: 'normal' }
        ]
      },
      {
        id: 'ast-004',
        name: '上海分公司 SD-WAN 接入网关',
        type: 'SDWAN',
        uuid: 'SDWAN-GW-SH-02',
        overallStatus: 'normal',
        metrics: [
          { name: '隧道时延', value: '28', unit: 'ms', status: 'normal' },
          { name: '丢包率', value: '0.01', unit: '%', status: 'normal' },
          { name: '控制器连接', value: '稳定', unit: '', status: 'normal' }
        ]
      }
    ];
    setResults(mockResults);
    setStep('report');
  };

  const handleGoToReport = (asset: AssetDiagnostic) => {
    setSelectedAsset(asset);
    setTicketMemo(`【一键体检报障】检测到资产 ${asset.name} 存在 ${asset.overallStatus === 'fault' ? '严重故障' : '运行异常'}。系统建议：${asset.suggestion}`);
    setStep('form');
  };

  const submitTicket = () => {
    setStep('scanning'); // 借用扫描态显示提交中
    setTimeout(() => {
      alert(`故障工单提交成功！\n\n单号：TKT-${Date.now().toString().slice(-8)}\n已自动关联报告：https://ops-guardian.com/report/${selectedAsset?.uuid}\n关联资产UUID：${selectedAsset?.uuid}`);
      onClose();
    }, 1500);
  };

  const getStatusColor = (status: DiagnosticStatus) => {
    switch (status) {
      case 'normal': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'fault': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'LINE': return <Network size={20} />;
      case '5G': return <Signal size={20} />;
      case 'IDC': return <Cpu size={20} />;
      case 'SDWAN': return <Zap size={20} />;
    }
  };

  return (
    <div className="flex h-full bg-[var(--sys-bg-page)] text-slate-200 overflow-hidden flex-col font-sans">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[var(--sys-bg-header)] shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600/20 rounded-lg">
            <ShieldAlert className="text-amber-500" size={20} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">智能体检 & 一键报障</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleMode} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 transition-colors">
            {mode === 'half' ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-md text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-[var(--sys-bg-header)]/20 to-[var(--sys-bg-page)]">
        {step === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-10 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="w-36 h-36 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)]">
                <Activity size={56} className="text-blue-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 w-36 h-36 rounded-full border-2 border-blue-500/40 animate-ping opacity-20"></div>
            </div>
            <div className="max-w-lg">
              <h1 className="text-3xl font-black text-white mb-4 tracking-tight">名下资产实时健康探测</h1>
              <p className="text-slate-400 leading-relaxed">
                针对专线时延丢包、5G终端信号、智算节点存活及动环越限进行一键自动化深度扫描。发现隐患可立即发起带有详细诊断报告的报障单。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 w-full max-w-xl">
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <div className="text-blue-400 mb-2 flex justify-center"><Network size={24}/></div>
                    <div className="text-xs text-slate-300">专线/SD-WAN</div>
                    <div className="text-[10px] text-slate-500 mt-1">丢包、抖动、利用率</div>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <div className="text-emerald-400 mb-2 flex justify-center"><Signal size={24}/></div>
                    <div className="text-xs text-slate-300">5G 专网</div>
                    <div className="text-[10px] text-slate-500 mt-1">信号(RSRP)、在线态</div>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <div className="text-purple-400 mb-2 flex justify-center"><Cpu size={24}/></div>
                    <div className="text-xs text-slate-300">智算/IDC</div>
                    <div className="text-[10px] text-slate-500 mt-1">心跳、动环越限监测</div>
                 </div>
            </div>
            <Button 
                onClick={startDetection} 
                className="bg-blue-600 hover:bg-blue-500 h-16 px-12 rounded-2xl font-black text-xl shadow-2xl shadow-blue-900/40 border-none group"
            >
                开始一键体检
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {step === 'scanning' && (
          <div className="h-full flex flex-col items-center justify-center p-10 animate-in fade-in duration-300">
             <div className="relative mb-10">
                <Loader2 className="w-24 h-24 text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-lg font-bold font-mono text-blue-400">
                    {scanProgress}%
                </div>
             </div>
             <div className="w-80 h-3 bg-slate-800 rounded-full overflow-hidden mb-6 shadow-inner border border-slate-700">
                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
             </div>
             <div className="text-slate-200 text-lg font-bold tracking-widest uppercase animate-pulse">
                {scanProgress < 25 ? '初始化探测引擎...' : (scanProgress < 50 ? '正在检测政企专线链路...' : (scanProgress < 75 ? '正在扫描 5G 终端状态...' : '正在解析动环监测指标...')) }
             </div>
             <div className="text-slate-500 text-xs mt-4 font-mono">ESTABLISHING SECURE CONNECTION TO ASSET MONITORING INTERFACE...</div>
          </div>
        )}

        {step === 'report' && (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom-6 duration-500">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <SectionTitle title="实时诊断报告" className="mb-0" />
                    <Badge color="gray" className="py-1">生成时间: {new Date().toLocaleTimeString()}</Badge>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setStep('idle')} className="h-9">重新探测</Button>
             </div>

             <div className={`grid gap-6 ${mode === 'full' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {results.map(asset => (
                  <div key={asset.id} className={`group bg-slate-900/40 border rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl ${asset.overallStatus === 'fault' ? 'border-red-500/40 bg-red-950/5' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${asset.overallStatus === 'fault' ? 'bg-red-500/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                                {getAssetIcon(asset.type)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{asset.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-500 font-mono tracking-tight">{asset.uuid}</span>
                                    <Badge color={asset.overallStatus === 'normal' ? 'green' : (asset.overallStatus === 'warning' ? 'yellow' : 'red')} className="scale-75 origin-left">
                                        {asset.overallStatus === 'normal' ? '运行正常' : (asset.overallStatus === 'warning' ? '预警状态' : '探测到故障')}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        {asset.overallStatus === 'fault' && (
                            <Button 
                                onClick={() => handleGoToReport(asset)} 
                                className="bg-red-600 hover:bg-red-500 border-none animate-bounce-slow h-10 px-4 text-xs font-bold shadow-lg shadow-red-900/40"
                            >
                                一键报障
                            </Button>
                        )}
                        {asset.overallStatus === 'warning' && (
                            <Button variant="secondary" size="sm" onClick={() => handleGoToReport(asset)} className="h-10 px-4 text-xs">异常处理</Button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {asset.metrics.map((m, idx) => (
                           <div key={idx} className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 flex flex-col justify-between h-24">
                              <span className="text-[11px] text-slate-500 font-medium">{m.name}</span>
                              <div className="flex items-baseline gap-1 mt-1">
                                  <span className={`text-xl font-black font-mono ${m.status === 'fault' ? 'text-red-400' : (m.status === 'warning' ? 'text-amber-400' : 'text-slate-200')}`}>
                                      {m.value}
                                  </span>
                                  <span className="text-[10px] text-slate-500 uppercase">{m.unit}</span>
                              </div>
                              <div className={`h-1 w-full rounded-full mt-2 bg-slate-700 overflow-hidden`}>
                                 <div className={`h-full rounded-full ${m.status === 'normal' ? 'bg-emerald-500' : (m.status === 'warning' ? 'bg-amber-500' : 'bg-red-500')}`} style={{ width: '65%' }}></div>
                              </div>
                           </div>
                        ))}
                    </div>

                    {asset.suggestion && (
                        <div className={`mt-4 p-4 rounded-2xl border flex gap-3 items-start ${asset.overallStatus === 'fault' ? 'bg-red-950/20 border-red-900/50 text-red-200/80' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                            <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${asset.overallStatus === 'fault' ? 'text-red-400' : 'text-amber-400'}`} />
                            <p className="text-xs leading-relaxed italic">{asset.suggestion}</p>
                        </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        )}

        {step === 'form' && selectedAsset && (
            <div className="p-10 flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
                <button onClick={() => setStep('report')} className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-8 hover:text-blue-400 transition-colors w-fit">
                    <ArrowRight size={16} className="rotate-180" /> 返回报告列表
                </button>

                <div className="max-w-3xl mx-auto w-full space-y-10">
                    <div className="flex items-start gap-6">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${selectedAsset.overallStatus === 'fault' ? 'bg-red-600/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-amber-600/20 text-amber-500'}`}>
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">发起一键故障申告</h1>
                            <p className="text-slate-400 mt-1">系统已自动收集诊断快照，并将连同资产 UUID 提交至运维二线。</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Activity size={120} className="text-blue-500"/></div>
                        
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <SectionTitle title="关联资产详情" />
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b border-slate-800">
                                        <span className="text-xs text-slate-500">资产名称</span>
                                        <span className="text-xs text-slate-200 font-bold">{selectedAsset.name}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-800">
                                        <span className="text-xs text-slate-500">资产 UUID</span>
                                        <span className="text-xs text-blue-400 font-mono">{selectedAsset.uuid}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-800">
                                        <span className="text-xs text-slate-500">探测状态</span>
                                        <Badge color={selectedAsset.overallStatus === 'fault' ? 'red' : 'yellow'}>Critical</Badge>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><LinkIcon size={16}/></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter">诊断报告自动关联</div>
                                        <div className="text-[11px] text-blue-400 truncate">https://ops-guardian.com/r/{selectedAsset.uuid}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 flex flex-col">
                                <SectionTitle title="报障信息补充" />
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-500">故障现象描述</label>
                                        <textarea 
                                            className="w-full bg-[var(--sys-bg-page)] border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none flex-1 min-h-[120px] transition-all"
                                            value={ticketMemo}
                                            onChange={e => setTicketMemo(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="期望解决时限" defaultValue="立即 (2小时内)" disabled className="bg-slate-800/50 opacity-60" />
                                        <Input label="通知联系人" defaultValue="张工 (138****0921)" disabled className="bg-slate-800/50 opacity-60" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800 flex justify-end gap-4">
                            <Button variant="secondary" onClick={() => setStep('report')} className="h-12 px-8 rounded-xl">取消并返回</Button>
                            <Button 
                                onClick={submitTicket} 
                                className="bg-blue-600 hover:bg-blue-500 h-12 px-10 rounded-xl font-bold shadow-lg shadow-blue-900/40 border-none flex items-center gap-2"
                            >
                                <Send size={16}/>
                                确认提交工单
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 justify-center text-slate-600">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-medium">工单提交后将通过 5G 短信及系统站内信实时推送处理进度</span>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
