import React from 'react';
import { AiMessage } from '../../store/useAiDock';

interface ProgressiveCardShellProps {
  message: AiMessage;
  children: React.ReactNode;
}

export const ProgressiveCardShell: React.FC<ProgressiveCardShellProps> = ({ message, children }) => {
  return <div className="ai-dock-card-reveal">{children}</div>;
};
