
import React from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';

export const BizInetPreview: React.FC<{ comp: any }> = ({ comp }) => {
    if (comp.name === '互联网专线带宽利用率') {
        const option = {
            grid: { top: 30, bottom: 20, left: 40, right: 20 },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
            yAxis: {
                type: 'value',
                name: '(%)',
                nameTextStyle: { color: '#64748b', fontSize: 10 }
            },
            series: [{
                data: [30, 42, 35, 55, 48, 60, 50],
                type: 'line',
                smooth: false,
                lineStyle: { color: '#38bdf8' },
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: '#38bdf8', borderColor: '#fff' }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '互联网专线抖动') {
        const option = {
            grid: { top: 30, bottom: 20, left: 40, right: 20 },
            xAxis: {
                type: 'category',
                data: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25'],
            },
            yAxis: {
                type: 'value',
                name: 'ms',
                nameTextStyle: { color: '#64748b', fontSize: 10 }
            },
            series: [{
                data: [5, 8, 4, 15, 6, 4],
                type: 'scatter',
                itemStyle: { color: '#eab308' },
                symbolSize: function (data: number) {
                    return Math.max(5, data);
                }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '互联网专线周期PING测') {
        const option = {
            legend: {
                data: ['时延(ms)', '抖动(ms)', '丢包率(%)'],
                textStyle: { color: '#94a3b8', fontSize: 10 },
                itemWidth: 10,
                itemHeight: 6
            },
            grid: { top: 40, bottom: 20, left: 30, right: 30 },
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            },
            yAxis: [
                { type: 'value', splitLine: { show: false } },
                { type: 'value', splitLine: { show: false } }
            ],
            series: [
                {
                    name: '时延(ms)',
                    type: 'bar',
                    data: [15, 20, 18, 25, 22],
                    itemStyle: { color: '#2563eb' }
                },
                {
                    name: '抖动(ms)',
                    type: 'bar',
                    data: [5, 8, 6, 10, 7],
                    itemStyle: { color: '#16a34a' }
                },
                {
                    name: '丢包率(%)',
                    type: 'line',
                    yAxisIndex: 1,
                    data: [0.1, 0.2, 0.1, 0.5, 0.1],
                    itemStyle: { color: '#fb923c' }
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '互联网专线上下行流量') {
         const option = {
             legend: {
                 data: ['上行', '下行'],
                 textStyle: { color: '#94a3b8', fontSize: 10 },
                 top: 5
             },
             grid: { top: 35, bottom: 20, left: 40, right: 10 },
             xAxis: {
                 type: 'category',
                 data: ['00:00', '06:00', '12:00', '18:00'],
             },
             yAxis: {
                 type: 'value',
                 name: 'GB',
                 nameTextStyle: { color: '#64748b', fontSize: 10 }
             },
             series: [
                 {
                     name: '上行',
                     data: [150, 230, 224, 218],
                     type: 'line',
                     smooth: true,
                     itemStyle: { color: '#3b82f6' },
                     areaStyle: { opacity: 0.1 }
                 },
                 {
                     name: '下行',
                     data: [280, 350, 380, 320],
                     type: 'line',
                     smooth: true,
                     itemStyle: { color: '#22d3ee' },
                     areaStyle: { opacity: 0.1 }
                 }
             ]
         };
         return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '互联网专线可用率') {
        const option = {
            grid: { top: 30, bottom: 20, left: 40, right: 10 },
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            },
            yAxis: {
                type: 'value',
                min: 98,
                name: '(%)',
                nameTextStyle: { color: '#64748b', fontSize: 10 }
            },
            series: [{
                data: [100, 100, 99.8, 100, 100],
                type: 'line',
                step: 'end', // Step line for availability looks technical
                itemStyle: { color: '#4ade80' },
                areaStyle: { opacity: 0.2 }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '丢包率') {
        const option = {
            grid: { top: 30, bottom: 20, left: 40, right: 10 },
            xAxis: {
                type: 'category',
                data: ['10:00', '11:00', '12:00', '13:00', '14:00'],
            },
            yAxis: {
                type: 'value',
                name: '(%)',
                nameTextStyle: { color: '#64748b', fontSize: 10 }
            },
            series: [{
                data: [0.01, 0.05, 0.02, 0.2, 0.01],
                type: 'line',
                itemStyle: { color: '#facc15' },
                lineStyle: { width: 2, type: 'dashed' }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    return <GenericPreview comp={comp} />;
};
