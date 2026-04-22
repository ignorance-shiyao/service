
import { ReportItem } from './types';

export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rpt-202502',
    title: '2025年2月政企业务运行全景月报',
    period: '2025-02',
    createTime: '2025-03-01 09:00:00',
    status: 'published',
    smsSent: true,
    overallScore: 98.5,
    aiInterpretation: '2月份全网运行表现优异，尤其在春节保障期间，通过AI流量预测提前完成了扩容，专线可用率首次达成100%。智算中心受低温环境影响，PUE 效率达到年度最佳水平。',
    highlights: [
      { label: '平均可用率', value: '99.99', unit: '%', trend: 'up' },
      { label: '5G总流量', value: '1,240', unit: 'TB', trend: 'up' },
      { label: '安全拦截数', value: '45,021', unit: '次', trend: 'down' },
      { label: '平均 PUE', value: '1.22', unit: '', trend: 'down' }
    ],
    recommendations: [
      { type: 'optimization', title: '边缘节点资源调优', content: '合肥高新区 5G 核心网元负载率接近 85%，建议 3 月份进行扩容处理。' },
      { type: 'maintenance', title: '光缆春季巡检', content: '雨季将至，建议对皖南山区段落的干线光缆执行防水及应力检测。' }
    ],
    regionalStats: [
      { region: '合肥', score: 99, status: 'excellent' },
      { region: '芜湖', score: 97, status: 'excellent' },
      { region: '蚌埠', score: 82, status: 'warning' },
      { region: '安庆', score: 94, status: 'good' }
    ],
    data: [
      {
        businessType: '政企专线',
        metrics: [
          { name: '全网可用率', value: '99.98', unit: '%', trend: 'stable', changeRate: '0.01%', status: 'normal' },
          { name: '异常丢包次数', value: '12', unit: '次', trend: 'down', changeRate: '25%', status: 'normal' },
          { name: '平均时延', value: '12.5', unit: 'ms', trend: 'down', changeRate: '1.2ms', status: 'normal' }
        ]
      },
      {
        businessType: '5G 专网',
        metrics: [
          { name: '在线切片数', value: '452', unit: '个', trend: 'up', changeRate: '12', status: 'normal' },
          { name: '流量总量', value: '85.6', unit: 'TB', trend: 'up', changeRate: '15.2%', status: 'warning' }
        ]
      }
    ]
  },
  {
    id: 'rpt-202501',
    title: '2025年1月跨年保障特别简报',
    period: '2025-01',
    createTime: '2025-02-01 10:30:00',
    status: 'published',
    smsSent: true,
    overallScore: 92.4,
    aiInterpretation: '元旦期间流量波动剧烈，全网共启动一级响应 2 次，成功处置 4 起重大网络风险。',
    highlights: [
      { label: '峰值并发', value: '14.5', unit: '万', trend: 'up' },
      { label: '工单完成率', value: '99.2', unit: '%', trend: 'up' }
    ],
    recommendations: [],
    regionalStats: [],
    data: []
  },
  {
    id: 'rpt-202412',
    title: '2024年12月智算资源年度收官报告',
    period: '2024-12',
    createTime: '2025-01-01 14:00:00',
    status: 'published',
    smsSent: true,
    overallScore: 95.8,
    aiInterpretation: '年底各租户算力需求激增，GPU 利用率维持在 90% 以上，集群运行平稳，无掉节点事件。',
    highlights: [
      { label: '算力输出', value: '45.2', unit: 'PFlops', trend: 'up' },
      { label: 'GPU平均利用率', value: '91.4', unit: '%', trend: 'up' }
    ],
    recommendations: [
      { type: 'risk', title: '显存碎片预警', content: '部分大模型推理任务存在显存残留，建议优化调度回收机制。' }
    ],
    regionalStats: [],
    data: []
  },
  {
    id: 'rpt-202411',
    title: '2024年11月SD-WAN全网效能白皮书',
    period: '2024-11',
    createTime: '2024-12-01 08:30:00',
    status: 'published',
    smsSent: true,
    overallScore: 89.5,
    aiInterpretation: '本月针对跨省专线进行了多条冗余链路优化，全国接入时延平均下降 8ms。',
    highlights: [
      { label: '平均延时下降', value: '8.4', unit: 'ms', trend: 'down' },
      { label: '控制器并发', value: '1.2', unit: 'k', trend: 'up' }
    ],
    recommendations: [],
    regionalStats: [],
    data: []
  }
];
