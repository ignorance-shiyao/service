import { detectIntent, IntentType } from './mockIntent';

const shouldForceBusinessIntent = (input: string) =>
  !(
    input.includes('诊断') ||
    input.includes('体检') ||
    input.includes('异常分析') ||
    input.includes('排障')
  ) &&
  input.includes('业务') &&
  (input.includes('查询') ||
    input.includes('列表') ||
    input.includes('清单') ||
    input.includes('有哪些') ||
    input.includes('有什么') ||
    input.includes('名下') ||
    input.includes('查一下') ||
    input.includes('查'));

export const resolveIntent = (inputRaw: string, forcedIntent?: IntentType): IntentType => {
  const input = inputRaw.toLowerCase();
  const intentFromModel = forcedIntent || detectIntent(input);
  return shouldForceBusinessIntent(input) ? 'business' : intentFromModel;
};
