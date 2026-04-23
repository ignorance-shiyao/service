
import React from 'react';
import { GenericPreview } from './GenericPreview';
import { BaseChart } from '../BaseChart';

export const BizLinePreview: React.FC<{ comp: any }> = ({ comp }) => {
    if (comp.name === '数据专线错包率') {
       const option = {
           grid: { top: 30, bottom: 20, left: 40, right: 20 },
           tooltip: {
               formatter: '{b}: {c}%'
           },
           xAxis: {
               type: 'category',
               data: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
           },
           yAxis: {
               type: 'value',
               name: '单位(%)',
               nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 20, 0, 0] },
               max: 0.5
           },
           series: [{
               type: 'scatter',
               data: [0.02, 0.05, 0.01, 0.12, 0.03, 0.01, 0.04],
               itemStyle: { color: '#eab308' }, // Yellow
               symbolSize: 8
           }]
       };
       return <BaseChart option={option} className="bg-slate-900/50" />;
    }
    
    if (comp.name === '数据专线光功率') {
       const option = {
           legend: { 
               data: ['发射光功率', '接收光功率'],
               textStyle: { color: '#94a3b8', fontSize: 10 },
               top: 5
           },
           grid: { top: 35, bottom: 20, left: 40, right: 10 },
           xAxis: {
               type: 'category',
               data: ['线路1', '线路2', '线路3', '线路4'],
           },
           yAxis: {
               type: 'value',
               name: 'dBm',
               nameTextStyle: { color: '#64748b', fontSize: 10 },
           },
           series: [
               {
                   name: '发射光功率',
                   type: 'bar',
                   data: [-5, -6, -4.5, -5.2],
                   itemStyle: { color: '#3b82f6' } // Blue
               },
               {
                   name: '接收光功率',
                   type: 'bar',
                   data: [-18, -20, -19, -21],
                   itemStyle: { color: '#22d3ee' } // Cyan
               }
           ]
       };
       return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === 'SPN临时提速') {
        // Keep SVG for specific graphic diagram, hard to do with standard charts
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--sys-bg-page)]">
                <div className="w-32 h-20 bg-[#021228] rounded-[20px] flex items-center justify-center relative border border-blue-900/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <div className="absolute w-20 h-10 bg-blue-500/10 blur-xl rounded-full"></div>
                    <svg viewBox="0 0 120 80" className="w-full h-full p-2">
                        <path d="M30,30 C30,10 60,10 70,10 L90,10" fill="none" stroke="#0091ff" strokeWidth="5" strokeLinecap="round" />
                        <path d="M30,50 L50,50 C60,50 90,50 90,30" fill="none" stroke="#0091ff" strokeWidth="5" strokeLinecap="round" />
                        <circle cx="90" cy="10" r="5" fill="#0091ff" />
                        <circle cx="30" cy="50" r="5" fill="#0091ff" />
                        <circle cx="80" cy="50" r="14" fill="#0091ff" />
                        <path d="M76,46 H82 C84,46 84,48 82,48 H78 C76,48 76,52 78,52 H84" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="76" cy="46" r="1.5" fill="white" />
                        <circle cx="84" cy="52" r="1.5" fill="white" />
                    </svg>
                </div>
            </div>
        );
    }

    if (comp.name === '数据专线可用率') {
        const option = {
            grid: { top: 30, bottom: 20, left: 40, right: 20 },
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
            yAxis: {
                type: 'value',
                min: 99,
                max: 100,
                name: '(%)',
                nameTextStyle: { color: '#64748b', fontSize: 10 }
            },
            series: [{
                data: [99.9, 99.95, 100, 99.92, 99.98, 100, 99.99],
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 3, color: '#10b981' }, // Emerald
                itemStyle: { color: '#10b981', borderColor: '#fff' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.3)' }, { offset: 1, color: 'rgba(16, 185, 129, 0)' }]
                    }
                }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    if (comp.name === '数据专线带宽利用率') {
        const option = {
            grid: { top: 30, bottom: 20, left: 40, right: 20 },
            xAxis: {
                type: 'category',
                data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            },
            yAxis: {
                type: 'value',
                name: '(%)',
                nameTextStyle: { color: '#64748b', fontSize: 10 },
                splitLine: { show: true, lineStyle: { color: '#334155', type: 'dashed' } }
            },
            series: [{
                data: [12, 5, 45, 88, 65, 30],
                type: 'line',
                smooth: true,
                lineStyle: { color: '#3b82f6', width: 2 },
                itemStyle: { color: '#3b82f6' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.4)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }]
                    }
                }
            }]
        };
        return <BaseChart option={option} className="bg-slate-900/50" />;
    }
    
    if (comp.name === '数据专线上下行流量') {
         const option = {
             legend: {
                 data: ['上行流量', '下行流量'],
                 textStyle: { color: '#94a3b8', fontSize: 10 },
                 top: 0
             },
             grid: { top: 30, bottom: 20, left: 40, right: 10 },
             xAxis: {
                 type: 'category',
                 data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
             },
             yAxis: {
                 type: 'value',
                 name: 'GB',
                 nameTextStyle: { color: '#64748b', fontSize: 10 }
             },
             series: [
                 {
                     name: '上行流量',
                     data: [12, 13, 10, 14, 9, 23, 21],
                     type: 'line',
                     smooth: true,
                     symbol: 'none',
                     itemStyle: { color: '#3b82f6' }
                 },
                 {
                     name: '下行流量',
                     data: [22, 18, 19, 23, 29, 33, 31],
                     type: 'line',
                     smooth: true,
                     symbol: 'none',
                     itemStyle: { color: '#22d3ee' }
                 }
             ]
         };
         return <BaseChart option={option} className="bg-slate-900/50" />;
    }

    return <GenericPreview comp={comp} />;
};
