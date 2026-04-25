
import React, { useEffect, useState } from 'react';
import { LayoutGrid, CloudSun, PlayCircle, Globe2 } from 'lucide-react';
import { BaseChart } from '../BaseChart';
import * as echarts from 'echarts';

export const GenericPreview: React.FC<{ comp: any }> = ({ comp }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
      if (comp.type === 'map') {
          // Use Aliyun DataV with no-referrer policy to bypass 403 ACL
          fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json', { referrerPolicy: "no-referrer" })
              .then(response => {
                  if (!response.ok) throw new Error('Network response was not ok');
                  return response.json();
              })
              .then(geoJson => {
                  echarts.registerMap('china', geoJson);
                  setMapLoaded(true);
              })
              .catch(err => {
                  console.error('Failed to load china map data', err);
                  setMapError(true);
              });
      }
  }, [comp.type]);

  switch (comp.type) {
    case 'chart':
      // Generate a generic mock chart based on name keywords
      const isLine = comp.name.includes('流量') || comp.name.includes('利用率') || comp.name.includes('抖动');
      const isMulti = comp.name.includes('上下行');
      
      const option = {
        grid: { top: 10, bottom: 5, left: 5, right: 5, containLabel: false },
        xAxis: { 
            type: 'category', 
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            show: false 
        },
        yAxis: { 
            type: 'value', 
            show: false,
            splitLine: { show: false }
        },
        series: isMulti ? [
            {
                data: [120, 132, 101, 134, 90, 230, 210],
                type: 'line',
                smooth: true,
                showSymbol: false,
                lineStyle: { width: 2 },
                itemStyle: { color: '#3b82f6' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.3)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }]
                    }
                }
            },
            {
                data: [220, 182, 191, 234, 290, 330, 310],
                type: 'line',
                smooth: true,
                showSymbol: false,
                lineStyle: { width: 2 },
                itemStyle: { color: '#22d3ee' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(34, 211, 238, 0.3)' }, { offset: 1, color: 'rgba(34, 211, 238, 0)' }]
                    }
                }
            }
        ] : [
            {
                data: [10, 52, 20, 33, 39, 33, 22],
                type: isLine ? 'line' : 'bar',
                smooth: true,
                showSymbol: false,
                barWidth: '60%',
                itemStyle: {
                    color: isLine ? '#3b82f6' : {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1d4ed8' }]
                    },
                    borderRadius: [2, 2, 0, 0]
                },
                areaStyle: isLine ? {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.3)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }]
                    }
                } : undefined
            }
        ]
      };

      return (
         <div className="w-full h-full relative overflow-hidden pointer-events-none">
             <BaseChart option={option} />
         </div>
      );
    case 'card':
       return (
           <div className="w-full h-full flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-transparent">
               <div className="absolute top-2 left-3 text-[10px] text-slate-500">关键指标</div>
               <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1 z-10">
                  98.4 <span className="text-xs font-normal text-slate-400">GB</span>
               </div>
               <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-current"></span>
                  +12.5%
               </div>
               <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
           </div>
       );
    case 'map':
        if (mapError) {
            return (
                <div className="w-full h-full relative bg-[var(--sys-bg-header)] overflow-hidden flex items-center justify-center">
                    <div className="absolute top-2 left-2 text-[8px] text-slate-400 border-l-2 border-blue-500 pl-2 z-20">地图概览 (静态)</div>
                    <div className="w-3/4 h-3/4 opacity-30 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center">
                        <Globe2 size={48} className="text-slate-500"/>
                    </div>
                </div>
            );
        }
        if (!mapLoaded) {
            return <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 bg-[var(--sys-bg-header)]">地图加载中...</div>;
        }
        
        const mapOption = {
            geo: {
                map: 'china',
                roam: false,
                zoom: 1.2,
                label: { show: false },
                itemStyle: {
                    areaColor: '#1e293b',
                    borderColor: '#475569',
                    borderWidth: 1
                },
                emphasis: {
                    itemStyle: { areaColor: '#334155' }
                }
            },
            series: [{
                type: 'scatter',
                coordinateSystem: 'geo',
                data: [],
            }]
        };

        return (
            <div className="w-full h-full relative bg-[var(--sys-bg-header)] overflow-hidden">
                <BaseChart option={mapOption} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-blue-500/20 rounded-full animate-[ping_3s_ease-in-out_infinite] z-10 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa] z-20 pointer-events-none"></div>
            </div>
        );
    case 'list':
        return (
           <div className="w-full h-full p-4 flex flex-col justify-center space-y-2.5">
               {[1,2,3].map(i => (
                   <div key={i} className="flex items-center gap-2 w-full">
                       <div className={`w-1.5 h-1.5 rounded-full ${i===1 ? 'bg-red-500' : 'bg-slate-600'}`}></div>
                       <div className="h-1.5 bg-slate-700/50 rounded flex-1 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 bg-slate-600 w-2/3 opacity-30"></div>
                       </div>
                       <div className="text-[9px] text-slate-500 font-mono">0{i}</div>
                   </div>
               ))}
           </div>
        );
    case 'sensor':
    case 'gauge': // Enhanced Gauge
        return (
            <div className="w-full h-full flex items-center justify-center relative">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="36" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="36" 
                      stroke={comp.name.includes('PUE') ? '#10b981' : (comp.name.includes('SLA') ? '#8b5cf6' : '#f59e0b')} 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="226" 
                      strokeDashoffset={comp.name.includes('PUE') ? "160" : "45"} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000"
                     />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                    <span className="text-lg font-bold text-white leading-none">
                      {comp.name.includes('PUE') ? '1.2' : '99%'}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-0.5">{comp.name.includes('PUE') ? 'PUE' : 'SLA'}</span>
                </div>
            </div>
        );
    case 'heatmap': // New Heatmap visual
        return (
          <div className="w-full h-full p-3 flex flex-wrap gap-1 content-center justify-center">
               {Array.from({length: 40}).map((_, i) => (
                  <div 
                      key={i} 
                      className="w-3 h-3 rounded-[2px]" 
                      style={{ 
                          backgroundColor: ['#1e293b', '#1e293b', '#3b82f6', '#1d4ed8', '#1e293b'][Math.floor(Math.random() * 5)],
                          opacity: Math.random() * 0.5 + 0.5 
                      }}
                  ></div>
               ))}
          </div>
        );
    case 'table': // New Table visual
        return (
           <div className="w-full h-full p-3 pt-6">
              <div className="border border-slate-700/50 rounded overflow-hidden">
                  <div className="h-6 bg-slate-800 border-b border-slate-700/50 flex items-center px-2 gap-2">
                      <div className="w-8 h-1.5 bg-slate-600 rounded opacity-50"></div>
                      <div className="flex-1 h-1.5 bg-slate-600 rounded opacity-30"></div>
                  </div>
                  {[1,2,3].map(i => (
                      <div key={i} className="h-6 flex items-center px-2 gap-2 border-b border-slate-700/20 last:border-0">
                           <div className="w-4 h-4 rounded bg-blue-900/30 text-[8px] flex items-center justify-center text-blue-400 font-mono">{i}</div>
                           <div className="flex-1 h-1.5 bg-slate-700/30 rounded"></div>
                           <div className="w-6 h-1.5 bg-green-500/30 rounded"></div>
                      </div>
                  ))}
              </div>
           </div>
        );
    case 'media': // New Media visual
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--sys-overlay-1)] relative">
                {comp.name.includes('天气') ? (
                    <div className="flex flex-col items-center gap-1">
                        <CloudSun className="text-yellow-400" size={32} />
                        <div className="text-white text-lg font-bold">24°C</div>
                        <div className="text-[10px] text-slate-400">多云转晴</div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                         <PlayCircle size={32} className="text-slate-500" />
                         <div className="w-24 h-1 bg-slate-700 rounded overflow-hidden">
                             <div className="w-1/3 h-full bg-blue-500"></div>
                         </div>
                    </div>
                )}
            </div>
        );
    case 'util':
        return (
           <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-8 border border-slate-500 rounded bg-[rgba(10,28,52,0.86)] text-emerald-400 font-mono text-sm flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                 12:45:09
              </div>
           </div>
        );
    case 'text':
        return (
           <div className="w-full h-full flex items-center justify-center px-4">
               <div className="w-full space-y-2">
                   <div className="h-3 w-1/2 bg-blue-500/20 rounded"></div>
                   <div className="h-1 w-full bg-slate-700/50 rounded"></div>
                   <div className="h-1 w-2/3 bg-slate-700/50 rounded"></div>
               </div>
           </div>
        );
    case 'other':
         return (
             <div className="w-full h-full flex items-center justify-center">
                 <Globe2 className="text-slate-600" size={32} />
             </div>
         );
    default:
      // Graphic or Fallback
      return (
          <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
              <LayoutGrid className="text-slate-700" size={32} />
          </div>
      );
  }
};
