
export type AssistantTab = 'ai-chat' | 'interruption-diag' | 'human-support' | 'notifications' | 'announcements';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: 'text' | 'diagnostic-report' | 'action-link';
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'sms' | 'app' | 'email' | 'msg5g';
}

export interface AgentInfo {
  name: string;
  id: string;
  status: 'online' | 'busy' | 'offline';
  avatar?: string;
  specialty: string[];
}

export interface DiagnosisStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: string;
  evidence?: any;
}
