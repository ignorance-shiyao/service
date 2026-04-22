
import React from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';

export const BizDialPreview: React.FC<{ comp: any }> = ({ comp }) => {
    if (comp.name === '区县故障TOP10') {
        const option = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['故障次数', '故障时长'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 30 },
            xAxis: { 
                type: 'category', 
                data: ['凤阳', '迎江', '歙县', '长丰', '包河', '休宁', '灵璧', '固镇', '砀山', '颍州'],
                axisLabel: { interval: 0, rotate: 30, fontSize: 9 }
            },
            yAxis: [
                { type: 'value', name: '次', splitLine: { show: false } },
                { type: 'value', name: '分钟', splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } }
            ],
            series: [
                {
                    name: '故障次数', type: 'bar',
                    itemStyle: { color: '#06b6d4' },
                    data: [80, 20, 30, 35, 32, 20, 30, 45, 38, 30]
                },
                {
                    name: '故障时长', type: 'line', yAxisIndex: 1,
                    itemStyle: { color: '#f97316' },
                    data: [900, 300, 150, 100, 80, 50, 50, 50, 50, 40]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '专线指标曲线图') {
        const option = {
            legend: { data: ['流入', '流出'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['06-20', '06-24', '06-28', '07-02'] },
            yAxis: { type: 'value', name: 'Mbps' },
            series: [
                { name: '流入', type: 'line', smooth: true, data: [40, 35, 55, 48], itemStyle: { color: '#a855f7' } },
                { name: '流出', type: 'line', smooth: true, data: [45, 40, 50, 50], itemStyle: { color: '#22d3ee' } }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '故障分类统计') {
        const option = {
            series: [
                {
                    type: 'pie',
                    radius: ['50%', '70%'],
                    data: [
                        { value: 84.58, name: '客户侧', itemStyle: { color: '#ef4444' } },
                        { value: 15.42, name: '移动侧', itemStyle: { color: '#facc15' } }
                    ],
                    label: { show: true, formatter: '{b}\n{d}%', color: '#94a3b8', fontSize: 10 }
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '地市短信统计TOP5') {
        const option = {
            radar: {
                indicator: [
                    { name: '合肥', max: 20000 },
                    { name: '芜湖', max: 20000 },
                    { name: '阜阳', max: 20000 },
                    { name: '宿州', max: 20000 },
                    { name: '滁州', max: 20000 }
                ],
                axisName: { color: '#94a3b8', fontSize: 10 }
            },
            series: [{
                type: 'radar',
                data: [{ value: [18167, 4080, 2500, 2400, 2320], name: '短信量' }],
                areaStyle: { color: 'rgba(59, 130, 246, 0.5)' },
                itemStyle: { color: '#3b82f6' }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    return <GenericPreview comp={comp} />;
};
