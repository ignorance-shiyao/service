import { BizCard, CustomerProfile } from '../types/business';

export const CUSTOMERS: CustomerProfile[] = [
  { id: 'cust-hf-group', name: '合肥 XX 集团', industry: '制造业' },
  { id: 'cust-ah-bank', name: '安徽 XX 银行', industry: '金融' },
  { id: 'cust-hf-hospital', name: '合肥 XX 医院', industry: '医疗' }
];

export const BUSINESS_CARDS_NORMAL: BizCard[] = [
  { id: 'xianlu', name: '专线', countLabel: '6 条', status: 'normal', summary: '合肥总部至阜阳/芜湖/蚌埠等分支连接稳定', metricLabel: '响应速度', metricValue: '优秀' },
  { id: 'fiveG', name: '5G 专网', countLabel: '2 张', status: 'normal', summary: '合肥高新区工厂与芜湖制造园区在线', metricLabel: '在线终端', metricValue: '188 台' },
  { id: 'idc', name: 'IDC 动环', countLabel: '3 个', status: 'normal', summary: '合肥滨湖机房和高新机房运行平稳', metricLabel: '机房温度', metricValue: '23°C' },
  { id: 'quantum', name: '量子+SD-WAN', countLabel: '1 套', status: 'normal', summary: '覆盖安徽 16 地市分支连接状态稳定', metricLabel: '量子加密保护', metricValue: '已开启' },
  { id: 'zhisuan', name: '智算', countLabel: '2 中心', status: 'normal', summary: '合肥人工智能计算中心任务调度顺畅', metricLabel: '算力使用率', metricValue: '64%' }
];

export const BUSINESS_CARDS_ALERT: BizCard[] = [
  { id: 'xianlu', name: '专线', countLabel: '6 条', status: 'fault', summary: '合肥总部到阜阳分支链路中断', metricLabel: '影响业务', metricValue: 'ERP/OA/视频会议' },
  { id: 'fiveG', name: '5G 专网', countLabel: '2 张', status: 'normal', summary: '重点园区运行正常', metricLabel: '在线终端', metricValue: '179 台' },
  { id: 'idc', name: 'IDC 动环', countLabel: '3 个', status: 'warning', summary: '合肥滨湖机房湿度偏高需关注', metricLabel: '机房湿度', metricValue: '69%' },
  { id: 'quantum', name: '量子+SD-WAN', countLabel: '1 套', status: 'normal', summary: '量子加密保护稳定可用', metricLabel: '分支连接状态', metricValue: '16/16 在线' },
  { id: 'zhisuan', name: '智算', countLabel: '2 中心', status: 'normal', summary: '算力池运行平稳', metricLabel: '任务排队数', metricValue: '4' }
];

export const DIAGNOSIS_TEMPLATE = {
  summary: '合肥总部到阜阳专线当前中断，已持续 12 分钟。',
  impact: ['阜阳分公司 78 名员工', '受影响业务：ERP、OA、视频会议、文件共享', '严重程度：高'],
  reasons: ['阜阳侧接入设备告警（可能性 70%）', '光缆中段异常（可能性 25%）', '配置变更影响（可能性 5%）']
};
