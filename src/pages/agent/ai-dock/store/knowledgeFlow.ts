import { FAQ_ITEMS, FaqItem, KNOWLEDGE_ITEMS, KnowledgeItem } from '../../../../mock/assistant';

const businessKeywordMap: Array<{ business: KnowledgeItem['business']; keywords: string[] }> = [
  { business: 'LINE', keywords: ['专线', '政企专线', '双链路'] },
  { business: '5G', keywords: ['5g', '专网', '切片', '终端接入'] },
  { business: 'IDC', keywords: ['idc', '机房', '动环', 'pdu'] },
  { business: 'SDWAN', keywords: ['sdwan', '量子', '密钥', '选路'] },
  { business: 'AIC', keywords: ['智算', 'gpu', '训练任务', '算力'] },
];

const normalizeText = (text: string) => text.toLowerCase().trim();

const compact = (text: string) => text.replace(/\s+/g, '').replace(/[，。！？；、,.!?;:：\-\(\)（）]/g, '').toLowerCase();

const uniqueNearTexts = (list: string[], limit = 3) => {
  const picked: string[] = [];
  for (const item of list) {
    const c = compact(item);
    const duplicated = picked.some((p) => {
      const pc = compact(p);
      return pc.includes(c) || c.includes(pc);
    });
    if (!duplicated) picked.push(item);
    if (picked.length >= limit) break;
  }
  return picked;
};

const extractKnowledgeCoreLines = (item: KnowledgeItem) => {
  const raw = item.content
    .replace(/##\s*/g, '')
    .split('\n')
    .map((line) => line.replace(/^-+\s*/, '').trim())
    .filter(Boolean);
  const fromSummary = item.summary.replace(/。$/, '');
  return uniqueNearTexts([fromSummary, ...raw], 3);
};

export const searchKnowledge = (rawInput: string, limit = 3): KnowledgeItem[] => {
  const input = normalizeText(rawInput);
  const requestedBusinesses = businessKeywordMap
    .filter((item) => item.keywords.some((kw) => input.includes(kw)))
    .map((item) => item.business);

  const scored = KNOWLEDGE_ITEMS.map((item) => {
    let score = 0;
    const title = normalizeText(item.title);
    const summary = normalizeText(item.summary);
    const content = normalizeText(item.content);
    const tags = item.tags.map((tag) => normalizeText(tag));

    if (title.includes(input)) score += 18;
    if (summary.includes(input)) score += 10;
    if (content.includes(input)) score += 6;
    if (tags.some((tag) => input.includes(tag) || tag.includes(input))) score += 9;
    if (requestedBusinesses.includes(item.business)) score += 7;
    if (input.includes('知识库') || input.includes('知识')) score += 2;

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.item.updatedAt.localeCompare(a.item.updatedAt));

  if (scored.length === 0) return KNOWLEDGE_ITEMS.slice(0, limit);
  return scored.slice(0, limit).map((entry) => entry.item);
};

export const matchKnowledge = (input: string): KnowledgeItem => {
  const lowered = input.toLowerCase();
  const hit = KNOWLEDGE_ITEMS.find(
    (k) => lowered.includes(k.title.toLowerCase()) || k.tags.some((tag) => lowered.includes(tag.toLowerCase()))
  );
  return hit || KNOWLEDGE_ITEMS[0];
};

export const findFaq = (input: string): FaqItem | undefined =>
  FAQ_ITEMS.find((item) => input.includes(item.q.replace(/[？?]/g, '').toLowerCase()));

export const buildKnowledgeQaPayload = (item: KnowledgeItem) => {
  const coreLines = extractKnowledgeCoreLines(item);
  const relatedFaq = FAQ_ITEMS
    .filter((faq) => faq.sourceId === item.id || (faq.sourceId && faq.sourceId.startsWith(item.business.toLowerCase())))
    .slice(0, 5);
  const faqTexts = relatedFaq.map((faq) => faq.q);
  const opSuggestions = uniqueNearTexts([
    `查看《${item.title}》原始知识`,
    `按《${item.title}》输出执行步骤`,
    '继续推荐同类知识',
    ...relatedFaq.flatMap((faq) => faq.suggestions || []),
  ], 3);
  const followups = uniqueNearTexts([
    ...faqTexts,
    `这个知识在${item.business}场景怎么落地？`,
    '有没有同类案例？',
  ], 3);

  return {
    conclusion: coreLines[0] || item.summary,
    explanation: coreLines.slice(1).join('；') || item.summary,
    sourceId: item.id,
    suggestions: opSuggestions,
    followups,
  };
};

