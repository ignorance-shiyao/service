
import { KNOWLEDGE_ITEMS } from '../mock/assistant';
import { KnowledgeItem, KBContentType } from './types';

const inferContentType = (title: string, content: string): KBContentType => {
  const normalized = `${title} ${content}`.toLowerCase();
  if (normalized.includes('faq') || normalized.includes('问答')) return 'FAQ';
  if (normalized.includes('视频') || normalized.includes('演示')) return 'VIDEO';
  if (normalized.includes('政策') || normalized.includes('规范')) return 'POLICY';
  return 'GUIDE';
};

const inferSteps = (content: string): string[] | undefined => {
  const lines = content
    .replace(/##\s*/g, '')
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 6);
  return lines.length > 1 ? lines : undefined;
};

export const MOCK_KB_DATA: KnowledgeItem[] = KNOWLEDGE_ITEMS.map((item, index) => ({
  id: item.id,
  title: item.title,
  businessType: item.business,
  contentType: inferContentType(item.title, item.content),
  content: item.content,
  tags: item.tags,
  views: 900 + index * 47,
  likes: 80 + index * 3,
  updateTime: item.updatedAt,
  steps: inferSteps(item.content),
  versions: [
    {
      versionId: `v-${item.id}-1`,
      versionNum: 'V1.0',
      updateTime: `${item.updatedAt} 09:00`,
      updater: item.owner,
      changeLog: '统一从 src/mock/assistant/knowledge.ts 引用',
      content: item.content,
      steps: inferSteps(item.content),
    },
  ],
}));
