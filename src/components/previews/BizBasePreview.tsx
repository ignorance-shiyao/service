
import React, { useEffect, useState } from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';
import { Bot, Bell, FileText, PhoneCall, AlertTriangle, Phone } from 'lucide-react';
import * as echarts from 'echarts';

export const BizBasePreview: React.FC<{ comp: any }> = ({ comp }) => {
    // State for map loading
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(false);

    useEffect(() => {
        if (comp.name === '集客业务分布地图') {
            // Use Aliyun DataV with no-referrer policy to bypass 403 ACL
            fetch('https://geo.datav.aliyun.com/areas_v3/bound/340000_full.json', { referrerPolicy: "no-referrer" })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(geoJson => {
                    echarts.registerMap('anhui', geoJson);
                    setMapLoaded(true);
                })
                .catch(err => {
                    console.error('Failed to load map data', err);
                    setMapError(true);
                });
        }
    }, [comp.name]);

    // 1. Smart Agent
    if (comp.name === '智能体') {
        return (
            <div className="w-full h-full relative flex items-center justify-center bg-[var(--sys-bg-page)]">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-400/50 flex items-center justify-center relative shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Bot size={32} className="text-blue-100" />
                        <div className="absolute inset-0 rounded-full border border-blue-400 opacity-50 animate-ping"></div>
                    </div>
                    <span className="mt-2 text-xs text-white font-medium tracking-widest">智能体</span>
                </div>
            </div>
        );
    }

    // 2. Complaint Orders (Bar + Line)
    if (comp.name === '投诉工单' || comp.name === '投诉工单统计') {
        const option = {
            legend: { 
                data: ['工单数', '及时率'],
                textStyle: { color: '#94a3b8', fontSize: 10 },
                top: 5
            },
            grid: { top: 30, bottom: 20, left: 30, right: 30 },
            xAxis: {
                type: 'category',
                data: ['02月', '03月', '04月', '05月'],
                axisLabel: { fontSize: 9 }
            },
            yAxis: [
                { type: 'value', name: '单', splitLine: { show: false } },
                { type: 'value', name: '%', min: 90, max: 100, splitLine: { show: false } }
            ],
            series: [
                {
                    name: '工单数',
                    type: 'bar',
                    barWidth: '30%',
                    itemStyle: { color: '#ef4444' },
                    data: [15, 8, 12, 5]
                },
                {
                    name: '及时率',
                    type: 'line',
                    yAxisIndex: 1,
                    itemStyle: { color: '#3b82f6' },
                    data: [98, 95, 99, 97]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 3. Real-time Alarms
    if (comp.name === '集客专线实时告警') {
        const option = {
            series: [{
                type: 'pie',
                radius: ['50%', '70%'],
                center: ['50%', '50%'],
                label: { show: false },
                data: [
                    { value: 2, name: '一级', itemStyle: { color: '#ef4444' } },
                    { value: 5, name: '二级', itemStyle: { color: '#f97316' } },
                    { value: 12, name: '三级', itemStyle: { color: '#eab308' } },
                    { value: 45, name: '四级', itemStyle: { color: '#22c55e' } }
                ]
            }]
        };
        return (
            <div className="w-full h-full relative bg-slate-900/50 flex flex-col justify-center">
                <div className="absolute top-2 left-2 text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2">实时告警分布</div>
                <BaseChart option={option} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-lg font-bold text-white">64</div>
                        <div className="text-[8px] text-slate-500">告警总数</div>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Business Map (Anhui)
    if (comp.name === '集客业务分布地图') {
        if (mapError) {
            // Static Fallback
            return (
                <div className="w-full h-full relative bg-[var(--sys-bg-page)] overflow-hidden">
                    <div className="absolute top-2 left-2 text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2 z-20 bg-slate-900/50 rounded pr-2 backdrop-blur-sm">集客业务分布 (静态)</div>
                    <div className="relative w-full h-full flex items-center justify-center opacity-60">
                         {/* Abstract Map Shape */}
                         <div className="w-32 h-32 border-2 border-dashed border-blue-500/30 rounded-full animate-spin-slow"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_10px_#fbbf24]"></div>
                         </div>
                    </div>
                    {/* Data Points Overlay (Mocked static positions) */}
                    <div className="absolute inset-0 pointer-events-none">
                         {[
                             {t: '30%', l: '40%'}, {t: '50%', l: '60%'}, {t: '70%', l: '30%'}
                         ].map((pos, i) => (
                             <div key={i} className="absolute w-1 h-1 bg-blue-400 rounded-full" style={{top: pos.t, left: pos.l}}></div>
                         ))}
                    </div>
                </div>
            );
        }

        if (!mapLoaded) {
            return <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 bg-[var(--sys-bg-page)]">地图加载中...</div>;
        }

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}'
            },
            visualMap: {
                min: 0,
                max: 150,
                show: false,
                inRange: {
                    color: ['#3b82f6', '#fbbf24', '#ef4444']
                }
            },
            geo: {
                map: 'anhui',
                roam: true,
                zoom: 1.2,
                label: { show: false },
                itemStyle: {
                    areaColor: '#0f172a',
                    borderColor: '#1e40af',
                    borderWidth: 1
                },
                emphasis: {
                    itemStyle: {
                        areaColor: '#1e293b'
                    }
                }
            },
            series: [
                {
                    name: '业务量',
                    type: 'heatmap',
                    coordinateSystem: 'geo',
                    data: [
                        { name: '合肥', value: [117.27, 31.86, 120] },
                        { name: '芜湖', value: [118.38, 31.33, 92] },
                        { name: '蚌埠', value: [117.39, 32.92, 85] },
                        { name: '安庆', value: [117.05, 30.53, 45] },
                        { name: '黄山', value: [118.33, 29.71, 30] },
                        { name: '滁州', value: [118.32, 32.30, 60] }
                    ],
                    pointSize: 10,
                    blurSize: 15
                },
                {
                    name: 'Top 5',
                    type: 'effectScatter',
                    coordinateSystem: 'geo',
                    data: [
                        { name: '合肥', value: [117.27, 31.86, 120] },
                        { name: '芜湖', value: [118.38, 31.33, 92] }
                    ],
                    symbolSize: 10,
                    showEffectOn: 'render',
                    rippleEffect: {
                        brushType: 'stroke'
                    },
                    label: { show: false },
                    itemStyle: {
                        color: '#facc15',
                        shadowBlur: 10,
                        shadowColor: '#333'
                    },
                    zlevel: 1
                }
            ]
        };

        return (
            <div className="w-full h-full relative bg-[var(--sys-bg-page)] overflow-hidden">
                <div className="absolute top-2 left-2 text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2 z-20 bg-slate-900/50 rounded pr-2 backdrop-blur-sm">集客业务分布</div>
                <BaseChart option={option} />
            </div>
        );
    }

    // 5. Line Overview
    if (comp.name === '集客业务专线概况') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)] flex flex-col">
                <div className="text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2 mb-1">业务概况</div>
                <div className="flex-1 border border-slate-800 rounded bg-[var(--sys-bg-header)]/50">
                    <div className="flex flex-col gap-1 p-2">
                        {['客户编号', '客户名称', '客户经理', '客户经理电话'].map((label, i) => (
                            <div key={i} className="flex border-b border-slate-800/50 pb-1 last:border-0">
                                <span className="text-[7px] text-slate-500 w-16">{label}:</span>
                                <span className="text-[7px] text-slate-300 flex-1"></span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-[#1e293b] p-1 flex justify-between items-center px-2 mt-auto">
                        <span className="text-[7px] text-slate-400">已订业务</span>
                        <span className="text-[7px] text-slate-400">业务数</span>
                    </div>
                </div>
            </div>
        );
    }

    // 6. Historical Alarms (Bar Chart)
    if (comp.name === '集客专线历史告警') {
        const option = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['一级', '二级'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
            yAxis: { type: 'value' },
            series: [
                {
                    name: '一级', type: 'bar', stack: 'total',
                    itemStyle: { color: '#ef4444' },
                    data: [2, 1, 3, 1, 2]
                },
                {
                    name: '二级', type: 'bar', stack: 'total',
                    itemStyle: { color: '#f97316' },
                    data: [5, 3, 6, 4, 5]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 7. Opening Orders (Bar + Line)
    if (comp.name === '开通工单' || comp.name === '开通工单统计') {
        const option = {
            legend: { 
                data: ['工单数', '及时率'],
                textStyle: { color: '#94a3b8', fontSize: 10 },
                top: 5
            },
            grid: { top: 30, bottom: 20, left: 30, right: 30 },
            xAxis: {
                type: 'category',
                data: ['02月', '03月', '04月', '05月'],
                axisLabel: { fontSize: 9 }
            },
            yAxis: [
                { type: 'value', name: '单', splitLine: { show: false } },
                { type: 'value', name: '%', min: 90, max: 100, splitLine: { show: false } }
            ],
            series: [
                {
                    name: '工单数',
                    type: 'bar',
                    barWidth: '30%',
                    itemStyle: { color: '#10b981' },
                    data: [25, 32, 28, 35]
                },
                {
                    name: '及时率',
                    type: 'line',
                    yAxisIndex: 1,
                    itemStyle: { color: '#f59e0b' },
                    data: [99, 98, 99.5, 99.2]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 8. Fault Report Icon
    if (comp.name === '故障申报') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--sys-bg-page)]">
                <div className="text-[8px] text-slate-400 w-full pl-2 border-l-2 border-blue-500 mb-2">故障申报</div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative">
                        <FileText size={64} className="text-blue-500" fill="#1e3a8a" />
                        <AlertTriangle size={24} className="text-[var(--sys-bg-page)] absolute bottom-2 right-2" fill="#60a5fa" />
                    </div>
                </div>
            </div>
        );
    }

    // 9. Line Availability (Line Chart)
    if (comp.name === '专线可用率') {
        const option = {
            grid: { top: 30, bottom: 20, left: 40, right: 10 },
            xAxis: {
                type: 'category',
                data: ['06-01', '06-02', '06-03', '06-04', '06-05'],
            },
            yAxis: {
                type: 'value',
                min: 99,
                name: '(%)',
                nameTextStyle: { color: '#64748b', fontSize: 10 }
            },
            series: [{
                data: [99.99, 99.95, 100, 99.98, 100],
                type: 'line',
                smooth: true,
                itemStyle: { color: '#22c55e' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(34, 197, 94, 0.3)' }, { offset: 1, color: 'rgba(34, 197, 94, 0)' }]
                    }
                }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 10. Contact Trial
    if (comp.name === '联系试用') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)] flex flex-col">
                <div className="text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2 mb-2">联系试用</div>
                <div className="flex-1 flex items-center justify-center">
                    <button className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg shadow-blue-500/30">
                        <Phone size={16} className="text-white" />
                        <div className="flex flex-col items-start">
                            <div className="h-1.5 w-8 bg-white/50 rounded mb-1"></div>
                            <div className="h-1.5 w-12 bg-white/30 rounded"></div>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // 11. Bandwidth Top-N
    if (comp.name === '专线带宽利用率TOP-N') {
        const option = {
            grid: { top: 10, bottom: 0, left: 100, right: 30, containLabel: false },
            xAxis: { show: false },
            yAxis: {
                type: 'category',
                data: ['专线A', '专线B', '专线C', '专线D', '专线E'],
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#cbd5e1', fontSize: 10, width: 90, overflow: 'truncate' }
            },
            series: [{
                type: 'bar',
                data: [45, 55, 68, 72, 89],
                barWidth: 8,
                label: { show: true, position: 'right', formatter: '{c}%', color: '#94a3b8', fontSize: 9 },
                itemStyle: { borderRadius: 4, color: '#3b82f6' },
                showBackground: true,
                backgroundStyle: { color: 'rgba(255, 255, 255, 0.05)', borderRadius: 4 }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    return <GenericPreview comp={comp} />;
};
