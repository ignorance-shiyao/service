
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Headset, History as HistoryIcon, Paperclip, Plus, MessageSquare, ChevronLeft, Activity, Zap, ClipboardList, Cpu, FileText, Wifi, Gauge, Settings2, Brain } from 'lucide-react';
import { Button } from '../components/UI';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ChatSession } from './types';
import { DiagnosisAgent } from './DiagnosisAgent';
import { DEFAULT_CHAT_SESSIONS, KNOWLEDGE_ITEMS, REPORTS, TICKETS } from '../mock/assistant';

const SESSION_STORAGE_KEY = 'assistant_chat_sessions_v1';

const nowText = () => new Date().toLocaleTimeString();
const createMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
    id: `${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    role,
    content,
    timestamp: nowText(),
});

const resolveMockReply = (input: string): string | null => {
    const text = input.toLowerCase();
    if (text.includes('工单')) {
        const latest = TICKETS[0];
        return latest ? `最近工单：${latest.title}，状态：${latest.status}，责任人：${latest.owner}。` : '当前暂无工单数据。';
    }
    if (text.includes('报告') || text.includes('月报') || text.includes('周报')) {
        const latest = REPORTS[0];
        if (!latest) return '当前暂无报告数据。';
        return `${latest.title}：${latest.summary} 关键指标：${latest.metrics.map(m => `${m.label}${m.value}`).join('，')}。`;
    }
    if (text.includes('知识') || text.includes('切片') || text.includes('量子')) {
        const hit = KNOWLEDGE_ITEMS.find(k => text.includes(k.title.toLowerCase()) || k.tags.some(t => text.includes(t.toLowerCase()))) || KNOWLEDGE_ITEMS[0];
        return hit ? `知识库命中：${hit.title}。${hit.summary}` : '当前暂无可匹配的知识条目。';
    }
    return null;
};

export const ChatInterface: React.FC<{ isHuman: boolean }> = ({ isHuman: initialIsHuman }) => {
    const [isHuman, setIsHuman] = useState(initialIsHuman);
    const [showHistory, setShowHistory] = useState(true);
    const [activeDiagnosis, setActiveDiagnosis] = useState<boolean>(false);
    const [activeSessionId, setActiveSessionId] = useState<string>('s1');
    const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
    
    // Mock Sessions
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        try {
            const raw = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!raw) return DEFAULT_CHAT_SESSIONS;
            const parsed = JSON.parse(raw) as ChatSession[];
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CHAT_SESSIONS;
        } catch {
            return DEFAULT_CHAT_SESSIONS;
        }
    });

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const [messages, setMessages] = useState<ChatMessage[]>(activeSession.messages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMessages(activeSession.messages); }, [activeSessionId, activeSession.messages]);
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading, activeDiagnosis]);
    useEffect(() => { localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions)); }, [sessions]);

    const appendToSession = (sessionId: string, msg: ChatMessage) => {
        setSessions(prev => prev.map(s => {
            if (s.id !== sessionId) return s;
            const nextMessages = [...s.messages, msg];
            const nextTitle = s.title === '新咨询' && msg.role === 'user'
                ? msg.content.slice(0, 14)
                : s.title;
            return { ...s, title: nextTitle, messages: nextMessages, lastMessage: msg.content, timestamp: msg.timestamp };
        }));
    };

    const handleAction = (type: string) => {
        if (type === 'diagnosis') {
            setActiveDiagnosis(true);
            const msg = createMessage('system', '正在调起一键探测流水线...');
            setMessages(prev => [...prev, msg]);
            appendToSession(activeSessionId, msg);
        } else if (type === 'human') {
            setIsHuman(true);
            const msg = createMessage('assistant', '正在为您呼叫省公司二线专家。');
            setMessages(prev => [...prev, msg]);
            appendToSession(activeSessionId, msg);
        }
    };

    const handleSend = async (draft?: string) => {
        const content = (draft ?? inputValue).trim();
        if (!content || isLoading) return;
        const userMsg: ChatMessage = createMessage('user', content);
        setMessages(prev => [...prev, userMsg]);
        appendToSession(activeSessionId, userMsg);
        if (!draft) setInputValue('');
        setIsLoading(true);
        try {
            const mockReply = resolveMockReply(content);
            if (mockReply) {
                const answer = createMessage('assistant', mockReply);
                setMessages(prev => [...prev, answer]);
                appendToSession(activeSessionId, answer);
                return;
            }
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
            if (!apiKey) {
                const noKeyMsg = createMessage('assistant', '当前环境未启用 AI 对话能力，请先使用内置快捷能力或联系人工支持。');
                setMessages(prev => [...prev, noKeyMsg]);
                appendToSession(activeSessionId, noKeyMsg);
                return;
            }
            const ai = new GoogleGenAI({ apiKey });
            
            const generateConfig: any = {};
            if (isThinkingEnabled) {
                generateConfig.thinkingConfig = { thinkingBudget: 4000 };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `你是一个政企运维助手。当前话题: "${activeSession.title}"。用户问题: "${content}"。请给出专业简练的建议。`,
                config: generateConfig
            });
            
            const answer = createMessage('assistant', response.text || '暂无法处理。');
            setMessages(prev => [...prev, answer]);
            appendToSession(activeSessionId, answer);
        } catch (error) {
            const err = createMessage('assistant', `请求失败，请稍后重试。${error instanceof Error ? ` (${error.message})` : ''}`);
            setMessages(prev => [...prev, err]);
            appendToSession(activeSessionId, err);
        } finally {
            setIsLoading(false);
        }
    };

    const SERVICE_MATRIX = [
        { id: '1', name: '一键诊断', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10', action: 'diagnosis' },
        { id: '2', name: 'CPE 核查', icon: Wifi, color: 'text-blue-400', bg: 'bg-blue-400/10', action: 'msg:帮我查一下名下离线的CPE' },
        { id: '3', name: '专线快照', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10', action: 'msg:查看当前专线运行快照' },
        { id: '4', name: '算力申请', icon: Cpu, color: 'text-purple-400', bg: 'bg-purple-400/10', action: 'msg:我想申请算力扩容' },
        { id: '5', name: '工单追踪', icon: ClipboardList, color: 'text-slate-400', bg: 'bg-slate-400/10', action: 'msg:查一下我最近的工单进度' },
        { id: '6', name: '接入专家', icon: Headset, color: 'text-indigo-400', bg: 'bg-indigo-400/10', action: 'human' },
        { id: '7', name: '临时提速', icon: Gauge, color: 'text-cyan-400', bg: 'bg-cyan-400/10', action: 'msg:我要办理SPN临时提速' },
        { id: '8', name: '效能报告', icon: FileText, color: 'text-orange-400', bg: 'bg-orange-400/10', action: 'msg:生成上周业务简报' },
    ];

    const handleMatrixClick = (action: string) => {
        if (action.startsWith('msg:')) {
            const cmd = action.replace('msg:', '');
            setInputValue(cmd);
            void handleSend(cmd);
        } else {
            handleAction(action);
        }
    };

    const handleCreateSession = () => {
        const id = `s_${Date.now()}`;
        const newSession: ChatSession = {
            id,
            title: '新咨询',
            lastMessage: '请描述您的问题',
            timestamp: nowText(),
            messages: [createMessage('assistant', '你好，我已为你创建新会话。请描述需要处理的问题。')],
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(id);
        setMessages(newSession.messages);
        setActiveDiagnosis(false);
        setIsHuman(initialIsHuman);
        setInputValue('');
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Increased width to w-96 (384px) to ensure time visibility */}
            <div className={`bg-[var(--sys-bg-header)]/50 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden ${showHistory ? 'w-96' : 'w-0'}`}>
                <div className="p-4 h-14 border-b border-slate-800 flex justify-between items-center whitespace-nowrap bg-[var(--sys-bg-header)]/40 shrink-0">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">历史会话</span>
                    <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors">
                        <ChevronLeft size={16}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 min-w-[384px]">
                    <button
                        onClick={handleCreateSession}
                        className="w-full flex items-center justify-center gap-2 p-2.5 mb-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold shadow-sm"
                    >
                        <Plus size={14}/> 发起新咨询
                    </button>
                    
                    <div className="space-y-1">
                        <div className="text-[10px] text-slate-600 font-bold mb-2 px-2 uppercase tracking-tighter">最近活动</div>
                        {sessions.map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => setActiveSessionId(s.id)}
                                className={`group relative p-4 rounded-2xl cursor-pointer border transition-all ${activeSessionId === s.id ? 'bg-indigo-600/20 border-indigo-500/40 shadow-lg' : 'hover:bg-slate-800 border-transparent'}`}
                            >
                                <div className="flex justify-between items-start gap-4 mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <MessageSquare size={14} className={activeSessionId === s.id ? 'text-indigo-400 shrink-0' : 'text-slate-600 shrink-0'} />
                                        <span className={`text-[13px] font-bold truncate ${activeSessionId === s.id ? 'text-white' : 'text-slate-400'}`}>{s.title}</span>
                                    </div>
                                    {/* Removed fixed width w-[65px] to allow full time display */}
                                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap shrink-0 mt-0.5 opacity-80">{s.timestamp}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate pl-6 opacity-60 leading-relaxed">{s.lastMessage}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Conversation Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--sys-bg-page)] relative">
                {/* Control Bar */}
                <div className="h-12 px-6 border-b border-slate-800 flex items-center justify-between bg-[var(--sys-bg-header)]/60 backdrop-blur-xl z-20 sticky top-0">
                    <div className="flex items-center gap-4">
                         {!showHistory && (
                             <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 transition-colors">
                                <HistoryIcon size={14} />
                                <span className="text-[10px] font-bold">显示历史</span>
                             </button>
                         )}
                         <div className="w-px h-3 bg-slate-800"></div>
                         <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${isHuman ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`}></div>
                             <span className="text-[11px] font-bold text-slate-300">{isHuman ? '专家: 王工' : '智能运维助理 (AI)'}</span>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 text-slate-500 hover:text-white transition-colors"><Settings2 size={14}/></button>
                    </div>
                </div>

                {/* Main Scroll Content */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-[210px]">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : (msg.role === 'system' ? 'justify-center' : 'justify-start')} animate-in fade-in duration-300`}>
                            {msg.role === 'system' ? (
                                <div className="bg-slate-800/50 px-4 py-1.5 rounded-full text-[10px] text-slate-500 border border-slate-700 flex items-center gap-2">
                                    <Activity size={12} className="text-indigo-500" /> {msg.content}
                                </div>
                            ) : (
                                <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-indigo-400'}`}>
                                        {msg.role === 'user' ? <User size={18} /> : (isHuman ? <Headset size={18} /> : <Bot size={18} />)}
                                    </div>
                                    <div className="space-y-1.5 min-w-0">
                                        <div className={`p-3.5 rounded-[22px] text-sm leading-relaxed shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                                            {msg.content}
                                        </div>
                                        <div className={`text-[9px] text-slate-600 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {activeDiagnosis && (
                        <div className="animate-in zoom-in duration-500 bg-[var(--sys-bg-header)] border border-indigo-500/20 rounded-[32px] overflow-hidden shadow-2xl relative mt-4">
                            <DiagnosisAgent embedded={true} onTransfer={() => { handleAction('human'); setActiveDiagnosis(false); }} onClose={() => setActiveDiagnosis(false)} />
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-4 items-center pl-13">
                                <Loader2 className="animate-spin text-indigo-500" size={16} />
                                <span className="text-[11px] text-slate-500 font-medium">AI 正在调取全域监测数据...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Hub & Bottom Action Matrix */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pt-2 border-t border-slate-800 bg-[var(--sys-bg-header)]/80 backdrop-blur-2xl z-30">
                    
                    {/* Small Quick Service Matrix */}
                    <div className="max-w-5xl mx-auto mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <Zap size={12} className="text-amber-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">快捷运维服务</span>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {SERVICE_MATRIX.map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => handleMatrixClick(s.action)}
                                    className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 hover:border-indigo-500/50 transition-all group"
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 group-hover:scale-110 transition-transform ${s.bg} ${s.color}`}>
                                        <s.icon size={16} />
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 group-hover:text-white whitespace-nowrap">{s.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto flex gap-3 items-center">
                        <div className="flex-1 relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500">
                                <button className="p-1 hover:bg-slate-800 rounded-lg"><Paperclip size={16}/></button>
                            </div>
                            <input 
                                className="w-full bg-slate-900 border border-slate-800 rounded-[18px] py-3 pl-11 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 shadow-inner transition-colors"
                                placeholder={isHuman ? "详细描述您遇到的问题细节..." : "输入排障指令或直接提问..."}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button 
                                    onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                                    className={`p-1 transition-all rounded-md flex items-center gap-1.5 px-2 ${isThinkingEnabled ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30' : 'text-slate-600 hover:text-slate-400 border border-transparent'}`}
                                    title={isThinkingEnabled ? "关闭深度思考" : "开启深度思考"}
                                >
                                    <Brain size={16} className={isThinkingEnabled ? 'animate-pulse' : ''} />
                                    {isThinkingEnabled && <span className="text-[10px] font-black uppercase tracking-tighter">Thinking</span>}
                                </button>
                            </div>
                        </div>
                        <Button 
                            onClick={handleSend} 
                            disabled={!inputValue.trim() || isLoading} 
                            className="rounded-xl w-11 h-11 p-0 bg-indigo-600 hover:bg-indigo-500 shadow-lg border-none shrink-0 group"
                        >
                            <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
