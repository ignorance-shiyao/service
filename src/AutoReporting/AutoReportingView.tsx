
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FilePieChart, FileText, Send, Sparkles, TrendingUp, TrendingDown, 
  ChevronRight, ArrowLeft, Loader2, Maximize2, Minimize2, X, 
  Download, Bell, CheckCircle2, LayoutDashboard, Database, 
  Network, Signal, Cpu, MessageSquare, History, Search, 
  Zap, ShieldCheck, Flag, BarChart3, Activity, AlertTriangle,
  Calendar, Clock, Check
} from 'lucide-react';
import { Button, Badge, SectionTitle, Input, Card, Modal, MetricLabel } from '../components/UI';
import { showAppToast } from '../components/AppFeedback';
import { ReportItem, BusinessSummary, ReportMetric, Recommendation } from './types';
import { MOCK_REPORTS } from './data';
import { BaseChart } from '../components/BaseChart';
import { GoogleGenAI } from "@google/genai";
import { formatRelativeTime } from '../utils/time';

interface ReportingProps {
  mode: 'full' | 'half';
  onToggleMode: () => void;
  onClose: () => void;
}

type PeriodKey = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-year' | 'last-3-months';

const PERIOD_OPTIONS: { key: PeriodKey; label: string; desc: string }[] = [
    { key: 'this-week', label: '本周', desc: '当周运行数据追踪' },
    { key: 'last-week', label: '上周', desc: '完整自然周回顾' },
    { key: 'this-month', label: '本月', desc: '当前月份实时汇总' },
    { key: 'last-month', label: '上月', desc: '上个自然月标准月报' },
    { key: 'last-3-months', label: '近三个月', desc: '季度跨度趋势分析' },
    { key: 'this-year', label: '本年', desc: '年度业务发展全景' },
];

export const AutoReportingView: React.FC<ReportingProps> = ({ mode, onToggleMode, onClose }) => {
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [view, setView] = useState<'list' | 'fusion' | 'detail'>('list');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  
  // Modal & Selection States
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [fusionProgress, setFusionProgress] = useState(0);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [drillDownMetric, setDrillDownMetric] = useState<ReportMetric | null>(null);

  // --- Date Helper ---
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const updateDatesFromPeriod = (key: PeriodKey) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (key) {
      case 'this-week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(new Date().setDate(diff));
        end = new Date();
        break;
      }
      case 'last-week': {
        const day = now.getDay();
        const mondayDiff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
        start = new Date(new Date().setDate(mondayDiff));
        end = new Date(new Date().setDate(mondayDiff + 6));
        break;
      }
      case 'this-month': {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
        break;
      }
      case 'last-month': {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      }
      case 'this-year': {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date();
        break;
      }
      case 'last-3-months': {
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = new Date();
        break;
      }
    }
    setCustomStartDate(formatDate(start));
    setCustomEndDate(formatDate(end));
  };

  // Sync dates when shortcut changes
  useEffect(() => {
    updateDatesFromPeriod(selectedPeriod);
  }, [selectedPeriod]);

  // --- Actions ---
  const handleStartGenerate = () => {
    setIsConfigOpen(false);
    setView('fusion');
    setFusionProgress(0);
    const interval = setInterval(() => {
      setFusionProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(generateReport, 800);
          return 100;
        }
        return p + 2;
      });
    }, 40);
  };

  const generateReport = async () => {
    setIsGeneratingAI(true);
    const periodLabel = PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label || '本月';
    
    let aiText = `基于${periodLabel}（${customStartDate} 至 ${customEndDate}）的大数据融合分析，业务运行整体稳定。建议加强对高负荷区域的基站巡检。`;
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
      if (!apiKey) {
        showAppToast('未配置 VITE_GEMINI_API_KEY，已使用本地模板生成简报。', {
          title: 'AI 能力未启用',
          tone: 'warning',
          duration: 2800,
        });
      } else {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `你是一名资深政企运维总监。请根据以下模拟指标生成一段150字以内的“${periodLabel}”业务简报。统计时间跨度：${customStartDate} 至 ${customEndDate}。关键指标：专线可用率99.99%，5G流量增长12%，IDC能效PUE 1.25。请根据时间周期特点（如周报侧重波动，年报侧重宏观）给出专业建议。`,
        });
        aiText = response.text || aiText;
      }
    } catch (e) {
      showAppToast('AI 生成失败，已使用模板内容。', {
        title: '报告生成降级',
        tone: 'warning',
      });
    }

    const newReport: ReportItem = {
      id: `rpt-${Date.now()}`,
      title: `2025年 ${periodLabel} 政企业务运行全景简报`,
      period: `${customStartDate} ~ ${customEndDate}`,
      createTime: new Date().toISOString(),
      status: 'published',
      smsSent: false,
      overallScore: 99.1,
      aiInterpretation: aiText,
      highlights: [
          { label: '全网可用率', value: '99.99', unit: '%', trend: 'up' },
          { label: '5G切片在线', value: '452', unit: '个', trend: 'up' },
          { label: '工单平均耗时', value: '2.4', unit: 'h', trend: 'down' },
          { label: '能耗节省', value: '14.5', unit: '%', trend: 'up' }
      ],
      recommendations: [
          { type: 'optimization', title: '周期性资源调优', content: '已为下一周期流量波动预留弹性容量，降低高峰期拥塞风险。' },
          { type: 'risk', title: '维护窗口建议', content: '建议在下周凌晨 2:00-4:00 执行省际干线割接。' }
      ],
      regionalStats: [
          { region: '合肥', score: 98, status: 'excellent' },
          { region: '芜湖', score: 95, status: 'excellent' },
          { region: '蚌埠', score: 88, status: 'good' },
          { region: '安庆', score: 92, status: 'good' }
      ],
      data: [
        {
          businessType: '政企专线',
          metrics: [
            { name: '平均可用率', value: '99.99', unit: '%', trend: 'up', changeRate: '0.01%', status: 'normal' },
            { name: '异常丢包端口', value: '3', unit: '个', trend: 'down', changeRate: '40%', status: 'normal' }
          ]
        },
        {
          businessType: '5G 专网',
          metrics: [
            { name: '切片在线率', value: '100', unit: '%', trend: 'stable', changeRate: '0%', status: 'normal' },
            { name: '数据吞吐峰值', value: '1.2', unit: 'Gbps', trend: 'up', changeRate: '12%', status: 'normal' }
          ]
        }
      ]
    };

    setReports([newReport, ...reports]);
    setSelectedReport(newReport);
    setIsGeneratingAI(false);
    setView('detail');
  };

  const handleSendSMS = (report: ReportItem) => {
    const updated = reports.map(r => r.id === report.id ? { ...r, smsSent: true } : r);
    setReports(updated);
    if (selectedReport?.id === report.id) setSelectedReport({ ...selectedReport, smsSent: true });
    showAppToast(`运行报告已发送到您的绑定手机，统计周期 ${report.period}，约 1 分钟内送达。`, {
      title: '短信网关',
      tone: 'success',
      duration: 3600,
    });
  };

  const renderTrend = (trend: 'up' | 'down' | 'stable', changeRate: string) => {
    if (trend === 'up') return <span className="flex items-center text-red-400"><TrendingUp size={12} className="mr-0.5" />{changeRate}</span>;
    if (trend === 'down') return <span className="flex items-center text-emerald-400"><TrendingDown size={12} className="mr-0.5" />{changeRate}</span>;
    return <span className="text-slate-500">持平</span>;
  };

  const getRecIcon = (type: string) => {
      switch (type) {
          case 'optimization': return <Sparkles size={16} className="text-blue-400" />;
          case 'risk': return <AlertTriangle size={16} className="text-amber-400" />;
          case 'maintenance': return <Zap size={16} className="text-indigo-400" />;
          default: return <MessageSquare size={16} className="text-slate-400" />;
      }
  };

  const metricMeta: Record<string, { fullName: string; hint: string; status: 'excellent' | 'good' | 'warning' | 'danger' }> = {
    '平均可用率': { fullName: '业务可用率', hint: '代表业务在周期内保持可访问的时间占比，越高越好。', status: 'excellent' },
    '切片在线率': { fullName: '5G 切片在线率', hint: '代表切片持续在线能力，越高说明稳定性越好。', status: 'good' },
    'PUE 效能': { fullName: '电源使用效率', hint: '衡量数据中心能效，越接近 1.0 越节能。', status: 'excellent' },
  };

  return (
    <div className="flex h-full bg-[var(--sys-bg-page)] text-slate-200 overflow-hidden flex-col font-sans relative">
      
      {/* Configuration Modal */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="配置简报生成周期"
        size="md"
        footer={
            <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setIsConfigOpen(false)}>取消</Button>
                <Button 
                    className="bg-indigo-600 hover:bg-indigo-500 px-8" 
                    onClick={handleStartGenerate}
                >
                    开始生成报告
                </Button>
            </div>
        }
      >
          <div className="space-y-6">
              <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Clock size={20} />
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-white">选择统计范围</h4>
                      <p className="text-xs text-slate-400 mt-1">系统将自动聚合所选周期内的全域性能指标，并由 AI 进行深度对比分析。</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  {PERIOD_OPTIONS.map(opt => (
                      <div 
                        key={opt.key}
                        onClick={() => setSelectedPeriod(opt.key)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${selectedPeriod === opt.key ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                      >
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${selectedPeriod === opt.key ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                                  <Calendar size={18} />
                              </div>
                              <div>
                                  <div className={`text-sm font-bold ${selectedPeriod === opt.key ? 'text-white' : 'text-slate-300'}`}>{opt.label}</div>
                                  <div className="text-[10px] text-slate-500">{opt.desc}</div>
                              </div>
                          </div>
                          {selectedPeriod === opt.key && <Check size={16} className="text-indigo-400" />}
                      </div>
                  ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="text-xs text-slate-500 font-bold uppercase">自定义统计区间</label>
                  <div className="flex gap-4 items-center">
                      <Input 
                        type="date" 
                        className="flex-1" 
                        value={customStartDate} 
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                      <span className="text-slate-600 text-xs font-bold">至</span>
                      <Input 
                        type="date" 
                        className="flex-1" 
                        value={customEndDate} 
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                  </div>
                  <p className="text-[10px] text-slate-500 italic">提示：修改快捷周期后，上述时间将自动同步。您也可以手动精细化调整日期。</p>
              </div>
          </div>
      </Modal>

      {/* Main View Code (Header, List, Fusion, Detail) */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[var(--sys-bg-header)] shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <FilePieChart className="text-indigo-500" size={20} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">智能简报与自动报告</h2>
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

      <div className="flex-1 overflow-hidden flex flex-col bg-[var(--sys-bg-page)]">
        {view === 'list' && (
          <div className="flex-1 flex flex-col p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
               <div>
                  <h1 className="text-2xl font-black text-white">报告中心</h1>
                  <p className="text-slate-500 text-sm mt-1 text-left">自动聚合全域运行数据，AI 深度解读业务效能。</p>
               </div>
               <Button 
                onClick={() => setIsConfigOpen(true)} 
                className="bg-indigo-600 hover:bg-indigo-500 h-12 px-8 rounded-xl font-bold shadow-lg shadow-indigo-900/30 border-none"
                icon={<Sparkles size={18}/>}
               >
                一键生成简报
               </Button>
            </div>

            <div className="grid gap-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
               {reports.map(rpt => (
                 <div 
                    key={rpt.id} 
                    onClick={() => { setSelectedReport(rpt); setView('detail'); }}
                    className="bg-[var(--sys-surface-muted)] border border-[var(--sys-border-primary)] rounded-2xl p-6 hover:bg-[var(--sys-surface-strong)] hover:border-indigo-500/50 cursor-pointer transition-all flex justify-between items-center group"
                 >
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg group-hover:text-indigo-400 transition-colors">{rpt.title}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <History size={12}/> {formatRelativeTime(rpt.createTime, { fallback: rpt.createTime })}
                                </span>
                                <Badge color="gray" className="scale-90 text-[10px]">{rpt.period}</Badge>
                                {rpt.smsSent && <Badge color="green" className="scale-90 flex items-center gap-1"><Send size={10}/> 已通知</Badge>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase">健康得分</div>
                            <div className={`text-xl font-black ${rpt.overallScore >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>{rpt.overallScore}</div>
                        </div>
                        <ChevronRight className="text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'fusion' && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in fade-in duration-300">
             {/* Center Aligned Fusion Container */}
             <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800/50 flex items-center justify-center bg-slate-900/20">
                    <Database size={48} className="text-indigo-500 animate-pulse" />
                </div>
                <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-indigo-500/30 animate-ping opacity-20"></div>
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 128 128">
                    <circle 
                        cx="64" cy="64" r="60" 
                        fill="none" 
                        stroke="#6366f1" 
                        strokeWidth="4" 
                        strokeDasharray="377" 
                        strokeDashoffset={377 - (377 * fusionProgress / 100)} 
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-out" 
                    />
                </svg>
             </div>
             <div className="text-2xl font-black text-white tracking-widest uppercase mb-4 text-center">
                {fusionProgress < 33 ? '正在同步跨域运行指标...' : (fusionProgress < 66 ? '执行多源数据归一化处理...' : '正在调用 AI 专家引擎进行趋势研判...')}
             </div>
             <div className="flex gap-4 mb-8">
                <Badge color="blue" className={fusionProgress > 20 ? 'opacity-100' : 'opacity-20'}>专线数据</Badge>
                <Badge color="green" className={fusionProgress > 50 ? 'opacity-100' : 'opacity-20'}>5G性能</Badge>
                <Badge color="yellow" className={fusionProgress > 80 ? 'opacity-100' : 'opacity-20'}>环境波动</Badge>
             </div>
             <div className="text-slate-500 text-xs">已完成 {fusionProgress}%：正在汇总可读报告</div>
          </div>
        )}

        {view === 'detail' && selectedReport && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-500">
             {/* Detail Header */}
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[var(--sys-bg-header)]/40 shrink-0">
                <button onClick={() => { setView('list'); setDrillDownMetric(null); }} className="flex items-center gap-2 text-indigo-500 text-sm font-bold hover:text-indigo-400">
                    <ArrowLeft size={16} /> 返回报告列表
                </button>
                <div className="flex gap-3">
                   <Button size="sm" variant="secondary" onClick={() => handleSendSMS(selectedReport)} className="bg-emerald-600/10 text-emerald-500 border-emerald-600/30 hover:bg-emerald-600/20" icon={<Send size={14}/>}>
                      {selectedReport.smsSent ? '短信已发送' : '发送运行报告'}
                   </Button>
                   <Button size="sm" variant="secondary" icon={<Download size={14}/>}>导出 PDF 报告</Button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[var(--sys-bg-page)]">
                <div className="max-w-6xl mx-auto space-y-12 pb-20">
                   {/* Title Area & Score */}
                   <div className="flex justify-between items-start">
                       <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                             <Badge color="blue" className="bg-indigo-600 font-bold px-3">全景运营报告</Badge>
                             <span className="text-xs text-slate-500 font-mono">REPORT ID: {selectedReport.id}</span>
                          </div>
                          <h1 className="text-4xl font-black text-white tracking-tighter leading-tight">{selectedReport.title}</h1>
                          <div className="flex items-center gap-6 text-slate-400">
                               <span className="flex items-center gap-1.5"><History size={14}/> 统计周期: {selectedReport.period}</span>
                               <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500"/> 已通过专家评审</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-center gap-2">
                           <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                                    <circle cx="64" cy="64" r="58" stroke="#1e293b" strokeWidth="8" fill="none" />
                                    <circle 
                                        cx="64" cy="64" r="58" 
                                        stroke={selectedReport.overallScore >= 95 ? '#10b981' : '#f59e0b'} 
                                        strokeWidth="8" 
                                        fill="none" 
                                        strokeDasharray="364.4" 
                                        strokeDashoffset={364.4 - (364.4 * selectedReport.overallScore / 100)} 
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out" 
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-white">{selectedReport.overallScore}</span>
                                    <span className="text-[10px] text-slate-500 uppercase">Health Score</span>
                                </div>
                           </div>
                       </div>
                   </div>

                   {/* Highlights Grid */}
                   <div className="grid grid-cols-4 gap-6">
                       {selectedReport.highlights.map((item, idx) => (
                           <div key={idx} className="bg-[var(--sys-surface-muted)] border border-[var(--sys-border-primary)] rounded-3xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                                <div className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">{item.label}</div>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-2xl font-black text-white">{item.value}</span>
                                    <span className="text-xs text-slate-500">{item.unit}</span>
                                </div>
                                <div className={`text-[10px] flex items-center font-bold ${item.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {item.trend === 'up' ? '环比增长' : '环比下降'} 
                                    {item.trend === 'up' ? <TrendingUp size={10} className="ml-1"/> : <TrendingDown size={10} className="ml-1"/>}
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                    <Activity size={48} />
                                </div>
                           </div>
                       ))}
                   </div>

                   {/* Main Analytics Section */}
                   <div className="grid grid-cols-12 gap-8">
                       <div className="col-span-12 lg:col-span-8 space-y-8">
                            <SectionTitle title="AI 专家研判意见" />
                            <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Sparkles size={80} className="text-indigo-500"/></div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-500 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                        <Sparkles size={18} className="text-white" />
                                    </div>
                                    <h3 className="text-lg font-black text-indigo-300 tracking-wide">AI 核心解读</h3>
                                </div>
                                <p className="text-slate-200 text-lg leading-relaxed relative z-10 mb-8 whitespace-pre-wrap">
                                    {isGeneratingAI ? (
                                        <span className="flex items-center gap-2 font-medium"><Loader2 size={16} className="animate-spin" /> 正在重新研判本周期运行趋势...</span>
                                    ) : selectedReport.aiInterpretation}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedReport.recommendations.map((rec, i) => (
                                        <div key={i} className="bg-[var(--sys-overlay-1)] border border-[var(--sys-border-primary)]/70 rounded-2xl p-5 hover:bg-[var(--sys-overlay-2)] transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getRecIcon(rec.type)}
                                                <span className="text-sm font-bold text-slate-100">{rec.title}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">{rec.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <SectionTitle title="性能分布模型" />
                            <div className="grid grid-cols-2 gap-6">
                                <Card title="质量评估雷达" bodyClassName="h-[280px]">
                                    <BaseChart option={{
                                        radar: {
                                            indicator: [
                                                { name: '稳定性', max: 100 },
                                                { name: '效能', max: 100 },
                                                { name: '安全性', max: 100 },
                                                { name: '响应时效', max: 100 },
                                                { name: '资源冗余', max: 100 }
                                            ],
                                            axisName: { color: '#64748b' }
                                        },
                                        series: [{
                                            type: 'radar',
                                            data: [{ value: [98, 85, 92, 95, 88], name: '当前状态', areaStyle: { color: 'rgba(99, 102, 241, 0.4)' }, itemStyle: { color: '#6366f1' } }]
                                        }]
                                    }} />
                                </Card>
                                <Card title="区域质量对比" bodyClassName="h-[280px]">
                                    <BaseChart option={{
                                        grid: { top: 20, bottom: 20, left: 40, right: 20 },
                                        xAxis: { type: 'category', data: selectedReport.regionalStats.map(s => s.region) },
                                        yAxis: { type: 'value', max: 100 },
                                        series: [{
                                            data: selectedReport.regionalStats.map(s => s.score),
                                            type: 'bar',
                                            barWidth: '40%',
                                            itemStyle: {
                                                borderRadius: [5, 5, 0, 0],
                                                color: (params: any) => params.data >= 95 ? '#10b981' : '#f59e0b'
                                            }
                                        }]
                                    }} />
                                </Card>
                            </div>
                       </div>

                       <div className="col-span-12 lg:col-span-4 space-y-8">
                            <SectionTitle title="指标排行" />
                            <div className="space-y-4">
                                {selectedReport.data.map((biz, idx) => (
                                    <div key={idx} className="bg-[var(--sys-surface-muted)] border border-[var(--sys-border-primary)] rounded-3xl overflow-hidden">
                                        <div className="px-5 py-4 bg-[var(--sys-overlay-1)] border-b border-[var(--sys-border-primary)] flex items-center gap-3">
                                            {biz.businessType.includes('专线') ? <Network size={16} className="text-blue-400"/> : <Signal size={16} className="text-emerald-400"/>}
                                            <span className="text-sm font-bold text-slate-200">{biz.businessType}</span>
                                        </div>
                                        <div className="p-2 divide-y divide-slate-800">
                                            {biz.metrics.map((m, midx) => (
                                                <div key={midx} onClick={() => setDrillDownMetric(m)} className="p-4 flex justify-between items-center hover:bg-slate-800/40 cursor-pointer transition-colors group">
                                                    <div>
                                                        {metricMeta[m.name] ? (
                                                          <MetricLabel
                                                            name={m.name}
                                                            fullName={metricMeta[m.name].fullName}
                                                            hint={metricMeta[m.name].hint}
                                                            status={metricMeta[m.name].status}
                                                          />
                                                        ) : (
                                                          <div className="text-xs text-slate-500 mb-1">{m.name}</div>
                                                        )}
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-lg font-black text-slate-200">{m.value}</span>
                                                            <span className="text-[10px] text-slate-500">{m.unit}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {renderTrend(m.trend, m.changeRate)}
                                                        <div className="text-[8px] text-indigo-500 opacity-0 group-hover:opacity-100 flex items-center justify-end mt-1">查看趋势 <ChevronRight size={8}/></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                       </div>
                   </div>

                   {/* Drill Down Analysis Overlay */}
                   {drillDownMetric && (
                     <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-50 animate-in slide-in-from-bottom-10 duration-500">
                        <div className="bg-[var(--sys-bg-header)] border border-indigo-500/50 rounded-3xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative">
                            <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><TrendingUp size={20}/></div>
                                <div>
                                    <h3 className="text-xl font-black text-white">{drillDownMetric.name} - 周期趋势钻取</h3>
                                    <p className="text-xs text-slate-500 mt-1">采样周期: 2025.02.01 - 2025.02.28 | 置信度: 99.8%</p>
                                </div>
                            </div>
                            <button onClick={() => setDrillDownMetric(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
                            </div>
                            
                            <div className="h-[250px] bg-[var(--sys-overlay-1)] rounded-2xl border border-[var(--sys-border-primary)] p-4">
                            <BaseChart 
                                option={{
                                    xAxis: { type: 'category', data: ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23', '25', '27', '28'] },
                                    yAxis: { type: 'value', min: 99.9, max: 100 },
                                    series: [{
                                    data: [99.98, 99.99, 99.98, 100, 99.97, 99.99, 99.99, 100, 100, 99.98, 99.99, 100, 99.99, 99.99, 100],
                                    type: 'line', smooth: true, areaStyle: { opacity: 0.2 }, itemStyle: { color: '#6366f1' }
                                    }]
                                }} 
                            />
                            </div>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
