import React from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';
import { Network, Server, Smartphone, AlertCircle, ShieldCheck } from 'lucide-react';
// Added import for Badge component
import { Badge } from '../UI';

export const BizSDWANPreview: React.FC<{ comp: any }> = ({ comp }) => {

    // 1. Core KPI Dashboard
    if (comp.name === '全网运行态势') {
        return (
            <div className="w-full h-full p-4 flex flex-col justify-between bg-[#020617] relative overflow-hidden">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center p-2 bg-slate-800/50 rounded border border-slate-700">
                        <span className="text-[9px] text-slate-400 mb-1">CPE 在线率</span>
                        <div className="text-xl font-bold text-emerald-400 font-mono">98.5%</div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-slate-800/50 rounded border border-slate-700">
                        <span className="text-[9px] text-slate-400 mb-1">DC 健康评分</span>
                        <div className="text-xl font-bold text-blue-400 font-mono">96</div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center mt-2">
                    <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                            <circle cx="48" cy="48" r="40" stroke="#3b82f6" strokeWidth="6" fill="transparent" strokeDasharray="251" strokeDashoffset="50" strokeLinecap="round" className="animate-[dash_2s_ease-in-out]" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-white leading-none">99.9</span>
                            <span className="text-[8px] text-slate-500">全网 SLA</span>
                        </div>
                    </div>
                </div>
                <div className="mt-2 flex justify-between text-[9px]">
                    <div className="flex items-center gap-1"><AlertCircle size={12} className="text-red-500"/><span className="text-slate-300">一级告警: 0</span></div>
                    <div className="flex items-center gap-1"><ShieldCheck size={12} className="text-blue-500"/><span className="text-slate-300">安全防护: 开启</span></div>
                </div>
            </div>
        );
    }

    // 2. Topology (Graph)
    if (comp.name === '混合广域网拓扑') {
        const option = {
            series: [{
                type: 'graph',
                layout: 'none',
                symbolSize: 40,
                roam: true,
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 8],
                label: { show: true, position: 'bottom', fontSize: 9, color: '#94a3b8' },
                data: [
                    { name: 'DC-Hefei', x: 500, y: 100, symbol: 'rect', itemStyle: { color: '#3b82f6' }, label: { formatter: 'DC 管理控制器' } },
                    { name: 'POP-East', x: 500, y: 300, symbol: 'circle', itemStyle: { color: '#8b5cf6' }, label: { formatter: '中继网关 POP' } },
                    { name: 'CPE-Branch1', x: 300, y: 500, symbol: 'roundRect', itemStyle: { color: '#10b981' }, label: { formatter: '分支 CPE-1' } },
                    { name: 'CPE-Branch2', x: 700, y: 500, symbol: 'roundRect', itemStyle: { color: '#facc15' }, label: { formatter: '分支 CPE-2' } }
                ],
                links: [
                    { source: 'DC-Hefei', target: 'POP-East', lineStyle: { width: 2, color: '#475569', curveness: 0, type: 'dashed' } },
                    { source: 'POP-East', target: 'CPE-Branch1', lineStyle: { width: 3, color: '#10b981', curveness: 0.2 } },
                    { source: 'POP-East', target: 'CPE-Branch2', lineStyle: { width: 3, color: '#f97316', curveness: -0.2 }, label: { show: true, formatter: '链路切换', fontSize: 8 } }
                ],
                lineStyle: { opacity: 0.9, width: 2, curveness: 0 }
            }]
        };
        return (
            <div className="w-full h-full relative bg-slate-900/50">
                <div className="absolute top-2 left-2 text-[8px] text-blue-400 border-l border-blue-500 pl-2 z-10">DC-POP-CPE 级联拓扑</div>
                <BaseChart option={option} />
            </div>
        );
    }

    // 3. Link Quality Top 5 (Horizontal Bar)
    if (comp.name === '链路质量 TOP-5') {
        const option = {
            grid: { top: 10, bottom: 20, left: 90, right: 40 },
            xAxis: { type: 'value', show: false },
            yAxis: {
                type: 'category',
                data: ['江淮二分厂', '海螺南陵厂', '合百集团', '阳光电源', '科大讯飞'],
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#cbd5e1', fontSize: 10 }
            },
            series: [{
                type: 'bar',
                data: [12.5, 8.4, 6.2, 5.8, 3.1],
                barWidth: 10,
                itemStyle: {
                    color: (params: any) => params.data > 8 ? '#ef4444' : '#eab308',
                    borderRadius: 5
                },
                label: { show: true, position: 'right', formatter: '{c}% 丢包', color: '#94a3b8', fontSize: 9 }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 4. Policy Strategy (Pie + Trends)
    if (comp.name === '智能选路策略') {
        const option = {
            tooltip: { trigger: 'item' },
            legend: { top: '5%', left: 'center', textStyle: { color: '#94a3b8', fontSize: 9 }, itemWidth: 10, itemHeight: 6 },
            series: [
                {
                    name: '选路分布',
                    type: 'pie',
                    radius: ['40%', '60%'],
                    center: ['50%', '65%'],
                    avoidLabelOverlap: false,
                    label: { show: false },
                    data: [
                        { value: 70, name: '专线 (MPLS)', itemStyle: { color: '#3b82f6' } },
                        { value: 30, name: '互联网 (Internet)', itemStyle: { color: '#06b6d4' } }
                    ]
                }
            ]
        };
        return (
            <div className="w-full h-full relative bg-slate-900/50 flex flex-col">
                <BaseChart option={option} className="flex-1" />
                <div className="h-16 px-4 pb-2">
                    <div className="text-[8px] text-slate-500 mb-1">链路切换频次 (24h)</div>
                    <div className="flex-1 flex items-end gap-1">
                        {[1, 3, 2, 8, 4, 5, 2, 6, 3, 1, 4, 2].map((v, i) => (
                            <div key={i} className="flex-1 bg-blue-500/40 rounded-t-sm" style={{ height: `${v * 10}%` }}></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 5. Alarm Stream (Scrolling List)
    if (comp.name === '实时告警流') {
        return (
            <div className="w-full h-full p-2 bg-[#020617] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-2 py-1.5 bg-slate-800 rounded-t border border-slate-700">
                    <span className="text-[10px] text-slate-300 font-bold">最新 SocketAlarm 事件</span>
                    <Badge color="red" className="animate-pulse">实时接入</Badge>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 mt-1">
                    {[
                        { time: '14:20:01', device: 'CPE-AH-001', msg: '接口协议态 Down', level: 'red' },
                        { time: '14:19:45', device: 'POP-HF-02', msg: '内存利用率过高', level: 'yellow' },
                        { time: '14:18:30', device: 'CPE-MAS-05', msg: '主备链路自动切换', level: 'blue' },
                        { time: '14:15:12', device: 'DC-CTL-01', msg: '邻居 MAC 地址冲突', level: 'yellow' },
                        { time: '14:12:00', device: 'CPE-AH-001', msg: 'Socket 连接握手失败', level: 'red' },
                    ].map((row, i) => (
                        <div key={i} className="flex items-center px-2 py-1.5 bg-slate-900/50 border border-slate-800 rounded hover:bg-slate-800/80 transition-colors group">
                            <div className={`w-1 h-6 rounded-full mr-2 ${row.level === 'red' ? 'bg-red-500 shadow-[0_0_5px_red]' : (row.level === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500')}`}></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <span className="text-[9px] text-white font-medium truncate">{row.device}</span>
                                    <span className="text-[8px] text-slate-500 font-mono">{row.time}</span>
                                </div>
                                <div className="text-[8px] text-slate-400 truncate">{row.msg}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return <GenericPreview comp={comp} />;
};