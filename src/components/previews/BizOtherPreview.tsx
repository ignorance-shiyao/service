
import React, { useEffect, useState } from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';
import { Calendar, FileText, User, Cloud, Radio, Share2, Server, Router, CheckCircle, AlertTriangle, Monitor, Image } from 'lucide-react';
import * as echarts from 'echarts';

export const BizOtherPreview: React.FC<{ comp: any }> = ({ comp }) => {
    // State for map loading
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(false);

    useEffect(() => {
        if (comp.name === '业务分布地图') {
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

    // 1. General Title
    if (comp.name === '通用标题') {
        return (
            <div className="w-full h-full flex items-center justify-center p-2 bg-[var(--sys-bg-page)]">
                <div className="relative w-full h-10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-900/20 border-y border-blue-500/30"></div>
                    <span className="text-white text-base font-bold tracking-wider z-10">我是标题</span>
                </div>
            </div>
        );
    }

    // 2. Single Image
    if (comp.name === '单张图片') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)]">
                <div className="w-full h-full border border-blue-500/30 rounded flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br"></div>
                    
                    <div className="flex-1 flex items-center justify-center bg-blue-900/10">
                        <Image className="text-blue-500/50" size={32} />
                    </div>
                    <div className="absolute top-1 left-2 text-[8px] text-blue-300">单张图片</div>
                </div>
            </div>
        );
    }

    // 3. Bandwidth Utilization Portrait (Wave)
    if (comp.name === '带宽利用率画像') {
        return (
            <div className="w-full h-full relative p-2 bg-[var(--sys-bg-page)] flex flex-col">
                <div className="text-[8px] text-cyan-400 mb-1 flex justify-between">
                    <span>专线计量号: 4563254987</span>
                </div>
                <div className="flex justify-between text-[6px] text-slate-400 mb-1 px-4 bg-slate-900/50 rounded py-0.5 border border-slate-800">
                    <span>上行带宽利用率峰值: <span className="text-cyan-400">98%</span></span>
                    <span>同比: <span className="text-red-400">9% ↑</span></span>
                    <span>环比: <span className="text-red-400">% ↑</span></span>
                </div>
                <div className="flex-1 relative border-l border-b border-slate-700/50 mx-1">
                    <div className="absolute inset-0">
                        <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,35 Q25,35 35,30 Q50,10 65,30 Q75,35 100,35 V50 H0 Z" fill="url(#bwGrad)" stroke="none" />
                            <path d="M0,35 Q25,35 35,30 Q50,10 65,30 Q75,35 100,35" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                        </svg>
                    </div>
                    <div className="absolute bottom-[-8px] w-full flex justify-between text-[6px] text-slate-500 px-1">
                        <span>04-10</span>
                        <span>04-12</span>
                        <span>04-14</span>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Clock
    if (comp.name === '时间器') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--sys-bg-page)]">
                <div className="text-lg font-mono text-white tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                    2023-03-31 17:30:21
                </div>
            </div>
        );
    }

    // 5. SLA Stats (Donut)
    if (comp.name === '业务保障等级统计') {
        return (
            <div className="w-full h-full relative p-2 bg-[var(--sys-bg-page)] flex items-center justify-center">
                <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                        {/* Blue */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="251" strokeDashoffset="210" />
                        {/* Cyan */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#22d3ee" strokeWidth="10" strokeDasharray="251" strokeDashoffset="200" transform="rotate(60 50 50)" />
                        {/* Green */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="10" strokeDasharray="251" strokeDashoffset="180" transform="rotate(140 50 50)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-blue-900/20 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            <Calendar size={20} className="text-cyan-400" />
                        </div>
                    </div>
                    {/* Labels */}
                    <div className="absolute top-[10%] left-[10%] text-[8px] text-cyan-300">13.8%</div>
                    <div className="absolute bottom-[20%] left-[5%] text-[8px] text-emerald-400">28.5%</div>
                    <div className="absolute top-[30%] right-[5%] text-[8px] text-blue-400">36.3%</div>
                </div>
            </div>
        );
    }

    // 6. Time Filter
    if (comp.name === '时间组件') {
        return (
            <div className="w-full h-full p-2 flex items-center justify-center bg-[var(--sys-bg-page)]">
                <div className="flex gap-2 items-center bg-blue-900/10 p-2 rounded border border-blue-500/20">
                    <div className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[8px] text-slate-300 w-16 flex justify-between items-center">
                        全部 <span>▼</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[8px] text-slate-300 w-16 flex justify-between items-center">
                        天 <span>▼</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[8px] text-slate-300 w-24">
                        2024-07-12
                    </div>
                    <div className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[8px] text-slate-300 w-24">
                        2024-07-13
                    </div>
                    <div className="w-8 h-5 bg-blue-600 rounded"></div>
                </div>
            </div>
        );
    }

    // 7. Inspection Conclusion
    if (comp.name === '巡检结论') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)] flex flex-col">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                        <Radio size={10} className="text-blue-400" />
                        <span className="text-[8px] text-slate-400">天</span>
                        <span className="text-[8px] text-slate-600">周</span>
                        <span className="text-[8px] text-slate-600">月</span>
                    </div>
                    <div className="text-[8px] text-slate-500">2023-04-25</div>
                </div>
                <div className="text-[8px] text-slate-300 mb-2">专线运行性能质量评估</div>
                <div className="flex gap-4 text-[8px] text-slate-400 mb-2">
                    <span>抚顺市: <span className="text-cyan-400 font-bold">95</span></span>
                    <span>同比: %</span>
                    <span>环比: %</span>
                </div>
                <div className="flex gap-2 justify-center mb-1">
                    <div className="w-2 h-1 bg-slate-600 rounded"></div><span className="text-[6px] text-slate-500">昨日</span>
                    <div className="w-2 h-1 bg-cyan-500 rounded"></div><span className="text-[6px] text-slate-500">今日</span>
                </div>
                <div className="flex-1 flex items-end justify-around px-2 pb-2 border-b border-slate-800">
                    {['沈阳市', '大连市', '鞍山市', '抚顺市'].map((city, i) => (
                        <div key={i} className="flex gap-1 h-full items-end group relative">
                            <div className="w-1.5 bg-slate-700 h-[60%] rounded-t-sm"></div>
                            <div className="w-1.5 bg-cyan-500 h-[80%] rounded-t-sm shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
                            <span className="absolute -bottom-3 left-0 w-full text-[6px] text-slate-500 text-center whitespace-nowrap">{city}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 8. Business Overview
    if (comp.name === '业务概览') {
        return (
            <div className="w-full h-full relative bg-[var(--sys-bg-page)] flex items-center justify-center">
                {/* Center Core */}
                <div className="relative w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                    <User size={32} className="text-blue-200" />
                    <div className="absolute inset-0 border border-blue-400 rounded-full animate-ping opacity-20"></div>
                </div>
                
                {/* Satellites */}
                {[
                    { l: '互联网专线', v: '0/401', x: '-35%', y: '-35%' },
                    { l: 'MPLS-VPN专线', v: '0/0', x: '35%', y: '-35%' },
                    { l: '云专线', v: '0/0', x: '-45%', y: '0%' },
                    { l: 'SRv6-VPN专线', v: '0/0', x: '45%', y: '0%' },
                    { l: '数据专线', v: '0/157', x: '-35%', y: '35%' },
                    { l: '跨省专线', v: '0/2', x: '35%', y: '35%' },
                ].map((item, i) => (
                    <div key={i} className="absolute text-center" style={{ transform: `translate(${item.x}, ${item.y})` }}>
                        <div className="text-[7px] text-slate-400">{item.l}</div>
                        <div className="text-[9px] text-cyan-400 font-bold">{item.v}</div>
                    </div>
                ))}
            </div>
        );
    }

    // 9. Business Count (Pedestals)
    if (comp.name === '业务数量统计') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)] flex flex-col">
                <div className="text-[8px] text-slate-400 pl-2 border-l-2 border-blue-500 mb-2">业务数量统计 (按区域县)</div>
                <div className="flex-1 flex items-end justify-around pb-2">
                    {['沈河区', '沈北新区', '大东区', '于洪区', '皇姑区', '辽中区'].map((name, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div className="text-sm font-bold text-white mb-[-5px] z-10 drop-shadow-md">{[32, 28, 24, 22, 18, 14][i]}</div>
                            <div className="w-10 h-4 bg-gradient-to-t from-blue-900 to-cyan-500/50 rounded-[100%] border-t border-cyan-400/50 shadow-[0_5px_10px_rgba(0,0,0,0.5)] relative">
                                <div className="absolute inset-0 bg-cyan-400/20 rounded-[100%] blur-sm"></div>
                            </div>
                            <div className="text-[8px] text-slate-400 mt-1">{name}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 10. Custom Window
    if (comp.name === '自定义标题窗口') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)]">
                <div className="w-full h-full border border-blue-900 bg-slate-900/30 rounded flex flex-col">
                    <div className="h-6 border-b border-blue-900/50 flex items-center px-2">
                        <div className="w-1 h-3 bg-blue-500 mr-2"></div>
                        <span className="text-[9px] text-slate-300">自定义标题窗口</span>
                    </div>
                    <div className="flex-1"></div>
                </div>
            </div>
        );
    }

    // 11. IT/CE Overview
    if (comp.name === 'IT/CE设备概览') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)] flex flex-col">
                <div className="text-[8px] text-slate-400 pl-2 border-l-2 border-blue-500 mb-2">设备概览</div>
                <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                    <div className="flex flex-col items-center gap-1">
                        <div className="relative">
                            <Router size={24} className="text-cyan-500" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[6px] flex items-center justify-center text-white">!</div>
                        </div>
                        <span className="text-[8px] text-slate-400">设备数</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <CheckCircle size={24} className="text-green-500" />
                        <span className="text-[8px] text-slate-400">正常数</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <AlertTriangle size={24} className="text-red-500" />
                        <span className="text-[8px] text-slate-400">异常数</span>
                    </div>
                </div>
            </div>
        );
    }

    // 12. Business Type Stats (Concentric Rings)
    if (comp.name === '业务类型统计') {
        return (
            <div className="w-full h-full relative p-2 bg-[var(--sys-bg-page)] flex items-center justify-center">
                <div className="absolute top-2 left-2 text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2">业务类型统计</div>
                <div className="relative w-36 h-36">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="4" />
                        {/* Outer Ring */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#22d3ee" strokeWidth="4" strokeDasharray="251" strokeDashoffset="180" />
                        {/* Mid Ring */}
                        <circle cx="50" cy="50" r="30" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="188" strokeDashoffset="120" />
                        {/* Inner Ring */}
                        <circle cx="50" cy="50" r="20" fill="none" stroke="#14b8a6" strokeWidth="4" strokeDasharray="125" strokeDashoffset="100" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FileText size={16} className="text-blue-400" />
                    </div>
                    
                    {/* Callouts */}
                    <div className="absolute top-[10%] right-[10%] text-[7px] text-cyan-300">28.4%</div>
                    <div className="absolute top-[10%] left-[10%] text-[7px] text-teal-400">10.8%</div>
                    <div className="absolute bottom-[10%] right-[10%] text-[7px] text-blue-400">22.3%</div>
                    <div className="absolute bottom-[20%] left-[5%] text-[7px] text-slate-400">15.8%</div>
                </div>
                {/* Legend */}
                <div className="absolute bottom-1 w-full flex justify-center gap-2 flex-wrap px-2">
                    <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 bg-blue-500"></div><span className="text-[6px] text-slate-500">传输专线</span></div>
                    <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 bg-cyan-500"></div><span className="text-[6px] text-slate-500">互联网专线</span></div>
                    <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 bg-teal-500"></div><span className="text-[6px] text-slate-500">语音专线</span></div>
                </div>
            </div>
        );
    }

    // 13. Total Traffic (Line)
    if (comp.name === '所有专线上下行流量') {
        return (
            <div className="w-full h-full relative p-2 bg-[var(--sys-bg-page)] flex flex-col">
                <div className="flex justify-between items-center mb-1">
                    <div className="text-[8px] text-slate-400 pl-2 border-l-2 border-blue-500">专线上下行流量</div>
                    <div className="flex gap-2 text-[6px] text-slate-500">
                        <span className="text-blue-400">日</span><span>月</span>
                    </div>
                </div>
                <div className="flex justify-center gap-2 mb-2">
                    <div className="flex items-center gap-1"><div className="w-2 h-1 bg-blue-500"></div><span className="text-[6px] text-slate-500">上行流量</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-1 bg-cyan-500"></div><span className="text-[6px] text-slate-500">下行流量</span></div>
                </div>
                <div className="flex-1 relative border-l border-b border-slate-700/50 mx-1">
                    <div className="absolute top-2 left-2 text-[6px] text-slate-500">单位(GB)</div>
                    {[20, 40, 60, 80].map(y => <div key={y} className="absolute w-full h-px bg-slate-800 border-t border-dashed border-slate-700/30" style={{bottom:`${y}%`}}></div>)}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <polyline points="0,90 100,90" stroke="#334155" strokeWidth="1" />
                    </svg>
                    <div className="absolute bottom-[-8px] w-full flex justify-between text-[6px] text-slate-600 px-1">
                        <span>2025-05-26</span>
                        <span>2025-05-30</span>
                        <span>2025-06-01</span>
                    </div>
                </div>
            </div>
        );
    }

    // 14. Map (Anhui)
    if (comp.name === '业务分布地图') {
        if (mapError) {
            // Static Fallback
            return (
                <div className="w-full h-full relative bg-[var(--sys-bg-page)] overflow-hidden">
                    <div className="absolute top-2 left-2 text-[8px] text-slate-400 pl-2 border-l-2 border-blue-500 z-20 bg-slate-900/50 rounded pr-2 backdrop-blur-sm">业务分布地图 (静态)</div>
                    <div className="relative w-full h-full flex items-center justify-center opacity-60">
                         {/* Abstract Map Shape */}
                         <div className="w-32 h-32 border-2 border-dashed border-blue-500/30 rounded-full animate-spin-slow"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]"></div>
                         </div>
                    </div>
                    {/* Data Points Overlay (Mocked static positions) */}
                    <div className="absolute inset-0 pointer-events-none">
                         {[
                             {t: '30%', l: '40%'}, {t: '50%', l: '60%'}, {t: '70%', l: '30%'}
                         ].map((pos, i) => (
                             <div key={i} className="absolute w-1 h-1 bg-cyan-400 rounded-full" style={{top: pos.t, left: pos.l}}></div>
                         ))}
                    </div>
                </div>
            );
        }

        if (!mapLoaded) {
            return <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 bg-[var(--sys-bg-page)]">地图加载中...</div>;
        }

        const option = {
            geo: {
                map: 'anhui',
                roam: true,
                zoom: 1.2,
                label: { show: false },
                itemStyle: {
                    areaColor: '#0f172a',
                    borderColor: '#0284c7',
                    borderWidth: 1,
                    shadowColor: 'rgba(2, 132, 199, 0.5)',
                    shadowBlur: 10
                },
                emphasis: {
                    itemStyle: {
                        areaColor: '#1e293b'
                    }
                }
            },
            series: [
                {
                    name: '业务分布',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: [
                        { name: '合肥', value: [117.27, 31.86] },
                        { name: '芜湖', value: [118.38, 31.33] },
                        { name: '蚌埠', value: [117.39, 32.92] },
                        { name: '安庆', value: [117.05, 30.53] },
                        { name: '黄山', value: [118.33, 29.71] }
                    ],
                    symbolSize: 6,
                    itemStyle: {
                        color: '#22d3ee',
                        shadowBlur: 5,
                        shadowColor: '#333'
                    },
                    label: {
                        show: true,
                        position: 'bottom',
                        formatter: '{b}',
                        fontSize: 8,
                        color: '#cbd5e1'
                    }
                }
            ]
        };

        return (
            <div className="w-full h-full relative bg-[var(--sys-bg-page)] overflow-hidden">
                <div className="absolute top-2 left-2 text-[8px] text-slate-400 pl-2 border-l-2 border-blue-500 z-20 bg-slate-900/50 rounded pr-2 backdrop-blur-sm">业务分布地图</div>
                <BaseChart option={option} />
            </div>
        );
    }

    // 15. Optical Power (Wave)
    if (comp.name === '接收光功率画像') {
        return (
            <div className="w-full h-full relative p-2 bg-[var(--sys-bg-page)] flex flex-col">
                <div className="text-[8px] text-cyan-400 mb-1">专线计量号: 4563254987</div>
                <div className="flex justify-between text-[6px] text-slate-400 mb-1 px-4 bg-slate-900/50 rounded py-0.5 border border-slate-800">
                    <span>接收光功率: <span className="text-cyan-400">-9.3 dBm</span></span>
                    <span>同比: <span className="text-red-400">8%</span></span>
                    <span>环比: <span className="text-green-400">1%</span></span>
                </div>
                <div className="flex-1 relative border-l border-b border-slate-700/50 mx-1">
                    <div className="absolute inset-0">
                        <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,30 Q20,10 40,30 T80,30 T100,20 V50 H0 Z" fill="url(#optGrad)" stroke="none" />
                            <path d="M0,30 Q20,10 40,30 T80,30 T100,20" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                        </svg>
                    </div>
                    <div className="absolute bottom-[-8px] w-full flex justify-between text-[6px] text-slate-500 px-1">
                        <span>04-10</span>
                        <span>04-13</span>
                        <span>04-16</span>
                    </div>
                </div>
            </div>
        );
    }

    // 16. Custom Background
    if (comp.name === '自定义背景框') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)]">
                <div className="w-full h-full border border-slate-700 bg-slate-900/20">
                    <div className="h-full w-full flex items-center justify-center text-[8px] text-slate-600">
                        内容区域
                    </div>
                </div>
            </div>
        );
    }

    // 17. Date Picker
    if (comp.name === '日期选择器 (天)') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--sys-bg-page)]">
                <div className="flex items-center gap-2 border border-slate-600 rounded px-2 py-1 bg-slate-900 text-slate-300">
                    <Calendar size={12} />
                    <span className="text-[10px]">2023-04-17</span>
                </div>
            </div>
        );
    }

    // 18. Error Rate Portrait (ECharts Line)
    if (comp.name === '误码率画像') {
        const option = {
            grid: { top: 35, bottom: 20, left: 30, right: 10 },
            xAxis: { 
                type: 'category', 
                data: ['04-10', '04-12', '04-14', '04-16'],
                axisLabel: { fontSize: 9 }
            },
            yAxis: { type: 'value', name: '%', splitLine: { show: false } },
            series: [{
                data: [0.1, 0.5, 0.2, 0.8],
                type: 'line',
                smooth: true,
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(239, 68, 68, 0.5)' }, { offset: 1, color: 'rgba(239, 68, 68, 0)' }]
                    }
                },
                itemStyle: { color: '#ef4444' }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 19. Report
    if (comp.name === '运行报告') {
        return (
            <div className="w-full h-full flex flex-col p-2 bg-[var(--sys-bg-page)]">
                <div className="text-[8px] text-slate-400 pl-2 border-l-2 border-blue-500 mb-2">运行报告</div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative group cursor-pointer">
                        <div className="w-12 h-16 bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 rounded-lg flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform">
                            <FileText size={24} className="text-blue-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[6px] text-white border-2 border-[var(--sys-bg-page)]">
                            PDF
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <GenericPreview comp={comp} />;
};
