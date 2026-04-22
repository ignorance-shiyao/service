import { useAIDock } from '../store/aidock';
import { MessageItem } from '../types/message';

const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

export const useChat = () => {
  const { state, appendMessage, runDiagnosis, createTicket, setModelMode } = useAIDock();

  const sendUserText = (text: string) => {
    if (!text.trim()) return;
    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      time: now(),
      type: 'TextMessage',
      payload: { text }
    };
    appendMessage(userMsg);

    if (state.modelMode === 'faq' && !text.includes('专线') && !text.includes('体检')) {
      appendMessage({
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        time: now(),
        type: 'ActionButtonsMessage',
        payload: { text: '我暂时回答不了这个问题，但可以帮您转客户经理。' },
        actions: [{ id: 'transfer-human', label: '一键转客户经理', kind: 'primary' }]
      });
      return;
    }

    if (text.includes('阜阳') && text.includes('合肥') && text.includes('专线')) {
      appendMessage({
        id: `line-structured-${Date.now()}`,
        role: 'assistant',
        time: now(),
        type: 'TextMessage',
        payload: {
          title: '结论',
          text: '当前合肥总部到阜阳分支专线存在异常。解释：近 15 分钟检测到连接波动。建议：立即体检并发起报障。'
        }
      });
      appendMessage({
        id: `line-card-${Date.now()}`,
        role: 'assistant',
        time: now(),
        type: 'BusinessCardMessage',
        payload: { cards: state.cards.filter((card) => card.id === 'xianlu') }
      });
      appendMessage({
        id: `line-action-${Date.now()}`,
        role: 'assistant',
        time: now(),
        type: 'ActionButtonsMessage',
        actions: [{ id: 'open-line-detail', label: '查看专线详情', kind: 'primary' }]
      });
      return;
    }

    if (text.includes('体检') || text.includes('报警') || text.includes('告警')) {
      runDiagnosis();
      return;
    }

    if (text.includes('业务') || text.includes('状态') || text.includes('专线')) {
      appendMessage({
        id: `biz-${Date.now()}`,
        role: 'assistant',
        time: now(),
        type: 'BusinessCardMessage',
        payload: { cards: state.cards }
      });
      return;
    }

    if (text.includes('月报') || text.includes('周报')) {
      appendMessage({
        id: `report-${Date.now()}`,
        role: 'assistant',
        time: now(),
        type: 'ReportCardMessage',
        payload: {
          title: '服务报告摘要',
          summary: '本月总体良好，1 次小故障已恢复，合同承诺达标情况良好。'
        }
      });
      return;
    }

    appendMessage({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      time: now(),
      type: 'TextMessage',
      payload: {
        title: '结论',
        text: '当前业务运行平稳。建议您查看“业务概览”或执行一次一键体检。'
      }
    });
  };

  return {
    messages: state.messages,
    modelMode: state.modelMode,
    sendUserText,
    runDiagnosis,
    createTicket,
    setModelMode
  };
};
