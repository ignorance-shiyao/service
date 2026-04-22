
import React, { useEffect, useState } from 'react';
import { Flag, Router, Network, Bell, AlertTriangle, MapPin } from 'lucide-react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';
import * as echarts from 'echarts';

export const BizIntranetPreview: React.FC<{ comp: any }> = ({ comp }) => {
    // State for map loading
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(false);

    useEffect(() => {
        if (comp.name === '拨测采集地图') {
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

    if (comp.name === '内网资源统计') {
        return (
            <div className="w-full h-full p-4 flex gap-2 items-center justify-between bg-slate-900/50">
              {['站点', '设备', '端口'].map((label, i) => (
                <div key={i} className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded p-2 flex flex-col justify-between h-20 relative overflow-hidden group">
                   <div className="text-[10px] text-slate-300 z-10">{label}</div>
                   <div className="text-xl font-bold text-white z-10">--</div>
                   <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-1 translate-y-1 text-blue-400">
                      {i === 0 ? <Flag size={32}/> : (i === 1 ? <Router size={32}/> : <Network size={32}/>)}
                   </div>
                </div>
              ))}
            </div>
        );
    }

    if (comp.name === '预警原因分析') {
        return (
            <div className="w-full h-full relative flex items-center justify-center bg-slate-900/50">
                <div className="absolute top-2 left-2 text-[10px] text-slate-400 border-l-2 border-blue-500 pl-2">预警原因分析</div>
                <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                         {/* Donut Segments */}
                         {/* 72.46% Red */}
                         <circle cx="50" cy="50" r="40" fill="none" stroke="#f87171" strokeWidth="8" strokeDasharray="251" strokeDashoffset="70" className="opacity-80" />
                         {/* 21.36% Yellow */}
                         <circle cx="50" cy="50" r="40" fill="none" stroke="#facc15" strokeWidth="8" strokeDasharray="251" strokeDashoffset="197" transform="rotate(260 50 50)" className="opacity-80" />
                         {/* 3.54% Blue */}
                         <circle cx="50" cy="50" r="40" fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="251" strokeDashoffset="242" transform="rotate(337 50 50)" className="opacity-80" />
                         {/* 1.73% Green */}
                         <circle cx="50" cy="50" r="40" fill="none" stroke="#4ade80" strokeWidth="8" strokeDasharray="251" strokeDashoffset="246" transform="rotate(350 50 50)" className="opacity-80" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Bell size={24} className="text-blue-400" />
                    </div>
                </div>
            </div>
        );
    }

    if (comp.name === '内网资源概览') {
        return (
            <div className="w-full h-full p-2 flex flex-col gap-2 bg-slate-900/50">
                <div className="grid grid-cols-2 gap-2 flex-1">
                    {[
                        {label: '站点数量', val: 17, icon: MapPin},
                        {label: '设备数量', val: 53, icon: Router},
                        {label: '端口数量', val: 167, icon: Network},
                        {label: '平均故障', val: 1.78, icon: AlertTriangle}
                    ].map((item, i) => (
                        <div key={i} className="bg-[#1e293b]/50 rounded p-2 flex justify-between items-center relative overflow-hidden">
                             <div>
                                <div className="text-[8px] text-slate-400">{item.label}</div>
                                <div className="text-lg font-bold text-slate-100 font-mono">{item.val}</div>
                             </div>
                             <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <item.icon size={12} />
                             </div>
                        </div>
                    ))}
                </div>
                <div className="h-4 bg-[#1e293b]/50 rounded flex items-center px-2 gap-2">
                    <span className="text-[8px] text-slate-400 whitespace-nowrap">业务可用率</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[99%]"></div>
                    </div>
                    <span className="text-[8px] text-blue-400 font-mono">99.82%</span>
                </div>
            </div>
        );
    }

    if (comp.name === '拨测采集地图') {
        // Fallback or ECharts Map
        if (mapError) {
             // Static Fallback
             return (
                <div className="w-full h-full relative bg-[#0b1121] overflow-hidden flex items-center justify-center">
                    <div className="absolute top-2 left-2 text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2 z-20 bg-slate-900/50 rounded pr-2 backdrop-blur-sm">拨测节点分布 (静态)</div>
                    <div className="relative w-full h-full opacity-50">
                        {/* Abstract Map Shape */}
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            <path d="M60,140 L80,110 L120,120 L140,80 L110,60 L80,80 Z" fill="none" stroke="#3b82f6" strokeWidth="1" />
                            <circle cx="80" cy="110" r="3" fill="#4ade80" className="animate-pulse"/>
                            <circle cx="120" cy="120" r="3" fill="#ef4444" className="animate-pulse"/>
                            <circle cx="140" cy="80" r="3" fill="#4ade80" className="animate-pulse"/>
                        </svg>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[8px] flex flex-col gap-1 bg-slate-900/80 p-1 rounded border border-slate-700 z-20 backdrop-blur-sm">
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div><span className="text-slate-400">正常节点</span></div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div><span className="text-slate-400">告警节点</span></div>
                    </div>
                </div>
             );
        }

        if (!mapLoaded) {
            return <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 bg-[#0b1121]">地图加载中...</div>;
        }

        const option = {
            geo: {
                map: 'anhui',
                roam: true,
                zoom: 1.2,
                label: { show: false },
                itemStyle: {
                    areaColor: '#1e293b',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    shadowColor: 'rgba(59, 130, 246, 0.5)',
                    shadowBlur: 10
                },
                emphasis: {
                    itemStyle: {
                        areaColor: '#334155'
                    }
                }
            },
            series: [
                {
                    name: '节点状态',
                    type: 'effectScatter',
                    coordinateSystem: 'geo',
                    data: [
                        { name: '合肥', value: [117.27, 31.86, 100] },
                        { name: '芜湖', value: [118.38, 31.33, 80] },
                        { name: '蚌埠', value: [117.39, 32.92, 60] },
                        { name: '安庆', value: [117.05, 30.53, 40] },
                        { name: '黄山', value: [118.33, 29.71, 90] },
                        { name: '宿州', value: [116.98, 33.63, 50] }
                    ],
                    symbolSize: 8,
                    itemStyle: {
                        color: (params: any) => params.value[2] > 80 ? '#ef4444' : '#4ade80',
                        shadowBlur: 10,
                        shadowColor: '#333'
                    },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{b}',
                        fontSize: 9,
                        color: '#cbd5e1'
                    }
                }
            ]
        };

        return (
            <div className="w-full h-full relative bg-[#0b1121] overflow-hidden">
                <div className="absolute top-2 left-2 text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2 z-20 bg-slate-900/50 rounded pr-2 backdrop-blur-sm">拨测节点分布</div>
                <BaseChart option={option} />
                <div className="absolute bottom-2 right-2 text-[8px] flex flex-col gap-1 bg-slate-900/80 p-1 rounded border border-slate-700 z-20 backdrop-blur-sm pointer-events-none">
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div><span className="text-slate-400">正常节点</span></div>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div><span className="text-slate-400">告警节点</span></div>
                </div>
            </div>
        );
    }

    if (comp.name === '设备性能 TOP-N') {
        const option = {
            legend: { 
                top: 5,
                textStyle: { color: '#94a3b8', fontSize: 9 },
                itemWidth: 10, itemHeight: 6
            },
            grid: { top: 35, bottom: 20, left: 30, right: 10 },
            tooltip: { trigger: 'axis' },
            xAxis: { 
                type: 'category', 
                data: ['09:00', '10:00', '11:00', '12:00', '13:00'],
                axisLabel: { fontSize: 9 }
            },
            yAxis: { type: 'value', name: '%', splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
            series: [
                {
                    name: '核心路由A', type: 'line', smooth: true,
                    data: [45, 48, 52, 49, 55],
                    itemStyle: { color: '#14b8a6' }
                },
                {
                    name: '汇聚交换B', type: 'line', smooth: true,
                    data: [30, 32, 35, 33, 38],
                    itemStyle: { color: '#eab308' }
                },
                {
                    name: '接入网关C', type: 'line', smooth: true,
                    data: [20, 22, 18, 25, 24],
                    itemStyle: { color: '#0ea5e9' }
                },
                {
                    name: '防火墙D', type: 'line', smooth: true,
                    data: [10, 12, 15, 12, 14],
                    itemStyle: { color: '#64748b' }
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    return <GenericPreview comp={comp} />;
};
