
import React from 'react';
import { GenericPreview } from './GenericPreview';

export const BizCollectPreview: React.FC<{ comp: any }> = ({ comp }) => {
    if (comp.name === '设备性能 TOP-N') {
        return (
            <div className="w-full h-full relative p-2 bg-[#020617] flex flex-col">
                {/* Legend */}
                <div className="flex justify-center items-center gap-4 mb-2 flex-wrap px-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#14b8a6]"></div>
                        <span className="text-[7px] text-slate-400 scale-90 whitespace-nowrap">14楼08机房3号路由器</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#eab308]"></div>
                        <span className="text-[7px] text-slate-400 scale-90 whitespace-nowrap">11楼06机房1号交换机</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#64748b]"></div>
                        <span className="text-[7px] text-slate-400 scale-90 whitespace-nowrap">5楼03机房1号路由器</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#0ea5e9]"></div>
                        <span className="text-[7px] text-slate-400 scale-90 whitespace-nowrap">3楼06机房1号交换机</span>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative pl-6 pb-4 pt-2">
                    {/* Grid Lines (Dashed) */}
                    {[0, 25, 50, 75, 100].map(y => (
                        <div key={y} className="absolute w-full h-px bg-slate-800 border-t border-dashed border-slate-700 right-0" style={{ top: `${y}%`, width: 'calc(100% - 24px)' }}></div>
                    ))}
                    
                    {/* Y-axis Labels */}
                    <div className="absolute top-[0%] left-0 text-[8px] text-slate-500 w-5 text-right">51</div>
                    <div className="absolute top-[25%] left-0 text-[8px] text-slate-500 w-5 text-right">48</div>
                    <div className="absolute top-[50%] left-0 text-[8px] text-slate-500 w-5 text-right">45</div>
                    <div className="absolute top-[75%] left-0 text-[8px] text-slate-500 w-5 text-right">42</div>
                    <div className="absolute top-[100%] left-0 text-[8px] text-slate-500 w-5 text-right">39</div>
                    <div className="absolute -top-4 left-0 text-[8px] text-slate-500">(%)</div>

                    {/* SVG Curves */}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ left: '24px', width: 'calc(100% - 24px)' }}>
                        {/* Cyan Curve */}
                        <path d="M0,70 Q20,40 30,55 T60,90 T90,40" fill="none" stroke="#14b8a6" strokeWidth="1.5" />
                        {[0,30,60,90].map(x => <circle key={`c1-${x}`} cx={x} cy={x===0?70:x===30?55:x===60?90:40} r="1.5" fill="#14b8a6"/>)}

                        {/* Gold Curve */}
                        <path d="M0,75 Q30,73 50,85 T70,25 T90,100" fill="none" stroke="#eab308" strokeWidth="1.5" />
                        {[0,50,70,90].map(x => <circle key={`c2-${x}`} cx={x} cy={x===0?75:x===50?85:x===70?25:100} r="1.5" fill="#eab308"/>)}

                        {/* Grey Curve */}
                        <path d="M0,90 Q20,50 40,70 T70,60 T100,20" fill="none" stroke="#64748b" strokeWidth="1.5" />
                         {[0,40,70,100].map(x => <circle key={`c3-${x}`} cx={x} cy={x===0?90:x===40?70:x===70?60:20} r="1.5" fill="#64748b"/>)}

                        {/* Blue Curve */}
                        <path d="M0,72 Q25,5 35,50 T70,50 T100,60" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
                        {[0,35,70,100].map(x => <circle key={`c4-${x}`} cx={x} cy={x===0?72:x===35?50:x===70?50:60} r="1.5" fill="#0ea5e9"/>)}
                    </svg>

                    {/* X-axis Labels (Rotated) */}
                    <div className="absolute bottom-[-24px] w-full flex justify-between text-[8px] text-slate-500 pl-6 pr-2">
                        <span className="transform -rotate-45 origin-top-left">05-28</span>
                        <span className="transform -rotate-45 origin-top-left">05-29</span>
                        <span className="transform -rotate-45 origin-top-left">05-30</span>
                        <span className="transform -rotate-45 origin-top-left">05-31</span>
                        <span className="transform -rotate-45 origin-top-left">06-01</span>
                        <span className="transform -rotate-45 origin-top-left">06-02</span>
                        <span className="transform -rotate-45 origin-top-left">06-03</span>
                    </div>
                </div>
            </div>
        );
    }
    return <GenericPreview comp={comp} />;
};
