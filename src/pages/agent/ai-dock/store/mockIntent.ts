export type IntentType =
  | 'business'
  | 'knowledge'
  | 'qa'
  | 'report'
  | 'diagnosis'
  | 'fault'
  | 'ticket'
  | 'fallback';

const has = (input: string, words: string[]) => words.some((w) => input.includes(w));

export const detectIntent = (text: string): IntentType => {
  const input = text.trim().toLowerCase();

  if (!input) return 'fallback';

  if (has(input, [
    '业务查询',
    '我的业务',
    '业务列表',
    '有什么业务',
    '有哪些业务',
    '都有哪些业务',
    '业务有哪些',
    '名下业务',
    '查一下业务',
    '查业务',
  ])) return 'business';
  if (has(input, ['月报', '周报', '报告', '报表'])) return 'report';
  if (has(input, ['工单', '进度', 'ticket'])) return 'ticket';
  if (has(input, ['报障', '故障', '修复', '维修'])) return 'fault';
  if ((has(input, ['卡', '慢', '不通', '断', '异常']) && has(input, ['专线', '5g', 'idc', 'sdwan', '量子', '智算'])) || has(input, ['诊断', '体检'])) return 'diagnosis';
  if (has(input, ['什么', '是什么', '介绍', '解释', '怎么', '如何'])) return 'knowledge';
  if (has(input, ['怎么样', '好不好', '状态', '运行', '健康'])) return 'qa';

  return 'knowledge';
};
