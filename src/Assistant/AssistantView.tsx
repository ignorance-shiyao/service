
import React, { useState } from 'react';
import { 
  Bot, Maximize2, Minimize2, X, MessageSquare
} from 'lucide-react';
import { Badge } from '../components/UI';
import { ChatInterface } from './ChatInterface';
import { AssistantTab } from './types';

interface AssistantProps {
  mode: 'full' | 'half';
  onToggleMode: () => void;
  onClose: () => void;
}

export const AssistantView: React.FC<AssistantProps> = ({ mode, onToggleMode, onClose }) => {
  // 默认进入 AI 聊天模式，移除侧边栏切换逻辑
  const [activeTab] = useState<AssistantTab>('ai-chat');

  return (
    <div className="flex h-full bg-[var(--sys-bg-page)] text-slate-200 overflow-hidden flex-col font-sans">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[var(--sys-bg-header)] shrink-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <Bot className="text-indigo-500" size={20} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">AI 智能管家</h2>
          <Badge color="blue" className="ml-2 animate-pulse">全业务监测中</Badge>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleMode} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 transition-colors">
            {mode === 'half' ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-md text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 原有的侧边功能列已移除，直接渲染主体内容 */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--sys-bg-page)] relative">
          <ChatInterface isHuman={false} />
        </div>
      </div>
    </div>
  );
};
