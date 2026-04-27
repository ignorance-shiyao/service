import { ChatSession } from '../../Assistant/types';

export const DEFAULT_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 's1',
    title: '专线丢包故障诊断',
    lastMessage: '已定位至物理层异常。',
    timestamp: '10:20 AM',
    messages: [
      { id: 'm1-1', role: 'assistant', content: '您好！检测到您管理的“合肥-南京专线”近期出现丢包波动。建议执行深度诊断。', timestamp: '10:15 AM' },
      { id: 'm1-2', role: 'user', content: '现在的探测结果如何？', timestamp: '10:18 AM' },
      { id: 'm1-3', role: 'assistant', content: '当前链路仍有亚健康波动，通过分层探测已定位至 B 端的物理接口异常。', timestamp: '10:20 AM' },
    ],
  },
  {
    id: 's2',
    title: '5G CPE 在线态核查',
    lastMessage: 'UUID: 5G-CPE-002',
    timestamp: 'Yesterday 14:20',
    messages: [{ id: 'm2-1', role: 'assistant', content: '查询完成。目前 5G-CPE-002 处于离线态。', timestamp: 'Yesterday 14:00' }],
  },
  {
    id: 's3',
    title: '智算中心 PUE 咨询',
    lastMessage: '能效指标已恢复正常。',
    timestamp: 'Mar 12, 2025',
    messages: [{ id: 'm3-1', role: 'assistant', content: '关于智算中心 Q1 季度的能效简报已生成。平均 PUE 为 1.25。', timestamp: 'Mar 12 09:30' }],
  },
];

