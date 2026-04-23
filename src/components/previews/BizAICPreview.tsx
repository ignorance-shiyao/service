import React from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';
import { Cpu, Zap, Activity, HardDrive } from 'lucide-react';

export const BizAICPreview: React.FC<{ comp: any }> = ({ comp }) => {

    // 1. Resource Kanban (Capsule Bars)
    if (comp.name === '算力池资源概览') {
        return (
            <div className="w-full h-full p-3 bg-[var(--sys-bg-page)] flex flex-col gap-3 justify-center">
                {[
                    { label: 'GPU 核心利用率', val: 78.5, color: '#3b82f6', icon: Zap },
                    { label: '显存占用率', val: 62.4, color: '#8b5cf6', icon: Cpu },
                    { label: 'IB 网络吞吐 (Gbps)', val: 45.2, color: '#10b981', icon: Activity }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <item.icon size={12} className="text-slate-500" />
                                <span>{item.label}</span>
                            </div>
                            <span className="text-white font-mono font-bold">{item.val}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/50">
                             <div 
                                className="h-full transition-all duration-1000 ease-out rounded-full" 
                                style={{ width: `${item.val}%`, backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }}
                             ></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 2. Job Lifecycle (Funnel-style)
    if (comp.name === '集群作业生命周期') {
        const option = {
            tooltip: { trigger: 'item' },
            series: [
                {
                    name: '作业状态',
                    type: 'funnel',
                    left: '10%', top: 20, bottom: 20, width: '80%',
                    min: 0, max: 100, minSize: '0%', maxSize: '100%',
                    sort: 'descending', gap: 2,
                    label: { show: true, position: 'inside', formatter: '{b}: {c}', fontSize: 10 },
                    labelLine: { show: false },
                    itemStyle: { borderColor: '#fff', borderWidth: 0 },
                    data: [
                        { value: 92, name: '已完成', itemStyle: { color: '#10b981' } },
                        { value: 65, name: '运行中', itemStyle: { color: '#3b82f6' } },
                        { value: 40, name: '排队中', itemStyle: { color: '#eab308' } },
                        { value: 8, name: '异常终止', itemStyle: { color: '#ef4444' } }
                    ]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 3. Node Heatmap (Treemap)
    if (comp.name === '节点健康度热图') {
        const option = {
            tooltip: { trigger: 'item' },
            series: [{
                name: '计算节点',
                type: 'treemap',
                visibleMin: 300,
                label: { show: true, formatter: '{b}', fontSize: 10 },
                upperLabel: { show: true, height: 20, textStyle: { color: '#fff', fontSize: 10 } },
                itemStyle: { borderColor: '#020617', borderWidth: 2, gapWidth: 1 },
                breadcrumb: { show: false },
                data: [
                    {
                        name: 'Rack-01',
                        value: 100,
                        children: [
                            { name: 'Node-01-A', value: 20, itemStyle: { color: '#10b981' } },
                            { name: 'Node-01-B', value: 20, itemStyle: { color: '#eab308' } },
                            { name: 'Node-01-C', value: 20, itemStyle: { color: '#ef4444' } },
                            { name: 'Node-01-D', value: 40, itemStyle: { color: '#10b981' } }
                        ]
                    },
                    {
                        name: 'Rack-02',
                        value: 80,
                        children: [
                            { name: 'Node-02-A', value: 40, itemStyle: { color: '#3b82f6' } },
                            { name: 'Node-02-B', value: 40, itemStyle: { color: '#10b981' } }
                        ]
                    }
                ]
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 4. Tenant Consumption (Vertical Bar)
    if (comp.name === '租户算力消耗排名') {
        const option = {
            grid: { top: 30, bottom: 20, left: 40, right: 20 },
            xAxis: { type: 'category', data: ['讯飞智能', '安徽大学', '应急管理', '海螺水泥', '蔚来汽车'], axisLabel: { fontSize: 8, interval: 0 } },
            yAxis: { type: 'value', name: 'TFLOPS', nameTextStyle: { fontSize: 10, color: '#64748b' } },
            series: [{
                data: [450, 320, 280, 240, 190],
                type: 'bar',
                barWidth: '50%',
                itemStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1d4ed8' }]
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    return <GenericPreview comp={comp} />;
};