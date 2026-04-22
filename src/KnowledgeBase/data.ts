
import { KnowledgeItem } from './types';

export const MOCK_KB_DATA: KnowledgeItem[] = [
  {
    id: 'kb-1',
    title: '政企专线丢包严重排查手册',
    businessType: 'LINE',
    contentType: 'GUIDE',
    content: '针对政企专线业务，丢包通常由端口拥塞、光功率异常或链路质量劣化引起。',
    steps: [
      '登录 NMS 查看实时端口带宽利用率',
      '检查收发光功率是否在标准区间 (-3dBm 至 -20dBm)',
      '执行逐跳 PING 测试定位故障段落',
      '检查本地交换机双工模式配置'
    ],
    tags: ['丢包', '排障', '专线'],
    views: 1240,
    likes: 85,
    updateTime: '2025-03-12',
    versions: [
      {
        versionId: 'v1',
        versionNum: 'V1.1',
        updateTime: '2025-03-12 10:00',
        updater: 'admin',
        changeLog: '完善了光功率检查的标准区间描述',
        content: '针对政企专线业务，丢包通常由端口拥塞、光功率异常或链路质量劣化引起。',
        steps: ['登录 NMS 查看实时端口带宽利用率', '检查收发光功率是否在标准区间 (-3dBm 至 -20dBm)', '执行逐跳 PING 测试定位故障段落', '检查本地交换机双工模式配置']
      },
      {
        versionId: 'v0',
        versionNum: 'V1.0',
        updateTime: '2025-02-15 09:00',
        updater: 'system',
        changeLog: '初始版本发布',
        content: '政企专线丢包基础排查步骤。',
        steps: ['检查带宽', '检查设备']
      }
    ]
  },
  {
    id: 'kb-2',
    title: '5G 核心网切片开通演示',
    businessType: '5G',
    contentType: 'VIDEO',
    content: '本视频详细介绍了如何在智慧运维管家中快速完成 5G 切片的端到端开通流程。',
    tags: ['5G', '切片', '开通'],
    views: 3500,
    likes: 420,
    updateTime: '2025-02-20'
  },
  {
    id: 'kb-3',
    title: 'SD-WAN 控制器双机冗余切换机制 FAQ',
    businessType: 'SDWAN',
    contentType: 'FAQ',
    content: 'Q: 当主控制器宕机时，业务会中断吗？\nA: 不会。系统支持毫秒级心跳检测，备机将自动承接控制平面流量。',
    tags: ['SD-WAN', '容灾', 'FAQ'],
    views: 890,
    likes: 42,
    updateTime: '2025-03-01'
  },
  {
    id: 'kb-4',
    title: '智算中心 GPU 资源调度政策',
    businessType: 'AIC',
    contentType: 'POLICY',
    content: '根据《算网一体化发展指南》，GPU 资源优先保障 A 类算力需求，并实施分时租赁阶梯计费。',
    tags: ['智算', '政策', '资源调度'],
    views: 560,
    likes: 12,
    updateTime: '2025-01-15'
  }
];
