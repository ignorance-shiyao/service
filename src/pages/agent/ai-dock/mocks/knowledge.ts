export type KnowledgeBusinessType = 'LINE' | '5G' | 'IDC' | 'SDWAN' | 'AIC';

export type KnowledgeItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  business: KnowledgeBusinessType;
  tags: string[];
  updatedAt: string;
  owner: string;
};

const section = (title: string, lines: string[]) => `## ${title}\n${lines.map((l) => `- ${l}`).join('\n')}`;

export const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'line_1',
    title: '什么是双链路保护',
    summary: '双链路保护通过主备或负载分担模式，在一条链路故障时自动切换，确保专线不中断。',
    content: [
      section('适用场景', ['总部-分支核心链路', '高可用生产系统', '金融交易低中断容忍业务']),
      section('关键检查项', ['BFD会话稳定', '主备切换时延<1s', '路由优先级策略一致']),
      section('常见风险', ['主备链路同路由', '监控阈值未分级', '切换演练缺失'])
    ].join('\n\n'),
    business: 'LINE',
    tags: ['专线', '高可用'],
    updatedAt: '2026-04-21',
    owner: '专线运维组'
  },
  {
    id: 'line_2',
    title: '专线端口流量为什么会突增',
    summary: '通常由备份窗口、批处理同步或异常广播引起，建议结合时序流量和告警联合判定。',
    content: '先确认突增时段是否匹配业务计划，再核对源目IP分布，最后排查广播风暴与环路。',
    business: 'LINE',
    tags: ['流量', '排障'],
    updatedAt: '2026-04-19',
    owner: '专线运维组'
  },
  {
    id: 'line_3',
    title: '如何查看专线接入点',
    summary: '从资源视图按客户编码检索，进入链路详情可查看接入机房、端口与链路状态。',
    content: '入口：资源可视 -> 专线资源 -> 客户编码检索。可导出接入点清单用于巡检。',
    business: 'LINE',
    tags: ['资源', '巡检'],
    updatedAt: '2026-04-16',
    owner: '资源管理组'
  },
  {
    id: 'line_4',
    title: '专线割接流程',
    summary: '割接分为准备、预检、执行、回退与复盘五阶段，关键是回退预案可验证。',
    content: '执行前需冻结窗口并完成双人复核，执行后30分钟持续观察时延、丢包与会话成功率。',
    business: 'LINE',
    tags: ['变更', '流程'],
    updatedAt: '2026-04-14',
    owner: '变更管理组'
  },
  {
    id: '5g_1',
    title: '5G 专网与公网区别',
    summary: '专网强调隔离、安全与可控时延，公网强调覆盖广与成本效率。',
    content: '专网支持定制QoS、切片保障和专属运维策略，适合关键生产业务。',
    business: '5G',
    tags: ['5G', '专网'],
    updatedAt: '2026-04-20',
    owner: '5G运维组'
  },
  {
    id: '5g_2',
    title: '5G 切片是什么',
    summary: '切片是在同一物理网络上划分逻辑网络，满足不同业务的SLA需求。',
    content: '典型切片类型：eMBB、URLLC、mMTC，需按业务优先级配置资源。',
    business: '5G',
    tags: ['切片', 'SLA'],
    updatedAt: '2026-04-17',
    owner: '5G运维组'
  },
  {
    id: '5g_3',
    title: '5G 终端接入失败排查',
    summary: '按“终端-无线-核心网-策略”四层排查，优先确认鉴权与APN策略。',
    content: '建议采集终端日志、基站告警、UPF会话建立记录并做时间线对齐。',
    business: '5G',
    tags: ['接入', '排障'],
    updatedAt: '2026-04-13',
    owner: '5G运维组'
  },
  {
    id: '5g_4',
    title: '专网覆盖扩展流程',
    summary: '包含需求评估、勘测、方案评审、实施与验收，需提前明确终端分布。',
    content: '验收重点关注RSRP、SINR、业务成功率和热点区域并发承载。',
    business: '5G',
    tags: ['覆盖', '实施'],
    updatedAt: '2026-04-10',
    owner: '网络规划组'
  },
  {
    id: 'idc_1',
    title: '机房温湿度阈值',
    summary: '建议温度18-27℃，相对湿度40%-60%，越界需触发分级告警。',
    content: '需结合机柜高热区做分区阈值，不建议统一全局阈值。',
    business: 'IDC',
    tags: ['动环', '阈值'],
    updatedAt: '2026-04-22',
    owner: 'IDC运维组'
  },
  {
    id: 'idc_2',
    title: 'PDU 告警含义',
    summary: 'PDU告警常见为过流、过载、掉电与温升，建议联动电源与设备日志分析。',
    content: '异常持续>5分钟建议触发巡检工单，并执行负载均衡。',
    business: 'IDC',
    tags: ['PDU', '告警'],
    updatedAt: '2026-04-18',
    owner: 'IDC运维组'
  },
  {
    id: 'idc_3',
    title: '动环巡检流程',
    summary: '巡检包括供电、空调、消防、门禁与环境传感器五类项，建议周巡+月检。',
    content: '巡检结果需沉淀为设备健康评分，异常项自动入告警池。',
    business: 'IDC',
    tags: ['巡检', '流程'],
    updatedAt: '2026-04-12',
    owner: 'IDC运维组'
  },
  {
    id: 'idc_4',
    title: '机柜扩容申请',
    summary: '扩容需评估电力、制冷、网络与资产容量，审批后进入实施排期。',
    content: '建议附带近30天负载趋势和未来90天容量预测。',
    business: 'IDC',
    tags: ['容量', '扩容'],
    updatedAt: '2026-04-09',
    owner: '资源管理组'
  },
  {
    id: 'sdwan_1',
    title: '量子加密保护是什么',
    summary: '通过量子密钥分发增强密钥安全性，与SD-WAN隧道协同提升链路防护等级。',
    content: '建议在总部-关键分支优先启用，并设置密钥健康监测。',
    business: 'SDWAN',
    tags: ['量子', '加密'],
    updatedAt: '2026-04-23',
    owner: '量子网络组'
  },
  {
    id: 'sdwan_2',
    title: '密钥刷新周期',
    summary: '推荐按业务等级设置30秒-5分钟动态刷新，关键业务建议更短周期。',
    content: '需平衡安全性与设备开销，异常时触发降级策略。',
    business: 'SDWAN',
    tags: ['密钥', '策略'],
    updatedAt: '2026-04-20',
    owner: '量子网络组'
  },
  {
    id: 'sdwan_3',
    title: 'SD-WAN 选路策略',
    summary: '按时延、抖动、丢包和成本综合选路，建议核心业务优先质量策略。',
    content: '可配置主路径+备路径，异常超过阈值自动切换。',
    business: 'SDWAN',
    tags: ['选路', '策略'],
    updatedAt: '2026-04-15',
    owner: 'SD-WAN运维组'
  },
  {
    id: 'sdwan_4',
    title: '量子密钥异常处置',
    summary: '先确认QKD链路状态，再核对密钥池与策略同步，必要时切回经典加密。',
    content: '处置完成后需补做复盘并优化告警阈值。',
    business: 'SDWAN',
    tags: ['异常', '处置'],
    updatedAt: '2026-04-11',
    owner: '量子网络组'
  },
  {
    id: 'aic_1',
    title: '智算资源计费口径说明',
    summary: '按GPU时长、存储占用、网络流量和调度优先级计费，支持项目分摊。',
    content: '建议按月输出租户成本分析，识别低效任务。',
    business: 'AIC',
    tags: ['计费', '成本'],
    updatedAt: '2026-04-22',
    owner: '智算运营组'
  },
  {
    id: 'aic_2',
    title: '训练任务排队机制',
    summary: '队列按项目优先级和配额调度，资源紧张时支持抢占策略。',
    content: '关键任务建议预留资源池，避免高峰排队。',
    business: 'AIC',
    tags: ['训练', '调度'],
    updatedAt: '2026-04-18',
    owner: '智算调度组'
  },
  {
    id: 'aic_3',
    title: 'GPU 利用率查看方法',
    summary: '可在资源看板按租户/任务查看GPU利用率、显存占用和热度分布。',
    content: '低利用率任务建议启用自动合并与弹性缩容。',
    business: 'AIC',
    tags: ['GPU', '监控'],
    updatedAt: '2026-04-13',
    owner: '智算运维组'
  },
  {
    id: 'aic_4',
    title: '任务失败常见原因',
    summary: '常见原因包括镜像依赖缺失、数据路径错误、资源配额不足与网络超时。',
    content: '建议结合任务日志与节点事件做自动根因归类。',
    business: 'AIC',
    tags: ['任务', '故障'],
    updatedAt: '2026-04-08',
    owner: '智算运维组'
  },
];
