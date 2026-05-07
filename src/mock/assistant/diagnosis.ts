export type DiagnosisCode = 'LINE' | '5G' | 'IDC' | 'SDWAN' | 'AIC';

export type DiagnosisTemplate = {
  id: DiagnosisCode;
  name: string;
  title: string;
  conclusion: string;
  score: number;
  findings: string[];
  suggestions: string[];
};

export const DIAGNOSIS_TEMPLATES: DiagnosisTemplate[] = [
  {
    id: 'LINE',
    name: '政企专线',
    title: '专线链路健康诊断',
    conclusion: '核心链路整体稳定，个别分支有轻微波动。',
    score: 99,
    findings: ['阜阳分支链路短时抖动1次，已自动恢复', '主备切换策略一致性通过', '近24小时丢包未超过0.1%'],
    suggestions: ['保持当前QoS策略并持续观察。', '保留主备链路演练频率每周1次。'],
  },
  {
    id: '5G',
    name: '5G专网',
    title: '5G接入与信号质量诊断',
    conclusion: '接入成功率稳定，夜间个别时段存在轻微波动。',
    score: 99,
    findings: ['终端接入成功率98.9%', '马鞍山区域SINR夜间波动', '核心网会话建立正常'],
    suggestions: ['夜间高负载时段动态扩容。', '优化问题区域射频参数。'],
  },
  {
    id: 'IDC',
    name: 'IDC动环',
    title: 'IDC动环与设备健康诊断',
    conclusion: '整体健康，机柜热区处于可控预警范围。',
    score: 98,
    findings: ['两处机柜温度逼近阈值', 'PDU告警已收敛', 'UPS负载均衡正常'],
    suggestions: ['调整高热区气流组织。', '增加热点机柜巡检频次。'],
  },
  {
    id: 'SDWAN',
    name: '量子+SD-WAN',
    title: '量子隧道与选路策略诊断',
    conclusion: '量子链路可用性高，个别隧道切换偏慢。',
    score: 91,
    findings: ['量子密钥健康度正常', '芜湖隧道切换时长偏高', '普通隧道负载分担合理'],
    suggestions: ['优化芜湖节点策略优先级。', '缩短关键链路密钥刷新间隔。'],
  },
  {
    id: 'AIC',
    name: '智算中心',
    title: '智算任务与资源调度诊断',
    conclusion: '资源总体可用，任务高峰排队需要持续优化。',
    score: 82,
    findings: ['GPU均值利用率72%', '高峰排队时延偏高', '失败任务主要来自镜像依赖'],
    suggestions: ['增加高峰时段资源池。', '加强镜像规范与预检流程。'],
  },
];

export const DIAGNOSIS_STEPS = [
  '采集实时运行指标',
  '关联告警与日志事件',
  '执行多维根因分析',
  '生成诊断结论与建议',
];
