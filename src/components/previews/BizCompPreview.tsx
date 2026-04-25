
import React from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';
import { User, Database } from 'lucide-react';

export const BizCompPreview: React.FC<{ comp: any }> = ({ comp }) => {

    if (comp.name === '算网历史告警统计') {
        const option = {
            grid: { top: 20, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['06-14', '06-20', '06-26', '07-02', '07-08', '07-12'] },
            yAxis: { type: 'value' },
            series: [{
                data: [45, 60, 55, 75, 50, 40],
                type: 'bar',
                barWidth: '50%',
                itemStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#1d4ed8' }]
                    },
                    borderRadius: [2, 2, 0, 0]
                }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '算网客户业务概况') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)] flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 h-20 shrink-0">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded p-3 relative overflow-hidden">
                        <div className="text-xs text-slate-400 mb-1">客户总数</div>
                        <div className="text-2xl font-bold text-white z-10 relative">1476</div>
                        <User className="absolute right-2 bottom-2 text-blue-500/20" size={40} />
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded p-3 relative overflow-hidden">
                        <div className="text-xs text-slate-400 mb-1">业务总数</div>
                        <div className="text-2xl font-bold text-white z-10 relative">3851</div>
                        <Database className="absolute right-2 bottom-2 text-blue-500/20" size={40} />
                    </div>
                </div>
                <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded flex flex-col overflow-hidden">
                    <div className="flex bg-slate-800/80 px-3 py-2 border-b border-slate-700">
                        <div className="flex-1 text-[10px] text-slate-300 font-medium">业务类型</div>
                        <div className="w-12 text-[10px] text-slate-300 font-medium text-right">客户</div>
                        <div className="w-12 text-[10px] text-slate-300 font-medium text-right">业务</div>
                    </div>
                    <div className="flex-1 flex flex-col">
                        {[
                            { name: '云主机', c: 873, b: 2304 },
                            { name: '对象存储', c: 419, b: 1085 },
                            { name: '视频监控', c: 184, b: 462 }
                        ].map((row, i) => (
                            <div key={i} className="flex px-3 py-2 border-b border-slate-800/50 items-center last:border-0">
                                <div className="flex-1 text-[10px] text-slate-400">{row.name}</div>
                                <div className="w-12 text-[10px] text-slate-200 text-right">{row.c}</div>
                                <div className="w-12 text-[10px] text-slate-200 text-right">{row.b}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (comp.name === '算网对象存储性能') {
        const option = {
            grid: { top: 20, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['06-11', '06-15', '06-19', '06-23', '06-27', '07-01'] },
            yAxis: { type: 'value', min: 0, max: 50 },
            series: [{
                data: [5, 8, 5, 6, 8, 30],
                type: 'line',
                smooth: true,
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(168, 85, 247, 0.5)' }, { offset: 1, color: 'rgba(168, 85, 247, 0)' }]
                    }
                },
                itemStyle: { color: '#a855f7' }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '算网告警') {
        const option = {
            tooltip: { trigger: 'item' },
            legend: { 
                bottom: '5%', 
                left: 'center',
                textStyle: { color: '#94a3b8', fontSize: 10 },
                itemWidth: 10,
                itemHeight: 10
            },
            series: [
                {
                    name: '告警等级',
                    type: 'pie',
                    radius: ['40%', '60%'],
                    center: ['50%', '45%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 5,
                        borderColor: '#102a4d',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#fff'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: [
                        { value: 5, name: '一级告警', itemStyle: { color: '#ef4444' } },
                        { value: 18, name: '二级告警', itemStyle: { color: '#f97316' } },
                        { value: 32, name: '三级告警', itemStyle: { color: '#eab308' } },
                        { value: 72, name: '四级告警', itemStyle: { color: '#3b82f6' } }
                    ]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    return <GenericPreview comp={comp} />;
};
