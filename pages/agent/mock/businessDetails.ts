import { BizType } from '../types/business';

export interface BizDetailData {
  id: BizType;
  title: string;
  banner: string;
  metrics: { label: string; value: string; hint?: string }[];
  trendTitle: string;
  trendSeries: { day: string; value: number }[];
  events: string[];
}

export const BIZ_DETAILS: Record<BizType, BizDetailData> = {
  xianlu: {
    id: 'xianlu',
    title: '专线详情（合肥总部）',
    banner: '合肥总部至阜阳分支出现连接异常，建议立即体检。',
    metrics: [
      { label: '节点连通', value: '合肥 ↔ 阜阳 异常' },
      { label: '带宽使用率', value: '92%' },
      { label: '本月中断次数', value: '2 次' },
      { label: '响应速度', value: '一般', hint: '根据过去 15 分钟业务请求响应情况计算。' }
    ],
    trendTitle: '近 7 天可用性趋势',
    trendSeries: [
      { day: '周一', value: 99.9 },
      { day: '周二', value: 99.8 },
      { day: '周三', value: 99.6 },
      { day: '周四', value: 99.9 },
      { day: '周五', value: 98.9 },
      { day: '周六', value: 99.7 },
      { day: '周日', value: 99.8 }
    ],
    events: ['04-21 10:38 阜阳侧接入设备告警', '04-18 15:12 光路瞬断自动恢复']
  },
  fiveG: {
    id: 'fiveG',
    title: '5G 专网详情（合肥高新区）',
    banner: '园区网络整体平稳，关键生产终端在线率高。',
    metrics: [
      { label: '覆盖区域', value: '合肥高新区工厂 / 芜湖制造园区' },
      { label: '在线终端数', value: '188 台' },
      { label: '本月流量', value: '12.8 TB' },
      { label: '异常终端', value: '3 台' }
    ],
    trendTitle: '近 7 天终端在线率',
    trendSeries: [
      { day: '周一', value: 97 },
      { day: '周二', value: 98 },
      { day: '周三', value: 98 },
      { day: '周四', value: 99 },
      { day: '周五', value: 97 },
      { day: '周六', value: 96 },
      { day: '周日', value: 98 }
    ],
    events: ['04-20 11:10 芜湖园区终端重连完成', '04-17 08:23 合肥园区巡检通过']
  },
  idc: {
    id: 'idc',
    title: 'IDC 动环详情（合肥滨湖机房）',
    banner: '机房湿度偏高，建议值守人员确认空调回风。',
    metrics: [
      { label: '机房温度', value: '23°C' },
      { label: '机房湿度', value: '69%' },
      { label: '供电状态', value: '正常' },
      { label: '门禁状态', value: '正常' }
    ],
    trendTitle: '近 7 天湿度趋势',
    trendSeries: [
      { day: '周一', value: 58 },
      { day: '周二', value: 60 },
      { day: '周三', value: 61 },
      { day: '周四', value: 62 },
      { day: '周五', value: 66 },
      { day: '周六', value: 68 },
      { day: '周日', value: 69 }
    ],
    events: ['04-21 09:40 湿度预警触发', '04-16 14:12 备用电源月检完成']
  },
  quantum: {
    id: 'quantum',
    title: '量子+SD-WAN 详情（安徽 16 地市）',
    banner: '分支机构连接稳定，量子加密保护持续有效。',
    metrics: [
      { label: '分支覆盖', value: '16 地市分支' },
      { label: '分支机构连接状态', value: '16/16 在线' },
      { label: '量子加密保护', value: '开启' },
      { label: '异常分支', value: '0 个' }
    ],
    trendTitle: '近 7 天分支在线趋势',
    trendSeries: [
      { day: '周一', value: 16 },
      { day: '周二', value: 16 },
      { day: '周三', value: 15 },
      { day: '周四', value: 16 },
      { day: '周五', value: 16 },
      { day: '周六', value: 16 },
      { day: '周日', value: 16 }
    ],
    events: ['04-19 22:03 安庆分支短时抖动已恢复', '04-14 17:30 合肥总行策略同步成功']
  },
  zhisuan: {
    id: 'zhisuan',
    title: '智算详情（合肥人工智能计算中心）',
    banner: '任务排队可控，建议关注高峰时段任务编排。',
    metrics: [
      { label: '算力使用率', value: '64%' },
      { label: '任务排队数', value: '4' },
      { label: '本月费用', value: '¥ 38.6 万' },
      { label: '高优先任务', value: '2 个' }
    ],
    trendTitle: '近 7 天算力使用率趋势',
    trendSeries: [
      { day: '周一', value: 51 },
      { day: '周二', value: 56 },
      { day: '周三', value: 63 },
      { day: '周四', value: 66 },
      { day: '周五', value: 72 },
      { day: '周六', value: 61 },
      { day: '周日', value: 64 }
    ],
    events: ['04-21 10:11 大模型训练任务入队', '04-18 21:04 批处理任务完成']
  }
};
