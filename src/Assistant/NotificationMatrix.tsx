
import React, { useState } from 'react';
// Fix: Added Zap to imports
import { Bell, Smartphone, Mail, Globe, CheckCircle2, AlertTriangle, ShieldCheck, MessageSquareMore, Zap } from 'lucide-react';
import { Card, SectionTitle, Switch, Badge } from '../components/UI';
import { NotificationChannel } from './types';

export const NotificationMatrix: React.FC = () => {
    const [channels, setChannels] = useState<NotificationChannel[]>([
        { id: '1', name: '5G 短信通知', description: '基于 5G 消息增强下发，支持多媒体交互报障', enabled: true, type: 'sms' },
        { id: '2', name: 'App 实时推送', description: '智慧运维管家移动端实时 Push 告警', enabled: true, type: 'app' },
        { id: '3', name: '邮件公告', description: '适用于维护预告、月度分析报告下发', enabled: false, type: 'email' },
        { id: '4', name: '5G 富媒体消息', description: '支持在短信界面直接查看拓扑图与故障报告', enabled: true, type: 'msg5g' },
    ]);

    const toggleChannel = (id: string) => {
        setChannels(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
    };

    return (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto w-full space-y-10">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-amber-600/20 rounded-lg text-amber-500"><Bell size={24}/></div>
                        通知矩阵管理
                    </h1>
                    <p className="text-slate-500 mt-2">配置您的全渠道触达策略，确保关键告警不漏单、维护通知不干扰。</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {channels.map(channel => (
                        <div key={channel.id} className={`p-6 rounded-3xl border transition-all duration-300 group ${channel.enabled ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-2xl ${channel.enabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-800 text-slate-500'}`}>
                                    {channel.type === 'sms' && <Smartphone size={24} />}
                                    {channel.type === 'app' && <Globe size={24} />}
                                    {channel.type === 'email' && <Mail size={24} />}
                                    {channel.type === 'msg5g' && <MessageSquareMore size={24} />}
                                </div>
                                <Switch checked={channel.enabled} onChange={() => toggleChannel(channel.id)} />
                            </div>
                            <h3 className={`text-lg font-bold mb-1 transition-colors ${channel.enabled ? 'text-white' : 'text-slate-400'}`}>{channel.name}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-6">{channel.description}</p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">状态</span>
                                <Badge color={channel.enabled ? 'green' : 'gray'}>{channel.enabled ? '已激活' : '已停用'}</Badge>
                            </div>
                        </div>
                    ))}
                </div>

                <SectionTitle title="告警下发策略" />
                <div className="bg-[var(--sys-bg-header)]/50 border border-slate-800 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-3">
                         <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                             <AlertTriangle size={16}/> 核心级告警
                         </div>
                         <p className="text-[10px] text-slate-500">所有通道强制开启，支持电话语音自动外呼催办。</p>
                         <Badge color="red">强制开启</Badge>
                     </div>
                     <div className="space-y-3 border-x border-slate-800 px-8">
                         <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                             <Zap size={16}/> 预警级告警
                         </div>
                         <p className="text-[10px] text-slate-500">支持 5G 消息下发详情图表，避免频繁骚扰。</p>
                         <Badge color="yellow">跟随配置</Badge>
                     </div>
                     <div className="space-y-3 pl-4">
                         <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                             <ShieldCheck size={16}/> 常规通知
                         </div>
                         <p className="text-[10px] text-slate-500">维护公告、报告下发，建议仅开启 App 与邮件。</p>
                         <Badge color="blue">静默下发</Badge>
                     </div>
                </div>

                <div className="flex items-center gap-3 justify-center text-slate-600 py-6 border-t border-slate-800">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-medium">您的通知配置已通过分布式网关同步，即刻生效</span>
                </div>
            </div>
        </div>
    );
};
