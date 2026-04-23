import React from 'react';
import { Bot, User } from 'lucide-react';
import { AiMessage } from '../store/useAiDock';

interface MessageBubbleProps {
  message: AiMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  if (!message.text) return null;
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3a7dbc] bg-[#1a4f82] text-[#bfe4ff] shadow-[0_6px_14px_rgba(3,25,53,0.35)]">
          <Bot size={14} />
        </div>
      )}
      <div
        className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md border border-[#69bbff] bg-[#2e75ca] text-white shadow-[0_10px_22px_rgba(8,46,96,0.35)]'
            : 'rounded-bl-md border border-[#3f7fb7] bg-[#1b4f82] text-[var(--sys-text-primary)] shadow-[0_8px_18px_rgba(3,21,47,0.3)] backdrop-blur-sm'
        } whitespace-pre-wrap`}
      >
        {message.text}
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#4b97e6] bg-[#2667b7] text-[#d9eeff] shadow-[0_6px_14px_rgba(8,44,92,0.3)]">
          <User size={14} />
        </div>
      )}
    </div>
  );
};
