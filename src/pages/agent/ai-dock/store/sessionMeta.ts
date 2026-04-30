import type { AiMessage } from './useAiDock';

export const extractMessagePreview = (message: AiMessage | undefined): string => {
  if (!message) return '暂无消息';
  if (message.text) return message.text;
  if (message.kind === 'qa' && message.data?.conclusion) return String(message.data.conclusion);
  if (message.kind === 'systemNotice' && message.data?.title) return String(message.data.title);
  if (message.kind === 'knowledgeCard' && message.data?.title) return `知识：${String(message.data.title)}`;
  if (message.kind === 'reportCard') return '运行报告';
  if (message.kind === 'businessQuery') return '业务查询结果';
  if (message.kind === 'ticketCard' && message.data?.title) return `工单：${String(message.data.title)}`;
  if (message.kind === 'faultForm') return '发起自助报障';
  return '会话消息';
};

export const buildSessionSnapshotTags = (messages: AiMessage[]): Array<{ label: string; tone: 'blue' | 'cyan' | 'indigo' | 'green' | 'amber' }> => {
  const tags: Array<{ label: string; tone: 'blue' | 'cyan' | 'indigo' | 'green' | 'amber' }> = [];
  const seen = new Set<string>();
  const recent = [...messages].reverse();

  const pushTag = (key: string, label: string, tone: 'blue' | 'cyan' | 'indigo' | 'green' | 'amber') => {
    if (seen.has(key) || tags.length >= 3) return;
    seen.add(key);
    tags.push({ label, tone });
  };

  for (const message of recent) {
    if (tags.length >= 3) break;
    if (message.kind === 'diagnosisReport') {
      const score = typeof message.data?.score === 'number' ? ` ${message.data.score}分` : '';
      pushTag('diagnosis', `诊断完成${score}`, 'cyan');
      continue;
    }
    if (message.kind === 'businessDiagnosisReport') {
      const score = typeof message.data?.averageScore === 'number' ? ` ${message.data.averageScore}分` : '';
      pushTag('health_check', `诊断完成${score}`, 'cyan');
      continue;
    }
    if (message.kind === 'businessDiagnosisSelect') {
      pushTag('health_select', '业务诊断', 'cyan');
      continue;
    }
    if (message.kind === 'reportCard') {
      pushTag('report', '运行报告', 'blue');
      continue;
    }
    if (message.kind === 'businessQuery') {
      pushTag('business', '业务清单', 'indigo');
      continue;
    }
    if (message.kind === 'ticketCard') {
      const status = typeof message.data?.status === 'string' ? ` ${message.data.status}` : '';
      pushTag('ticket', `工单${status}`, 'amber');
      continue;
    }
    if (message.kind === 'faultForm') {
      pushTag('fault', '报障处理中', 'amber');
      continue;
    }
    if (message.kind === 'systemNotice' && message.data) {
      const title = String(message.data.title || '');
      const done = message.data.status === 'done';
      if (title.includes('工单')) {
        pushTag('ticket_flow', done ? '工单流转完成' : '工单流转中', done ? 'green' : 'blue');
        continue;
      }
      if (title.includes('生成') || title.includes('导出')) {
        pushTag('export', done ? '导出完成' : '导出处理中', done ? 'green' : 'blue');
        continue;
      }
    }
    if (message.kind === 'qa' || message.kind === 'knowledgeCard') {
      pushTag('knowledge', '知识问答', 'indigo');
    }
  }

  if (tags.length === 0 && messages.length > 0) {
    pushTag('chat', '常规会话', 'blue');
  }
  return tags;
};

