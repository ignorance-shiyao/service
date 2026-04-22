import React from 'react';
import { BizDetailDrawerBase } from './BizDetailDrawerBase';
import { BizDetailData } from '../../mock/businessDetails';

interface Props {
  data: BizDetailData;
  onClose: () => void;
  onAction: (action: 'diagnosis' | 'history' | 'ticket' | 'manager') => void;
}

export const ZhisuanDrawer: React.FC<Props> = ({ data, onClose, onAction }) => {
  return <BizDetailDrawerBase data={data} onClose={onClose} onAction={onAction} />;
};
