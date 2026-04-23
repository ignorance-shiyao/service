
import React from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';
import { User, Activity, BarChart2, Smartphone } from 'lucide-react';

export const Biz5GPreview: React.FC<{ comp: any }> = ({ comp }) => {

    // 1. Customer Business Overview (Cards - Keep as Custom)
    if (comp.name === '客户业务概况') {
        return (
            <div className="w-full h-full p-2 bg-[var(--sys-bg-page)] flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                    {[
                        { l: '开卡数', v: 0, i: User },
                        { l: '活跃用户', v: 5, i: Activity },
                        { l: '总流量(GB)', v: 0, i: BarChart2 },
                        { l: '在线时长', v: 0, i: Smartphone }
                    ].map((item, i) => (
                        <div key={i} className="bg-[#1e293b]/30 border border-slate-700/50 rounded p-2 flex items-center justify-between relative overflow-hidden group">
                            <div className="z-10">
                                <div className="text-[8px] text-slate-400">{item.l}</div>
                                <div className="text-lg font-bold text-white font-mono">{item.v}</div>
                            </div>
                            <div className="absolute -right-2 -bottom-2 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                               <item.i size={40} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="h-5 bg-[#1e293b]/50 border border-slate-700/50 rounded flex items-center px-2 gap-2">
                    <span className="text-[8px] text-slate-400 whitespace-nowrap">终端活跃率</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[0%]"></div>
                    </div>
                    <span className="text-[8px] text-blue-400 font-mono">0%</span>
                </div>
            </div>
        );
    }

    // 2. DPI Performance (Radar)
    if (comp.name === 'DPI性能') {
        const option = {
            radar: {
                indicator: [
                    { name: 'HTTP成功率', max: 100 },
                    { name: '重传率', max: 100 },
                    { name: '时延', max: 100 },
                    { name: '抖动', max: 100 },
                    { name: '丢包', max: 100 },
                    { name: '速率', max: 100 }
                ],
                splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
                splitArea: { show: false },
                axisName: { color: '#94a3b8', fontSize: 10 }
            },
            series: [{
                type: 'radar',
                data: [{ value: [95, 5, 20, 10, 1, 80], name: '性能' }],
                areaStyle: { color: 'rgba(59, 130, 246, 0.3)' },
                lineStyle: { color: '#3b82f6' },
                itemStyle: { color: '#3b82f6' }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 3. Scale Analysis (Horizontal Bars)
    if (comp.name === '业务规模分析') {
        const option = {
            grid: { top: 10, bottom: 0, left: 100, right: 30, containLabel: false },
            xAxis: { show: false },
            yAxis: {
                type: 'category',
                data: ['海尔5G工厂', '国网电力', '芜湖一院', '安庆威灵', '蔚来汽车'],
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#cbd5e1', fontSize: 10, width: 90, overflow: 'truncate' }
            },
            series: [{
                type: 'bar',
                data: [0.3, 0.3, 0.58, 2.16, 3.64],
                barWidth: 8,
                label: { show: true, position: 'right', formatter: '{c}GB', color: '#94a3b8', fontSize: 9 },
                itemStyle: { borderRadius: 4, color: '#3b82f6' },
                showBackground: true,
                backgroundStyle: { color: 'rgba(255, 255, 255, 0.05)', borderRadius: 4 }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 4. Warning Stats (Bar + Line)
    if (comp.name === '预警工单统计') {
        const option = {
            legend: { data: ['工单数量', '及时率'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 30 },
            xAxis: { type: 'category', data: ['06月', '08月', '10月', '12月', '02月'] },
            yAxis: [
                { type: 'value', name: '条', splitLine: { show: false } },
                { type: 'value', name: '%', splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } }
            ],
            series: [
                {
                    name: '工单数量', type: 'bar', barWidth: '30%',
                    itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#0e7490' }] } },
                    data: [12, 8, 15, 18, 14]
                },
                {
                    name: '及时率', type: 'line', yAxisIndex: 1, smooth: true,
                    itemStyle: { color: '#f97316' },
                    data: [95, 92, 98, 96, 99]
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 5. Quality Analysis (Ranking List)
    if (comp.name === '质量分析') {
        const option = {
            grid: { top: 10, bottom: 0, left: 100, right: 30, containLabel: false },
            xAxis: { show: false },
            yAxis: {
                type: 'category',
                data: ['安徽工经院', '江淮汽车', '国能神皖', '国网池州', '蔚来汽车'],
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#cbd5e1', fontSize: 10, width: 90, overflow: 'truncate' }
            },
            series: [{
                type: 'bar',
                data: [51, 57, 62, 63, 68],
                barWidth: 8,
                label: { show: true, position: 'right', formatter: '{c}dB', color: '#22d3ee', fontSize: 9 },
                itemStyle: { borderRadius: 4, color: '#0891b2' },
                showBackground: true,
                backgroundStyle: { color: 'rgba(255, 255, 255, 0.05)', borderRadius: 4 }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }
    
    // 6. PING Stats (Bar)
    if (comp.name === 'PING测统计') {
        const option = {
            legend: { data: ['时延', '抖动', '丢包'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['07-04', '07-08', '07-12'] },
            yAxis: { type: 'value' },
            series: [
                { name: '时延', type: 'bar', data: [20, 18, 22], itemStyle: { color: '#3b82f6' } },
                { name: '抖动', type: 'bar', data: [5, 4, 6], itemStyle: { color: '#22c55e' } },
                { name: '丢包', type: 'line', data: [0.1, 0.0, 0.2], itemStyle: { color: '#facc15' } }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 7. UPF Performance (Bar)
    if (comp.name === 'UPF网管性能') {
        const option = {
            legend: { data: ['上行流量', '下行流量'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['07-10', '07-13', '07-16'] },
            yAxis: { type: 'value', name: 'GB' },
            series: [
                { name: '上行流量', type: 'bar', data: [150, 180, 210], itemStyle: { color: '#06b6d4' } },
                { name: '下行流量', type: 'bar', data: [320, 350, 380], itemStyle: { color: '#3b82f6' } }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 8. Alarm Stats (Line)
    if (comp.name === '告警分类统计') {
        const option = {
            legend: { data: ['IT告警', 'CE告警'], textStyle: { color: '#94a3b8', fontSize: 10 }, top: 0 },
            grid: { top: 30, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['01月', '02月', '03月', '04月', '05月', '06月'] },
            yAxis: { type: 'value' },
            series: [
                { name: 'IT告警', type: 'line', smooth: true, data: [5, 3, 8, 4, 6, 2], itemStyle: { color: '#60a5fa' } },
                { name: 'CE告警', type: 'line', smooth: true, data: [2, 1, 3, 2, 4, 1], itemStyle: { color: '#22d3ee' } }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 9. AMF Performance (Area)
    if (comp.name === 'AMF网管性能') {
        const option = {
            tooltip: { trigger: 'axis' },
            grid: { top: 10, bottom: 20, left: 30, right: 10 },
            xAxis: { type: 'category', data: ['07-09', '07-10', '07-11', '07-12', '07-13', '07-14'] },
            yAxis: { type: 'value', min: 90, max: 100 },
            series: [{
                name: '注册成功率', type: 'line', smooth: true, areaStyle: { opacity: 0.3 },
                data: [99.2, 99.5, 99.1, 99.8, 99.9, 99.6],
                itemStyle: { color: '#4f46e5' }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }
    
    // 10. Top 5 Performance (Horizontal Bar)
    if (comp.name === '性能TOP5统计') {
        const option = {
            grid: { top: 10, bottom: 0, left: 90, right: 40, containLabel: false },
            xAxis: { show: false },
            yAxis: {
                type: 'category',
                data: ['sw-6419', 'sw-8853', 'sw-2776', 'sw-1647', 'sw-6918'],
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#94a3b8', fontSize: 10 }
            },
            series: [{
                type: 'bar',
                data: [45.99, 46.5, 46.55, 46.82, 46.9],
                barWidth: 8,
                label: { show: true, position: 'right', formatter: '{c}%', color: '#fff', fontSize: 9 },
                itemStyle: {
                    color: function(params: any) {
                        const colors = ['#06b6d4', '#06b6d4', '#eab308', '#fff', '#eab308'];
                        return colors[params.dataIndex] || '#3b82f6';
                    },
                    borderRadius: 4
                }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    // 11. Terminal Performance (Gauges)
    if (comp.name === '终端性能') {
        const option = {
            series: [
                {
                    type: 'gauge',
                    radius: '90%',
                    center: ['50%', '60%'],
                    startAngle: 180,
                    endAngle: 0,
                    min: 0, max: 100,
                    splitNumber: 2,
                    itemStyle: { color: '#3b82f6' },
                    progress: { show: true, width: 8 },
                    pointer: { show: false },
                    axisLine: { lineStyle: { width: 8, color: [[1, '#1e293b']] } },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: { valueAnimation: true, offsetCenter: [0, '20%'], fontSize: 20, color: '#fff', formatter: '{value}%' },
                    data: [{ value: 45, name: 'CPU利用率' }],
                    title: { offsetCenter: [0, '60%'], fontSize: 10, color: '#94a3b8' }
                }
            ]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    return <GenericPreview comp={comp} />;
};
