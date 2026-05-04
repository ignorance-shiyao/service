export const buildTicketStillProcessingNotice = (payload: {
  ticketId: string;
  reason: string;
}) => `工单 ${payload.ticketId} 仍在处理中（${payload.reason}）`;

export const buildTicketPendingConfirmNotice = (ticketId: string) =>
  `工单 ${ticketId} 已进入待客户确认`;
