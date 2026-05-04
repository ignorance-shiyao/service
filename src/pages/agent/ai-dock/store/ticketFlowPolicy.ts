type TicketAutoConfirmInput = {
  severity?: string;
  desc?: string;
  ticketCount: number;
};

type TicketAutoConfirmDecision = {
  allow: boolean;
  reason?: string;
};

const CRITICAL_DESC_PATTERN = /(中断|不可用|全断|大面积|核心)/;

export const decideAutoMoveToCustomerConfirm = (
  input: TicketAutoConfirmInput
): TicketAutoConfirmDecision => {
  if (input.ticketCount !== 1) {
    return { allow: false, reason: '批量报障需人工复核后再进入客户确认。' };
  }
  if ((input.severity || '').trim() === '高') {
    return { allow: false, reason: '高严重度工单需人工复核后再进入客户确认。' };
  }
  if (CRITICAL_DESC_PATTERN.test(input.desc || '')) {
    return { allow: false, reason: '包含中断类关键词，需人工复核后再进入客户确认。' };
  }
  return { allow: true };
};

export type { TicketAutoConfirmInput, TicketAutoConfirmDecision };
