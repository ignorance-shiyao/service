
import React from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';
import { Video, Database, Server } from 'lucide-react';

export const BizIdcPreview: React.FC<{ comp: any }> = ({ comp }) => {

    // 1. Device Performance (Line Chart)
    if (comp.name === 'IDC设备性能') {
        const option = {
            legend: { data: ['温度(°C)', '湿度(%RH)'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 30 },
            xAxis: {
                type: 'category',
                data: ['05-05', '05-10', '05-15', '05-20', '05-25', '05-30'],
            },
            yAxis: [
                { type: 'value', name: '°C', min: 0, max: 50, splitLine: { show: false } },
                { type: 'value', name: '%RH', min: 0, max: 100 }
            ],
            series: [
                {
                    name: '温度(°C)', type: 'line', smooth: true,
                    data: [22, 23, 22.5, 24, 23, 22],
                    itemStyle: { color: '#22d3ee' }
                },
                {
                    name: '湿度(%RH)', type: 'line', smooth: true, yAxisIndex: 1,
                    data: [45, 48, 46, 50, 48, 45],
                    itemStyle: { color: '#a855f7' }
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 2. Real-time Alarms (Donut)
    if (comp.name === 'IDC实时告警') {
        const option = {
            tooltip: { trigger: 'item' },
            legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
            series: [
                {
                    name: '告警级别',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['50%', '45%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 4, borderColor: '#020617', borderWidth: 2 },
                    label: { show: false },
                    labelLine: { show: false },
                    data: [
                        { value: 0, name: '一级', itemStyle: { color: '#ef4444' } },
                        { value: 5, name: '二级', itemStyle: { color: '#f97316' } },
                        { value: 12, name: '三级', itemStyle: { color: '#eab308' } },
                        { value: 48, name: '四级', itemStyle: { color: '#22c55e' } }
                    ]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 3. Device Statistics (Ring with Center Text)
    if (comp.name === 'IDC设备统计') {
        const option = {
            series: [
                {
                    type: 'pie',
                    radius: ['60%', '75%'],
                    center: ['50%', '50%'],
                    label: {
                        show: true,
                        position: 'center',
                        formatter: '{total|1043}\n{text|设备总数}',
                        rich: {
                            total: { color: '#fff', fontSize: 20, fontWeight: 'bold', lineHeight: 28 },
                            text: { color: '#94a3b8', fontSize: 12 }
                        }
                    },
                    data: [
                        { value: 1043, name: '正常', itemStyle: { color: '#3b82f6' } },
                        { value: 0, name: '异常', itemStyle: { color: '#ef4444' } }
                    ]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 4. Historical Alarms (Stacked Area)
    if (comp.name === 'IDC历史告警') {
        const option = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['三级', '四级'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 10 },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yAxis: { type: 'value' },
            series: [
                {
                    name: '三级', type: 'line', stack: 'Total', smooth: true,
                    areaStyle: { opacity: 0.3 },
                    itemStyle: { color: '#eab308' },
                    data: [12, 13, 10, 14, 9, 23, 21]
                },
                {
                    name: '四级', type: 'line', stack: 'Total', smooth: true,
                    areaStyle: { opacity: 0.3 },
                    itemStyle: { color: '#22c55e' },
                    data: [22, 18, 19, 23, 29, 33, 31]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 5. Monitoring Devices (Bar Chart)
    if (comp.name === 'IDC监控设备') {
        const option = {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['在线', '离线'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['设备A', '设备B', '设备C', '设备D', '设备E'] },
            yAxis: { type: 'value' },
            series: [
                {
                    name: '在线', type: 'bar', stack: 'total', barWidth: '40%',
                    itemStyle: { color: '#22c55e' },
                    data: [320, 302, 301, 334, 390]
                },
                {
                    name: '离线', type: 'bar', stack: 'total', barWidth: '40%',
                    itemStyle: { color: '#64748b' },
                    data: [1, 2, 0, 5, 1]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 6. Real-time Video (Grid - Keep Custom or use generic placeholder)
    if (comp.name === '实时视频') {
        return (
            <div className="w-full h-full p-2 bg-[#020617] flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-[10px] text-slate-400 border-l-2 border-blue-500 pl-2">实时视频</div>
                    <div className="text-[10px] text-blue-500 cursor-pointer">...</div>
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                    {['纬4楼201机房西南门', '纬4楼201机房西南角', '纬4楼201机房西北角看墙', '纬4楼201机房东南门'].map((title, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-700 relative overflow-hidden flex flex-col group">
                             <div className="bg-slate-800/80 p-1 flex justify-between items-center z-10">
                                 <span className="text-[8px] text-slate-300 truncate w-20">{title}</span>
                                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                             </div>
                             <div className="flex-1 relative bg-[#0f172a] flex items-center justify-center">
                                 <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-50"></div>
                                 <Video size={20} className="text-slate-600 opacity-50 group-hover:text-blue-500 group-hover:opacity-100 transition-all" />
                                 <div className="absolute bottom-1 right-1 text-[8px] text-slate-500 bg-black/50 px-1 rounded font-mono">
                                     REC
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 7. Alarm Statistics (Bar)
    if (comp.name === 'IDC告警统计') {
        const option = {
            grid: { top: 20, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['06-01', '06-02', '06-03', '06-04', '06-05', '06-06', '06-07'] },
            yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
            series: [{
                data: [5, 8, 12, 4, 7, 3, 9],
                type: 'bar',
                barWidth: '40%',
                itemStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1e3a8a' }]
                    },
                    borderRadius: [2, 2, 0, 0]
                }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 8. Device Online Status (List - Keep custom for better layout)
    if (comp.name === 'IDC设备在线情况') {
        return (
            <div className="w-full h-full p-2 bg-[#020617] flex flex-col gap-2">
                <div className="text-[10px] text-slate-400 border-l-2 border-blue-500 pl-2 mb-1">IDC设备在线情况</div>
                <div className="grid grid-cols-2 gap-2 h-14 shrink-0">
                     <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-slate-700/50 rounded p-2 flex items-center justify-between relative overflow-hidden">
                         <div>
                             <div className="text-[8px] text-slate-400">机房数</div>
                             <div className="text-lg font-bold text-white">4</div>
                         </div>
                         <Database size={20} className="text-blue-500 opacity-30 absolute right-2 bottom-1" />
                     </div>
                     <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-slate-700/50 rounded p-2 flex items-center justify-between relative overflow-hidden">
                         <div>
                             <div className="text-[8px] text-slate-400">设备数</div>
                             <div className="text-lg font-bold text-white">1043</div>
                         </div>
                         <Server size={20} className="text-blue-500 opacity-30 absolute right-2 bottom-1" />
                     </div>
                </div>
                <div className="flex-1 overflow-hidden border border-slate-800 rounded flex flex-col bg-[#0f172a]/30">
                    <div className="flex bg-slate-800/80 px-3 py-1.5 border-b border-slate-700">
                        <div className="flex-1 text-[8px] text-slate-300 font-medium">设备类型</div>
                        <div className="w-12 text-[8px] text-green-400 text-center font-medium">在线</div>
                        <div className="w-12 text-[8px] text-red-400 text-center font-medium">离线</div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {[
                            {n: '交流母线配电', on: 44, off: 0},
                            {n: '动环监控', on: 29, off: 0},
                            {n: '中央空调末端', on: 137, off: 0},
                            {n: '机房专用空调', on: 15, off: 0},
                            {n: '低压交流配电', on: 8, off: 0},
                            {n: '智能门禁', on: 8, off: 0},
                        ].map((row, i) => (
                            <div key={i} className="flex px-3 py-1.5 border-b border-slate-800/50 items-center hover:bg-slate-800/30">
                                <div className="flex-1 text-[8px] text-slate-400">{row.n}</div>
                                <div className="w-12 text-[8px] text-green-500 text-center font-mono">{row.on}</div>
                                <div className="w-12 text-[8px] text-red-500 text-center font-mono">{row.off}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return <GenericPreview comp={comp} />;
};
