import React, { useState } from 'react';
import { Bot, Copy, RotateCcw, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import { AiMessage } from '../store/useAiDock';

interface MessageBubbleProps {
  message: AiMessage;
  onCopy?: (text: string) => void;
  onRetry?: () => void;
}

const formatBubbleTime = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCopy, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  if (!message.text) return null;
  const isUser = message.role === 'user';

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3a7dbc] bg-[#1a4f82] text-[#bfe4ff] shadow-[0_6px_14px_rgba(3,25,53,0.35)]">
          <Bot size={14} />
        </div>
      )}
      <div className={`max-w-[88%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`mb-1 text-[10px] ${isUser ? 'text-[#97cfff]' : 'text-[#8fbedf]'}`}>
          {isUser ? '我' : '智慧运维管家'} · {formatBubbleTime(message.createdAt)}
        </div>
        <div
          className={`ai-dock-bubble rounded-2xl px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? 'ai-dock-bubble-user rounded-br-md border border-[#74c5ff] text-white'
              : 'ai-dock-bubble-assistant rounded-bl-md border border-[#4a8abb] text-[var(--sys-text-primary)] backdrop-blur-sm'
          } whitespace-pre-wrap`}
        >
          {message.text}
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-[#3a6f9f] bg-[#11385f] px-1.5 py-0.5 text-[#a8cfee] hover:border-[#65b6f0] hover:text-[#d7efff]"
            onClick={() => {
              onCopy?.(message.text || '');
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }}
            title="复制"
          >
            <Copy size={10} />
            {copied ? '已复制' : '复制'}
          </button>
          {!isUser && (
            <>
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${feedback === 'up' ? 'border-[#6ec59f] bg-[#104f3c] text-[#b7f1d9]' : 'border-[#3a6f9f] bg-[#11385f] text-[#a8cfee] hover:border-[#65b6f0] hover:text-[#d7efff]'}`}
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                title="有帮助"
              >
                <ThumbsUp size={10} />
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${feedback === 'down' ? 'border-[#c98080] bg-[#5a2530] text-[#ffd3d3]' : 'border-[#3a6f9f] bg-[#11385f] text-[#a8cfee] hover:border-[#65b6f0] hover:text-[#d7efff]'}`}
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                title="无帮助"
              >
                <ThumbsDown size={10} />
              </button>
            </>
          )}
          {!isUser && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-[#3a6f9f] bg-[#11385f] px-1.5 py-0.5 text-[#a8cfee] hover:border-[#65b6f0] hover:text-[#d7efff]"
              onClick={onRetry}
              title="重试"
            >
              <RotateCcw size={10} />
              重试
            </button>
          )}
        </div>
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#4b97e6] bg-[#2667b7] text-[#d9eeff] shadow-[0_6px_14px_rgba(8,44,92,0.3)]">
          <User size={14} />
        </div>
      )}
    </div>
  );
};
