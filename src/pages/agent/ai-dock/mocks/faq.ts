export type FaqItem = {
  id: string;
  q: string;
  conclusion: string;
  explanation: string;
  suggestions?: string[];
  sourceId?: string;
  followups?: string[];
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq_1',
    q: '最近专线质量怎么样',
    conclusion: '专线整体运行稳定，核心链路在线率保持在99.92%。',
    explanation: '近24小时仅出现2次轻微抖动告警，均在3分钟内自动恢复。',
    suggestions: ['查看本月运行报告', '发起专线深度诊断'],
    sourceId: 'line_1',
    followups: ['哪些站点抖动高？', '专线告警分布如何？', '可以导出日报吗？']
  },
  {
    id: 'faq_2',
    q: '量子sdwan是否安全',
    conclusion: '当前量子+SD-WAN链路安全等级为高。',
    explanation: '密钥刷新与链路健康均在阈值范围内，未发现高危异常。',
    suggestions: ['查看密钥健康详情', '查看量子链路拓扑'],
    sourceId: 'sdwan_1',
    followups: ['密钥多久刷新一次？', '哪些地市启用了量子？', '异常时如何处置？']
  },
  {
    id: 'faq_3',
    q: '5g终端接入失败怎么办',
    conclusion: '建议优先核查终端鉴权与APN策略。',
    explanation: '大多数接入失败由策略错配或终端参数异常引起，建议四层排查。',
    suggestions: ['发起5G接入诊断', '查看排查知识'],
    sourceId: '5g_3',
    followups: ['是否影响核心业务？', '可以自动诊断吗？', '如何快速恢复？']
  },
  {
    id: 'faq_4',
    q: 'idc动环告警多吗',
    conclusion: '本周IDC动环告警较上周下降12%。',
    explanation: '主要告警仍集中在空调与PDU高温，已进入巡检闭环。',
    suggestions: ['查看IDC报告', '查看PDU告警知识'],
    sourceId: 'idc_2',
    followups: ['哪些机房告警最高？', '有未关闭工单吗？', '能看趋势图吗？']
  },
  {
    id: 'faq_5',
    q: '智算任务失败率高吗',
    conclusion: '智算任务失败率处于可控区间，但有波动风险。',
    explanation: '近7天失败率2.8%，主要原因为镜像依赖和配额冲突。',
    suggestions: ['查看智算失败原因', '发起智算诊断'],
    sourceId: 'aic_4',
    followups: ['失败率按租户分布？', '如何降低失败率？', '有自动修复建议吗？']
  },
  {
    id: 'faq_6',
    q: '怎么看工单进度',
    conclusion: '可直接查看最近工单卡片，实时展示当前处理环节。',
    explanation: '工单状态支持系统消息推送，关键节点会自动提醒。',
    suggestions: ['查看我的工单', '联系客户经理']
  },
  { id: 'faq_7', q: '怎么导出月报', conclusion: '可在报告卡片内一键导出PDF或长图。', explanation: '系统会先生成摘要与趋势图，再返回下载链接。', suggestions: ['生成本月月报'] },
  { id: 'faq_8', q: '告警太多怎么处理', conclusion: '建议先按业务与严重度分组，再执行根因聚类处理。', explanation: '批量去重和关联分析可显著提升处置效率。', suggestions: ['发起业务诊断'] },
  { id: 'faq_9', q: '如何联系客户经理', conclusion: '可在任意兜底卡或顶栏动作中发起联系。', explanation: '系统会带上当前会话上下文，便于快速介入。', suggestions: ['立即联系客户经理'] },
  { id: 'faq_10', q: '专线割接会中断吗', conclusion: '规范割接可将中断窗口压缩到秒级。', explanation: '关键在于预演与回退预案完备。', sourceId: 'line_4' },
  { id: 'faq_11', q: '切片和专网关系', conclusion: '切片是专网能力实现方式之一。', explanation: '可针对业务类型提供差异化SLA。', sourceId: '5g_2' },
  { id: 'faq_12', q: '机房扩容流程', conclusion: '需先容量评估再走审批实施。', explanation: '建议附带容量预测与风险评估。', sourceId: 'idc_4' },
  { id: 'faq_13', q: '密钥异常怎么恢复', conclusion: '先排查QKD链路，再执行策略降级。', explanation: '恢复后需补充复盘并优化阈值。', sourceId: 'sdwan_4' },
  { id: 'faq_14', q: 'gpu利用率太低', conclusion: '建议合并低负载任务并开启弹性缩容。', explanation: '可显著降低成本浪费。', sourceId: 'aic_3' },
  { id: 'faq_15', q: '自动诊断支持哪些业务', conclusion: '支持专线、5G、IDC、量子+SD-WAN、智算五类业务。', explanation: '每类业务都提供标准化诊断主线。', suggestions: ['开始业务体检'] },
];
