import React from 'react';
import { MessageItem } from '../../types/message';
import { ActionButtonsMessage } from './ActionButtonsMessage';
import { BusinessCardMessage } from './BusinessCardMessage';
import { DiagnosisCardMessage } from './DiagnosisCardMessage';
import { FormMessage } from './FormMessage';
import { LoadingMessage } from './LoadingMessage';
import { ReportCardMessage } from './ReportCardMessage';
import { TextMessage } from './TextMessage';
import { TicketCardMessage } from './TicketCardMessage';

interface Props {
  message: MessageItem;
  onAction: (id: string) => void;
  onFormSubmit: (note: string) => void;
  onOpenBizCard: (id: string) => void;
}

export const MessageRenderer: React.FC<Props> = ({ message, onAction, onFormSubmit, onOpenBizCard }) => {
  switch (message.type) {
    case 'TextMessage':
      return <TextMessage payload={message.payload} />;
    case 'BusinessCardMessage':
      return <BusinessCardMessage payload={message.payload} onOpen={onOpenBizCard} />;
    case 'DiagnosisCardMessage':
      return <DiagnosisCardMessage payload={message.payload} />;
    case 'TicketCardMessage':
      return <TicketCardMessage payload={message.payload} />;
    case 'ReportCardMessage':
      return <ReportCardMessage payload={message.payload} />;
    case 'FormMessage':
      return <FormMessage payload={message.payload} onSubmit={onFormSubmit} />;
    case 'ActionButtonsMessage':
      return <ActionButtonsMessage payload={message.payload} actions={message.actions} onAction={onAction} />;
    case 'LoadingMessage':
      return <LoadingMessage payload={message.payload} />;
    default:
      return null;
  }
};
