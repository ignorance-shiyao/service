import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KNOWLEDGE_ITEMS,
  KnowledgeItem,
  FAQ_ITEMS,
  FaqItem,
  REPORTS,
  ReportItem,
  DIAGNOSIS_STEPS,
  DIAGNOSIS_TEMPLATES,
  DiagnosisTemplate,
  TICKETS,
  TicketItem,
  MANAGED_BUSINESSES,
  ManagedBusiness,
} from '../../../../mock/assistant';
import { createId } from '../utils/id';
import { delay } from '../utils/delay';
import { detectIntent, IntentType } from './mockIntent';

export type MessageRole = 'assistant' | 'user' | 'system';
export type MessageKind =
  | 'text'
  | 'qa'
  | 'businessQuery'
  | 'knowledgeCard'
  | 'reportCard'
  | 'diagnosisSelect'
  | 'diagnosisProgress'
  | 'diagnosisReport'
  | 'businessDiagnosisSelect'
  | 'businessDiagnosisReport'
  | 'faultForm'
  | 'ticketCard'
  | 'systemNotice'
  | 'fallback';

export type QaPayload = {
  conclusion: string;
  explanation: string;
  suggestions?: string[];
  sourceId?: string;
  followups?: string[];
};

export type AiMessage = {
  id: string;
  role: MessageRole;
  kind: MessageKind;
  text?: string;
  createdAt: number;
  data?: any;
};

export type DrawerState =
  | { type: 'knowledge'; item: KnowledgeItem }
  | { type: 'reportHistory'; list: ReportItem[] }
  | { type: 'diagnosisHistory'; list: DiagnosisTemplate[] }
  | { type: 'ticket'; item: TicketItem }
  | null;

export type QuickChip = {
  id: string;
  label: string;
  prompt: string;
};

export type AiConversationSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  customer: CustomerContext;
  messages: AiMessage[];
  tickets: TicketItem[];
  activeReportId: string;
  ticketDraftFromDiagnosis: DiagnosisTemplate | null;
  faultContext: FaultContext | null;
};

export type AiConversationSessionMeta = {
  id: string;
  title: string;
  updatedAt: number;
  lastText: string;
  messageCount: number;
  customerName: string;
  snapshotTags: Array<{ label: string; tone: 'blue' | 'cyan' | 'indigo' | 'green' | 'amber' }>;
};

type PersistedAiDockSessions = {
  sessions: AiConversationSession[];
  activeSessionId: string;
};

const quickChips: QuickChip[] = [
  { id: 'chip_health', label: '业务诊断', prompt: '帮我做一次业务诊断' },
  { id: 'chip_business', label: '业务查询', prompt: '帮我查一下我名下都有哪些业务' },
  { id: 'chip_report', label: '运行月报', prompt: '生成本月运行报告' },
  { id: 'chip_knowledge', label: '知识库', prompt: '量子加密保护是什么' },
  { id: 'chip_ticket', label: '工单追踪', prompt: '查一下我最近的工单进度' },
  { id: 'chip_fault', label: '自助报障', prompt: '我要发起报障' },
  { id: 'chip_manager', label: '联系经理', prompt: '联系客户经理' },
];

const welcomeMessages = (): AiMessage[] => [];

const findFaq = (input: string): FaqItem | undefined =>
  FAQ_ITEMS.find((item) => input.includes(item.q.replace(/[？?]/g, '').toLowerCase()));

const matchKnowledge = (input: string): KnowledgeItem => {
  const hit = KNOWLEDGE_ITEMS.find(
    (k) => input.includes(k.title.toLowerCase()) || k.tags.some((tag) => input.includes(tag.toLowerCase()))
  );
  return hit || KNOWLEDGE_ITEMS[0];
};

const pickDiagnosis = (input: string): DiagnosisTemplate | undefined => {
  if (input.includes('专线')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'LINE');
  if (input.includes('5g')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === '5G');
  if (input.includes('idc')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'IDC');
  if (input.includes('sdwan') || input.includes('量子')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'SDWAN');
  if (input.includes('智算')) return DIAGNOSIS_TEMPLATES.find((i) => i.id === 'AIC');
  return undefined;
};

const STREAM_PACE = {
  initialDelay: 260,
  punctuationPause: 210,
  lineBreakPause: 260,
  introMin: 86,
  introSpan: 40,
  normalMin: 68,
  normalSpan: 52,
};

type BusinessQueryItem = {
  id: string;
  name: string;
  site: string;
  region: string;
  bandwidth: string;
  updatedAt: string;
  owner: string;
  details: Array<{ label: string; value: string }>;
};

type BusinessQueryCategory = {
  code: ManagedBusiness['code'];
  label: string;
  items: BusinessQueryItem[];
};

export type BusinessDiagnosisTarget = {
  code: ManagedBusiness['code'];
  label: string;
  item: BusinessQueryItem;
};

export type BusinessDiagnosisResult = {
  id: string;
  name: string;
  type: string;
  region: string;
  site: string;
  score: number;
  level: '健康' | '关注' | '异常';
  summary: string;
  metrics: Array<{ label: string; value: string; status: 'normal' | 'warning' | 'danger' }>;
  findings: string[];
  suggestions: string[];
};

export type BusinessDiagnosisReportPayload = {
  title: string;
  generatedAt: string;
  total: number;
  averageScore: number;
  summary: string;
  results: BusinessDiagnosisResult[];
  nextActions: string[];
};

export type FaultContext = {
  source: 'businessDiagnosis' | 'diagnosis' | 'manual';
  title: string;
  business: string;
  businessId?: string;
  businessType?: string;
  region?: string;
  site?: string;
  severity?: string;
  desc?: string;
};

type FlowStatus = 'running' | 'done' | 'stopped';
type FlowLogEntry = { time: string; text: string };

const nowFlowTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const appendFlowLog = (logs: FlowLogEntry[], text: string): FlowLogEntry[] => [
  ...logs,
  { time: nowFlowTime(), text },
];

const ANHUI_ADDRESS_POOL = [
  { region: '合肥市蜀山区', sites: ['望江西路创新产业园', '高新区习友路政企节点', '天鹅湖商务区汇聚点'] },
  { region: '合肥市包河区', sites: ['滨湖新区云谷路接入点', '徽州大道政企专线机房', '包河经开区园区网关'] },
  { region: '芜湖市镜湖区', sites: ['镜湖万达商务楼站点', '长江中路企业汇聚点', '赭山中路边缘节点'] },
  { region: '芜湖市弋江区', sites: ['高教园区接入站', '南瑞路智算接入点', '三山经开区专线点'] },
  { region: '蚌埠市蚌山区', sites: ['东海大道市区骨干点', '龙子湖科创园站点', '朝阳路企业接入站'] },
  { region: '蚌埠市禹会区', sites: ['涂山路业务汇聚点', '高新区工控专网点', '长青路园区边缘节点'] },
  { region: '淮南市田家庵区', sites: ['朝阳中路政企节点', '山南新区综合接入点', '淮河大道专线汇聚点'] },
  { region: '马鞍山市雨山区', sites: ['湖南路产业园接入站', '雨山经开区企业节点', '太白大道云专线点'] },
  { region: '铜陵市铜官区', sites: ['长江西路市区接入点', '铜官经开区边缘站', '翠湖商务区专线节点'] },
  { region: '安庆市迎江区', sites: ['菱湖南路政企汇聚点', '皖江大道园区接入站', '人民东路专线节点'] },
  { region: '安庆市宜秀区', sites: ['文苑路综合接入点', '安庆北部新城业务点', '大龙山产业园节点'] },
  { region: '黄山市屯溪区', sites: ['屯光大道政企站点', '新安北路综合接入点', '阳湖高新区汇聚点'] },
  { region: '阜阳市颍州区', sites: ['清河东路市区接入点', '颍州经开区企业节点', '阜南路专线边缘点'] },
  { region: '阜阳市颍泉区', sites: ['北京中路汇聚站', '泉河片区业务接入点', '工业园专线节点'] },
  { region: '宿州市埇桥区', sites: ['银河一路政企接入点', '宿州高新区边缘站', '汴河路综合汇聚点'] },
  { region: '滁州市琅琊区', sites: ['琅琊大道业务节点', '城南新区接入点', '滁州经开区园区网关'] },
  { region: '六安市金安区', sites: ['皖西大道综合接入点', '六安开发区企业节点', '梅山路专线汇聚站'] },
  { region: '宣城市宣州区', sites: ['鳌峰中路政企站点', '宛陵科创城接入点', '宣州经开区边缘站'] },
  { region: '池州市贵池区', sites: ['长江南路政企节点', '平天湖产业园接入站', '清风大道业务汇聚点'] },
  { region: '亳州市谯城区', sites: ['药都大道企业接入点', '古井产业园专线节点', '建安路综合汇聚点'] },
];

type CustomerContext = {
  name: string;
  code: string;
};

const CUSTOMER_POOL: CustomerContext[] = [
  { name: '安徽交控集团', code: 'CUST-AHJT-0001' },
  { name: '合肥工业大学', code: 'CUST-HFUT-0002' },
  { name: '奇瑞汽车股份', code: 'CUST-CHERY-0003' },
  { name: '科大讯飞股份', code: 'CUST-IFLYTEK-0004' },
  { name: '安徽电力公司', code: 'CUST-STATEGRID-0005' },
  { name: '中国声谷园区', code: 'CUST-SOUNDVALLEY-0006' },
  { name: '芜湖港航集团', code: 'CUST-WHPORT-0007' },
];

const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length];

const hashText = (text: string) => text.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

const randomCustomerContext = (seed?: number): CustomerContext => {
  const index = typeof seed === 'number' ? seed % CUSTOMER_POOL.length : Math.floor(Math.random() * CUSTOMER_POOL.length);
  return CUSTOMER_POOL[index];
};

const splitRegion = (region: string) => {
  const city = region.slice(0, region.indexOf('市') + 1) || '合肥市';
  const county = region.replace(city, '') || '蜀山区';
  return { province: '安徽省', city, county };
};

const buildLineDetails = (customer: CustomerContext, n: number, region: string, site: string, bandwidth: string) => {
  const { province, city, county } = splitRegion(region);
  const zAddr = ANHUI_ADDRESS_POOL[(n * 5 + 7) % ANHUI_ADDRESS_POOL.length];
  const z = splitRegion(zAddr.region);
  return [
    { label: '客户名称', value: customer.name },
    { label: '客户编码', value: customer.code },
    { label: '产品实例标识', value: `LINE-INS-${String(90000 + n).padStart(8, '0')}` },
    { label: '专线名称', value: `政企专线-${city}${String((n % 18) + 1).padStart(2, '0')}` },
    { label: '电路名称', value: `CIR-${city.replace('市', '')}-${String(3000 + n)}` },
    { label: '开通状态', value: n % 9 === 0 ? '开通中' : '已开通' },
    { label: '专线类型', value: n % 2 === 0 ? '以太网专线' : '互联网专线' },
    { label: 'A端接入方式', value: n % 3 === 0 ? '光纤直连' : 'OTN承载' },
    { label: 'Z端接入方式', value: n % 2 === 0 ? 'MSTP接入' : '光纤直连' },
    { label: 'A端省份', value: province },
    { label: 'A端地市', value: city },
    { label: 'A端区县', value: county },
    { label: 'A端业务安装地址', value: site },
    { label: 'Z端省份', value: z.province },
    { label: 'Z端地市', value: z.city },
    { label: 'Z端区县', value: z.county },
    { label: 'Z端业务安装地址', value: pick(zAddr.sites, n + 2) },
    { label: '业务范围', value: n % 2 === 0 ? '省内' : '跨市' },
    { label: '带宽', value: bandwidth },
  ];
};

const build5GDetails = (customer: CustomerContext, n: number, region: string, bandwidth: string) => {
  const { province } = splitRegion(region);
  const sliceTypes = ['URLLC', 'eMBB', 'mMTC', '行业定制切片'];
  const dnnTypes = ['企业专用DNN', '互联网DNN', '行业混合DNN'];
  const accessModes = ['5G SA接入', '5G NSA接入', '5G + 专线混合接入'];
  return [
    { label: '客户编号', value: customer.code },
    { label: '客户名称', value: customer.name },
    { label: '核心网子切片数', value: String((n % 4) + 1) },
    { label: '切片签约省份', value: province },
    { label: '专用切片数', value: String((n % 3) + 1) },
    { label: '切片类型', value: pick(sliceTypes, n) },
    { label: '切片创建时间', value: `2026-0${(n % 8) + 1}-${String((n % 27) + 1).padStart(2, '0')}` },
    { label: '专网模式', value: n % 2 === 0 ? '增强型专网' : '混合专网' },
    { label: '切片业务标识', value: `S-NSSAI-${String(100 + (n % 899))}` },
    { label: '业务保障等级', value: n % 3 === 0 ? '金牌' : n % 3 === 1 ? '银牌' : '标准' },
    { label: '传输网子切片数', value: String((n % 5) + 1) },
    { label: 'DNN名称', value: `dnn-ent-${String((n % 12) + 1).padStart(2, '0')}` },
    { label: 'DNN类型', value: pick(dnnTypes, n + 1) },
    { label: '客户端地址池列表', value: `10.${(n % 50) + 10}.0.0/20；10.${(n % 50) + 11}.0.0/20` },
    { label: '接入方式', value: `${pick(accessModes, n + 2)}（签约带宽 ${bandwidth}）` },
  ];
};

const buildIdcDetails = (n: number, region: string) => {
  const { province, city, county } = splitRegion(region);
  const roomStd = ['T3+', 'T3', 'T2'];
  const siteTypes = ['核心机房', '边缘机房', '汇聚机房'];
  const roomTypes = ['自建机房', '合作机房', '园区机房'];
  const vendors = ['华为', '中兴', '新华三', '锐捷'];
  return [
    { label: '编号', value: `IDC-${String(60000 + n).padStart(7, '0')}` },
    { label: '省份', value: province },
    { label: '地市', value: city },
    { label: '区县', value: county },
    { label: '机房标准化类型', value: pick(roomStd, n) },
    { label: '站址名称', value: `${city}${county}机房${String((n % 18) + 1).padStart(2, '0')}` },
    { label: '站址类型', value: pick(siteTypes, n + 1) },
    { label: '机房类型', value: pick(roomTypes, n + 2) },
    { label: '动环机房名称', value: `${city.replace('市', '')}-动环-${String((n % 24) + 1).padStart(2, '0')}` },
    { label: '系统名称', value: 'IDC动环监控系统' },
    { label: '设备类型', value: n % 2 === 0 ? '动力设备' : '环境设备' },
    { label: '设备子类型', value: n % 2 === 0 ? 'UPS配电' : '温湿度传感器' },
    { label: '设备厂家', value: pick(vendors, n + 3) },
    { label: '投入运行时间', value: `202${n % 5}-0${(n % 8) + 1}-${String((n % 27) + 1).padStart(2, '0')}` },
  ];
};

const buildSdwanDetails = (customer: CustomerContext, n: number, site: string, bandwidth: string) => {
  const linkTypes = ['互联网专线', 'MPLS专线', '5G备链', '双宽带'];
  const tunnelModes = ['IPSec Overlay', 'GRE over IPSec', 'VXLAN Overlay'];
  const slaProfiles = ['低时延优先', '高可靠优先', '成本优化'];
  return [
    { label: '客户名称', value: customer.name },
    { label: '客户编码', value: customer.code },
    { label: '业务实例ID', value: `SDW-INS-${String(100000 + n).padStart(8, '0')}` },
    { label: '组网模式', value: n % 2 === 0 ? 'Hub-Spoke' : 'Full-Mesh' },
    { label: 'Hub站点', value: `合肥主Hub-${String((n % 4) + 1).padStart(2, '0')}` },
    { label: 'Spoke站点', value: site },
    { label: 'CPE型号', value: n % 2 === 0 ? 'uCPE-X600' : 'vCPE-CloudEdge' },
    { label: 'CPE序列号', value: `CPE-${String(700000 + n)}` },
    { label: '接入链路类型', value: pick(linkTypes, n + 2) },
    { label: '主备链路带宽', value: `${bandwidth} / ${Math.max(20, Number.parseInt(bandwidth, 10) / 2)}Mbps` },
    { label: '隧道协议', value: pick(tunnelModes, n + 3) },
    { label: 'Overlay隧道数', value: String((n % 6) + 2) },
    { label: 'SLA策略模板', value: pick(slaProfiles, n + 4) },
    { label: '应用识别库版本', value: `APP-DB-2026.${(n % 12) + 1}` },
    { label: '策略发布时间', value: `2026-04-${String((n % 27) + 1).padStart(2, '0')} 0${n % 9}:30` },
  ];
};

const buildAicDetails = (customer: CustomerContext, n: number, region: string, bandwidth: string) => {
  const gpuModels = ['NVIDIA A800', 'NVIDIA H20', 'Ascend 910B'];
  const schedulers = ['队列优先', '公平调度', 'SLA保障调度'];
  const levels = ['白金', '金牌', '标准'];
  return [
    { label: '客户名称', value: customer.name },
    { label: '客户编码', value: customer.code },
    { label: '算力资源池', value: `安徽智算资源池-${(n % 3) + 1}` },
    { label: '资源节点ID', value: `AIC-NODE-${String(12000 + n)}` },
    { label: '机房位置', value: region },
    { label: 'GPU型号', value: pick(gpuModels, n) },
    { label: 'GPU卡数', value: String(((n % 8) + 1) * 4) },
    { label: 'CPU核数', value: String(((n % 6) + 2) * 32) },
    { label: '内存规格', value: `${((n % 8) + 4) * 128}GB` },
    { label: '高速存储', value: `${(n % 5) + 20}TB NVMe` },
    { label: '作业队列', value: `queue-${(n % 7) + 1}` },
    { label: '调度策略', value: pick(schedulers, n + 1) },
    { label: '网络带宽', value: `${bandwidth}（RoCEv2）` },
    { label: '服务等级', value: pick(levels, n + 2) },
    { label: '开通时间', value: `2026-0${(n % 8) + 1}-${String((n % 27) + 1).padStart(2, '0')}` },
  ];
};

const buildBusinessQueryData = (customer: CustomerContext): BusinessQueryCategory[] => {
  const codeLabel: Record<ManagedBusiness['code'], string> = {
    LINE: '政企专线',
    '5G': '5G专网',
    IDC: 'IDC动环',
    SDWAN: '量子+SD-WAN',
    AIC: '智算中心',
  };
  const seed = hashText(`${customer.name}-${customer.code}`);
  const selectedBusinesses = MANAGED_BUSINESSES.filter((_, idx) => ((seed + idx * 7) % 5 !== 0) || idx === 0);
  const finalBusinesses = selectedBusinesses.length >= 2 ? selectedBusinesses : MANAGED_BUSINESSES.slice(0, 3);

  return finalBusinesses.map((biz, idx) => {
    const base = biz.code === 'LINE' ? 18 : biz.code === '5G' ? 10 : biz.code === 'IDC' ? 6 : biz.code === 'SDWAN' ? 8 : 4;
    const variance = (seed + idx * 13) % (biz.code === 'LINE' ? 34 : biz.code === '5G' ? 24 : biz.code === 'IDC' ? 18 : 20);
    const count = Math.max(3, base + variance);
    const items: BusinessQueryItem[] = Array.from({ length: count }).map((_, i) => {
      const n = i + 1;
      const addr = ANHUI_ADDRESS_POOL[(idx * 7 + n * 3) % ANHUI_ADDRESS_POOL.length];
      const site = addr.sites[(n + idx) % addr.sites.length];
      const city = splitRegion(addr.region).city.replace('市', '');
      const lineNameTemplates = [
        `${customer.name}${city}总部-容灾中心专线`,
        `${customer.name}${city}生产网双链路专线`,
        `${customer.name}${city}分支园区互联专线`,
        `${customer.name}${city}视频监控回传专线`,
        `${customer.name}${city}ERP核心系统专线`,
      ];
      const g5NameTemplates = [
        `${customer.name}${city}园区设备专网切片`,
        `${customer.name}${city}移动执法专网切片`,
        `${customer.name}${city}车联网业务专网`,
        `${customer.name}${city}应急指挥5G专网`,
        `${customer.name}${city}工业质检5G专网`,
      ];
      const idcNameTemplates = [
        `${customer.name}${city}主数据中心动环监控`,
        `${customer.name}${city}容灾机房动力保障`,
        `${customer.name}${city}核心机房环境监测`,
        `${customer.name}${city}边缘机房能耗管理`,
        `${customer.name}${city}算力机房动环联控`,
      ];
      const sdwanNameTemplates = [
        `${customer.name}${city}总部-分支智能组网`,
        `${customer.name}${city}多活业务SD-WAN互联`,
        `${customer.name}${city}门店网络云化组网`,
        `${customer.name}${city}跨园区应用加速组网`,
        `${customer.name}${city}双链路容灾SD-WAN`,
      ];
      const aicNameTemplates = [
        `${customer.name}${city}视觉识别训练算力服务`,
        `${customer.name}${city}智能客服推理算力服务`,
        `${customer.name}${city}风控模型训练算力资源`,
        `${customer.name}${city}数字孪生渲染算力服务`,
        `${customer.name}${city}大模型微调算力服务`,
      ];
      const serviceName =
        biz.code === 'LINE'
          ? pick(lineNameTemplates, n + idx)
          : biz.code === '5G'
            ? pick(g5NameTemplates, n + idx)
            : biz.code === 'IDC'
              ? pick(idcNameTemplates, n + idx)
              : biz.code === 'SDWAN'
                ? pick(sdwanNameTemplates, n + idx)
                : pick(aicNameTemplates, n + idx);
      return {
        id: `${biz.code}-${String(n).padStart(4, '0')}`,
        name: `${serviceName}-${String((n % 32) + 1).padStart(2, '0')}`,
        site,
        region: addr.region,
        bandwidth: `${50 + (n % 10) * 10}Mbps`,
        updatedAt: `2026-04-${String((n % 27) + 1).padStart(2, '0')} 10:${String((n * 3) % 60).padStart(2, '0')}`,
        owner: `运维员${(n % 6) + 1}`,
        details:
          biz.code === 'LINE'
            ? buildLineDetails(customer, n, addr.region, site, `${50 + (n % 10) * 10}Mbps`)
            : biz.code === '5G'
              ? build5GDetails(customer, n, addr.region, `${50 + (n % 10) * 10}Mbps`)
              : biz.code === 'IDC'
                ? buildIdcDetails(n, addr.region)
                : biz.code === 'SDWAN'
                  ? buildSdwanDetails(customer, n, site, `${50 + (n % 10) * 10}Mbps`)
                  : buildAicDetails(customer, n, addr.region, `${50 + (n % 10) * 10}Mbps`),
      };
    });
    return { code: biz.code, label: codeLabel[biz.code], items };
  });
};

const buildBusinessDiagnosisReport = (targets: BusinessDiagnosisTarget[]): BusinessDiagnosisReportPayload => {
  const results: BusinessDiagnosisResult[] = targets.map((target, index) => {
    const seed = target.item.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + index * 7;
    const score = Math.max(68, Math.min(98, 96 - (seed % 27)));
    const level: BusinessDiagnosisResult['level'] = score >= 88 ? '健康' : score >= 78 ? '关注' : '异常';
    const latency = 8 + (seed % 34);
    const loss = Number(((seed % 48) / 100).toFixed(2));
    const availability = Number((99.96 - (seed % 42) / 100).toFixed(2));
    const riskText =
      level === '健康'
        ? '核心指标稳定，当前未发现明显风险。'
        : level === '关注'
          ? '存在轻微波动，建议纳入重点观察。'
          : '存在质量异常，需要尽快排查处理。';

    return {
      id: target.item.id,
      name: target.item.name,
      type: target.label,
      region: target.item.region,
      site: target.item.site,
      score,
      level,
      summary: `${target.label}「${target.item.name}」诊断完成，${riskText}`,
      metrics: [
        { label: '可用率', value: `${availability}%`, status: availability >= 99.7 ? 'normal' : availability >= 99.4 ? 'warning' : 'danger' },
        { label: '时延', value: `${latency}ms`, status: latency <= 22 ? 'normal' : latency <= 32 ? 'warning' : 'danger' },
        { label: '丢包', value: `${loss}%`, status: loss <= 0.18 ? 'normal' : loss <= 0.35 ? 'warning' : 'danger' },
        { label: '健康评分', value: `${score}`, status: level === '健康' ? 'normal' : level === '关注' ? 'warning' : 'danger' },
      ],
      findings: [
        level === '健康' ? '近24小时关键指标处于稳定区间' : '近24小时存在指标波动，峰值集中在业务高峰时段',
        `${target.item.region} 接入侧链路质量${level === '异常' ? '低于基线' : '符合当前业务基线'}`,
        `业务安装点「${target.item.site}」最近一次资料更新时间为 ${target.item.updatedAt}`,
      ],
      suggestions: [
        level === '异常' ? '建议立即发起报障并关联本次诊断结果' : '建议保持当前巡检策略并持续观察趋势',
        level === '健康' ? '可纳入低频巡检清单' : '建议提高该业务未来7天巡检频次',
        '如需进一步定位，可继续发起单业务深度诊断',
      ],
    };
  });

  const averageScore = Math.round(results.reduce((sum, item) => sum + item.score, 0) / Math.max(1, results.length));
  const abnormalCount = results.filter((item) => item.level === '异常').length;
  const warningCount = results.filter((item) => item.level === '关注').length;
  const typeSummary = Array.from(new Set(results.map((item) => item.type))).join('、') || '业务';

  return {
    title: '业务诊断报告',
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    total: results.length,
    averageScore,
    summary: `本次共诊断 ${results.length} 条业务，覆盖 ${typeSummary}。平均健康评分 ${averageScore} 分，${abnormalCount} 条异常，${warningCount} 条需要关注。`,
    results,
    nextActions: [
      abnormalCount > 0 ? '优先处理异常业务，建议直接发起报障并附带诊断结果。' : '当前未发现严重异常，可保持日常巡检节奏。',
      warningCount > 0 ? '对关注业务设置未来7天重点观察，跟踪时延、丢包和可用率变化。' : '关注业务数量较少，可按现有服务等级继续运营。',
      '如客户需要汇报材料，可基于本次诊断结果继续生成运行说明。',
    ],
  };
};

const createSession = (title?: string): AiConversationSession => {
  const now = Date.now();
  return {
    id: createId('session'),
    title: title || '新会话',
    createdAt: now,
    updatedAt: now,
    customer: randomCustomerContext(now),
    messages: welcomeMessages(),
    tickets: TICKETS,
    activeReportId: REPORTS[0].id,
    ticketDraftFromDiagnosis: null,
    faultContext: null,
  };
};

const extractMessagePreview = (message: AiMessage | undefined): string => {
  if (!message) return '暂无消息';
  if (message.text) return message.text;
  if (message.kind === 'qa' && message.data?.conclusion) return String(message.data.conclusion);
  if (message.kind === 'systemNotice' && message.data?.title) return String(message.data.title);
  if (message.kind === 'knowledgeCard' && message.data?.title) return `知识：${String(message.data.title)}`;
  if (message.kind === 'reportCard') return '运行报告';
  if (message.kind === 'businessQuery') return '业务查询结果';
  if (message.kind === 'ticketCard' && message.data?.title) return `工单：${String(message.data.title)}`;
  if (message.kind === 'faultForm') return '发起自助报障';
  return '会话消息';
};

const formatSessionTitle = (input: string): string => {
  const t = input.replace(/\s+/g, ' ').trim();
  if (!t) return '新会话';
  return t.length > 14 ? `${t.slice(0, 14)}…` : t;
};

const buildSessionSnapshotTags = (messages: AiMessage[]): Array<{ label: string; tone: 'blue' | 'cyan' | 'indigo' | 'green' | 'amber' }> => {
  const tags: Array<{ label: string; tone: 'blue' | 'cyan' | 'indigo' | 'green' | 'amber' }> = [];
  const seen = new Set<string>();
  const recent = [...messages].reverse();

  const pushTag = (key: string, label: string, tone: 'blue' | 'cyan' | 'indigo' | 'green' | 'amber') => {
    if (seen.has(key) || tags.length >= 3) return;
    seen.add(key);
    tags.push({ label, tone });
  };

  for (const message of recent) {
    if (tags.length >= 3) break;
    if (message.kind === 'diagnosisReport') {
      const score = typeof message.data?.score === 'number' ? ` ${message.data.score}分` : '';
      pushTag('diagnosis', `诊断完成${score}`, 'cyan');
      continue;
    }
    if (message.kind === 'businessDiagnosisReport') {
      const score = typeof message.data?.averageScore === 'number' ? ` ${message.data.averageScore}分` : '';
      pushTag('health_check', `诊断完成${score}`, 'cyan');
      continue;
    }
    if (message.kind === 'businessDiagnosisSelect') {
      pushTag('health_select', '业务诊断', 'cyan');
      continue;
    }
    if (message.kind === 'reportCard') {
      pushTag('report', '运行报告', 'blue');
      continue;
    }
    if (message.kind === 'businessQuery') {
      pushTag('business', '业务清单', 'indigo');
      continue;
    }
    if (message.kind === 'ticketCard') {
      const status = typeof message.data?.status === 'string' ? ` ${message.data.status}` : '';
      pushTag('ticket', `工单${status}`, 'amber');
      continue;
    }
    if (message.kind === 'faultForm') {
      pushTag('fault', '报障处理中', 'amber');
      continue;
    }
    if (message.kind === 'systemNotice' && message.data) {
      const title = String(message.data.title || '');
      const done = message.data.status === 'done';
      if (title.includes('工单')) {
        pushTag('ticket_flow', done ? '工单流转完成' : '工单流转中', done ? 'green' : 'blue');
        continue;
      }
      if (title.includes('生成') || title.includes('导出')) {
        pushTag('export', done ? '导出完成' : '导出处理中', done ? 'green' : 'blue');
        continue;
      }
    }
    if (message.kind === 'qa' || message.kind === 'knowledgeCard') {
      pushTag('knowledge', '知识问答', 'indigo');
    }
  }

  if (tags.length === 0 && messages.length > 0) {
    pushTag('chat', '常规会话', 'blue');
  }
  return tags;
};

const AI_DOCK_SESSION_STORAGE_KEY = 'ai_dock_sessions_json_v1';

const toValidSession = (value: any): AiConversationSession | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return null;
  if (!Array.isArray(value.messages) || !Array.isArray(value.tickets)) return null;
  const activeReportId = typeof value.activeReportId === 'string' ? value.activeReportId : REPORTS[0].id;
  const customer = value.customer && typeof value.customer.name === 'string' && typeof value.customer.code === 'string'
    ? (value.customer as CustomerContext)
    : randomCustomerContext(typeof value.createdAt === 'number' ? value.createdAt : Date.now());
  return {
    id: value.id,
    title: value.title || '新会话',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
    customer,
    messages: value.messages as AiMessage[],
    tickets: value.tickets as TicketItem[],
    activeReportId,
    ticketDraftFromDiagnosis: (value.ticketDraftFromDiagnosis as DiagnosisTemplate | null) || null,
    faultContext: (value.faultContext as FaultContext | null) || null,
  };
};

const getDefaultPersistedState = (): PersistedAiDockSessions => {
  const first = createSession('当前会话');
  return { sessions: [first], activeSessionId: first.id };
};

const loadPersistedSessions = (): PersistedAiDockSessions => {
  if (typeof window === 'undefined') return getDefaultPersistedState();
  try {
    const raw = window.localStorage.getItem(AI_DOCK_SESSION_STORAGE_KEY);
    if (!raw) return getDefaultPersistedState();
    const parsed = JSON.parse(raw) as PersistedAiDockSessions;
    if (!parsed || !Array.isArray(parsed.sessions)) return getDefaultPersistedState();
    const sessions = parsed.sessions.map(toValidSession).filter(Boolean) as AiConversationSession[];
    if (sessions.length === 0) return getDefaultPersistedState();
    const activeSessionId = sessions.some((s) => s.id === parsed.activeSessionId)
      ? parsed.activeSessionId
      : sessions[0].id;
    return { sessions, activeSessionId };
  } catch (_error) {
    return getDefaultPersistedState();
  }
};

export const useAiDock = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 480, height: 720 });
  const [initialPersisted] = useState<PersistedAiDockSessions>(() => loadPersistedSessions());
  const [sessions, setSessions] = useState<AiConversationSession[]>(() => initialPersisted.sessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => initialPersisted.activeSessionId);
  const [isResponding, setIsResponding] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const processingRef = useRef(false);
  const stopRespondingRef = useRef(false);

  useEffect(() => {
    if (sessions.length === 0) {
      const next = createSession('当前会话');
      setSessions([next]);
      setActiveSessionId(next.id);
      return;
    }
    if (!sessions.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    if (typeof window === 'undefined' || sessions.length === 0) return;
    const payload: PersistedAiDockSessions = {
      sessions,
      activeSessionId,
    };
    window.localStorage.setItem(AI_DOCK_SESSION_STORAGE_KEY, JSON.stringify(payload));
  }, [activeSessionId, sessions]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0],
    [activeSessionId, sessions]
  );

  const messages = activeSession?.messages || [];
  const tickets = activeSession?.tickets || TICKETS;
  const activeReportId = activeSession?.activeReportId || REPORTS[0].id;
  const ticketDraftFromDiagnosis = activeSession?.ticketDraftFromDiagnosis || null;
  const faultContext = activeSession?.faultContext || null;
  const activeCustomer = activeSession?.customer || CUSTOMER_POOL[0];

  const activeReport = useMemo(
    () => REPORTS.find((r) => r.id === activeReportId) || REPORTS[0],
    [activeReportId]
  );

  const updateActiveSession = useCallback((updater: (session: AiConversationSession) => AiConversationSession) => {
    setSessions((prev) => prev.map((session) => (session.id === activeSessionId ? updater(session) : session)));
  }, [activeSessionId]);

  const appendMessage = useCallback((msg: Omit<AiMessage, 'id' | 'createdAt'> & Partial<Pick<AiMessage, 'id' | 'createdAt'>>) => {
    const next: AiMessage = {
      id: msg.id || createId('msg'),
      createdAt: msg.createdAt || Date.now(),
      role: msg.role,
      kind: msg.kind,
      text: msg.text,
      data: msg.data,
    };

    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: [...session.messages, next],
    }));

    if (!open || minimized) setUnread((u) => u + 1);
    return next.id;
  }, [minimized, open, updateActiveSession]);

  const updateMessageData = useCallback((id: string, data: any) => {
    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: session.messages.map((m) => (m.id === id ? { ...m, data: { ...m.data, ...data } } : m)),
    }));
  }, [updateActiveSession]);

  const updateMessageText = useCallback((id: string, text: string) => {
    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: session.messages.map((m) => (m.id === id ? { ...m, text } : m)),
    }));
  }, [updateActiveSession]);

  const createSystemNoticeFlow = useCallback((title: string, firstLog: string, progress = 0) => {
    const logs = appendFlowLog([], firstLog);
    const id = appendMessage({
      role: 'system',
      kind: 'systemNotice',
      data: {
        title,
        progress,
        status: 'running' as FlowStatus,
        logs,
      },
    });
    return { id, logs };
  }, [appendMessage]);

  const advanceSystemNoticeFlow = useCallback(
    (
      id: string,
      payload: {
        logs: FlowLogEntry[];
        logText?: string;
        title?: string;
        progress: number;
        status?: FlowStatus;
      }
    ) => {
      const logs = payload.logText ? appendFlowLog(payload.logs, payload.logText) : payload.logs;
      updateMessageData(id, {
        title: payload.title,
        progress: payload.progress,
        status: payload.status || (payload.progress >= 100 ? 'done' : 'running'),
        logs,
      });
      return logs;
    },
    [updateMessageData]
  );

  const streamAssistantText = useCallback(async (text: string) => {
    const source = text.trim();
    if (!source) return;
    const messageId = appendMessage({
      role: 'assistant',
      kind: 'text',
      text: '▌',
    });
    await delay(STREAM_PACE.initialDelay);

    let current = '';
    let index = 0;
    while (index < source.length) {
      if (stopRespondingRef.current) {
        updateMessageText(messageId, current || '已停止本次回复。');
        return;
      }
      const ch = source[index];
      const step = /[，。！？；,.!?：:\n]/.test(ch) ? 1 : Math.min(source.length - index, ch.charCodeAt(0) > 127 ? 1 : 2);
      current += source.slice(index, index + step);
      index += step;
      const hasMore = index < source.length;
      updateMessageText(messageId, hasMore ? `${current}▌` : current);
      const wait =
        /[，。！？；,.!?：:]/.test(ch)
          ? STREAM_PACE.punctuationPause
          : ch === '\n'
            ? STREAM_PACE.lineBreakPause
            : current.length < 8
              ? STREAM_PACE.introMin + Math.floor(Math.random() * STREAM_PACE.introSpan)
              : STREAM_PACE.normalMin + Math.floor(Math.random() * STREAM_PACE.normalSpan);
      await delay(wait);
    }
  }, [appendMessage, updateMessageText]);

  const appendCardWithThinking = useCallback(async (appendCard: () => void | Promise<void>, ms = 760) => {
    if (stopRespondingRef.current) return;
    const jitter = Math.floor(Math.random() * 520);
    await delay(ms + jitter);
    if (stopRespondingRef.current) return;
    await appendCard();
  }, []);

  const openWindow = useCallback(() => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  }, []);

  const closeWindow = useCallback(() => {
    setOpen(false);
    setDrawer(null);
  }, []);

  const minimizeWindow = useCallback(() => {
    setMinimized(true);
  }, []);

  const restoreWindow = useCallback(() => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  }, []);

  const clearConversation = useCallback(() => {
    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      messages: welcomeMessages(),
      tickets: TICKETS,
      activeReportId: REPORTS[0].id,
      ticketDraftFromDiagnosis: null,
      faultContext: null,
    }));
    setDrawer(null);
    setIsResponding(false);
  }, [updateActiveSession]);

  const pushQa = useCallback((faq: FaqItem) => {
    appendMessage({
      role: 'assistant',
      kind: 'qa',
      data: {
        conclusion: faq.conclusion,
        explanation: faq.explanation,
        suggestions: faq.suggestions || [],
        sourceId: faq.sourceId,
        followups: faq.followups || [],
      } as QaPayload,
    });
  }, [appendMessage]);

  const runDiagnosisFlow = useCallback(async (template: DiagnosisTemplate) => {
    let logs: FlowLogEntry[] = appendFlowLog([], `已启动「${template.name}」诊断任务`);

    await delay(380);
    if (stopRespondingRef.current) return;
    const progressId = appendMessage({
      role: 'assistant',
      kind: 'diagnosisProgress',
      data: {
        title: template.title,
        progress: 0,
        step: DIAGNOSIS_STEPS[0],
        running: true,
        status: 'running',
        logs,
      },
    });

    for (let i = 0; i < DIAGNOSIS_STEPS.length; i += 1) {
      if (stopRespondingRef.current) {
        logs = appendFlowLog(logs, '用户已停止本次诊断任务');
        updateMessageData(progressId, {
          running: false,
          status: 'stopped',
          step: '已停止',
          logs,
          progress: Math.max(0, DIAGNOSIS_STEPS.length ? Math.floor((i / DIAGNOSIS_STEPS.length) * 100) : 0),
        });
        return;
      }
      await delay(600);
      const progress = Math.round(((i + 1) / DIAGNOSIS_STEPS.length) * 100);
      logs = appendFlowLog(logs, `${DIAGNOSIS_STEPS[i]}完成`);
      updateMessageData(progressId, {
        progress,
        step: DIAGNOSIS_STEPS[i],
        running: progress < 100,
        status: progress < 100 ? 'running' : 'done',
        logs,
      });
    }

    await delay(350);
    if (stopRespondingRef.current) return;
    logs = appendFlowLog(logs, '诊断完成，已生成最终报告');
    updateMessageData(progressId, {
      running: false,
      status: 'done',
      step: '分析完成',
      progress: 100,
      logs,
    });
    appendMessage({ role: 'assistant', kind: 'diagnosisReport', data: template });
  }, [appendMessage, updateMessageData]);

  const runBusinessDiagnosisFlow = useCallback(async (targets: BusinessDiagnosisTarget[]) => {
    if (targets.length === 0) return;
    const selectedText = targets.length > 6
      ? `${targets.slice(0, 6).map((target) => target.item.name).join('、')} 等 ${targets.length} 条业务`
      : targets.map((target) => target.item.name).join('、');
    let logs: FlowLogEntry[] = appendFlowLog([], `已接收业务诊断任务：${selectedText}`);

    await delay(260);
    const progressId = appendMessage({
      role: 'assistant',
      kind: 'diagnosisProgress',
      data: {
        title: '业务诊断执行中',
        progress: 0,
        step: '准备采集所选业务指标',
        running: true,
        status: 'running',
        logs,
      },
    });

    const steps = [
      '采集业务运行指标',
      '关联站点、链路和资源信息',
      '计算健康评分与风险等级',
      '生成诊断摘要、详情和后续建议',
    ];
    for (let i = 0; i < steps.length; i += 1) {
      await delay(520);
      const progress = Math.round(((i + 1) / steps.length) * 100);
      logs = appendFlowLog(logs, `${steps[i]}完成`);
      updateMessageData(progressId, {
        progress,
        step: steps[i],
        running: progress < 100,
        status: progress < 100 ? 'running' : 'done',
        logs,
      });
    }

    await delay(320);
    const report = buildBusinessDiagnosisReport(targets);
    appendMessage({ role: 'assistant', kind: 'businessDiagnosisReport', data: report });
  }, [appendMessage, updateMessageData]);

  const runReportExport = useCallback(async (type: 'pdf' | 'image') => {
    const docName = type === 'pdf' ? 'PDF' : '长图';
    const { id, logs: initialLogs } = createSystemNoticeFlow(`正在生成${docName}...`, `开始生成${docName}文件`, 20);
    let logs = initialLogs;
    await delay(420);
    logs = advanceSystemNoticeFlow(id, {
      logs,
      logText: '已完成图表渲染与数据聚合',
      progress: 55,
      title: `正在生成${docName}...`,
    });
    await delay(420);
    logs = advanceSystemNoticeFlow(id, {
      logs,
      logText: '已完成模板排版与导出封装',
      progress: 85,
      title: `正在生成${docName}...`,
    });
    await delay(360);
    advanceSystemNoticeFlow(id, {
      logs,
      logText: `${docName}已生成，可执行下载`,
      progress: 100,
      status: 'done',
      title: `已生成${docName}，点击下载`,
    });
  }, [advanceSystemNoticeFlow, createSystemNoticeFlow]);

  const handleIntent = useCallback(async (inputRaw: string, intent?: IntentType) => {
    if (stopRespondingRef.current) return;
    const input = inputRaw.toLowerCase();
    const intentFromModel = intent || detectIntent(input);
    const shouldForceBusiness =
      input.includes('业务') &&
      (input.includes('查询') ||
        input.includes('列表') ||
        input.includes('清单') ||
        input.includes('有哪些') ||
        input.includes('有什么') ||
        input.includes('名下') ||
        input.includes('查一下') ||
        input.includes('查'));
    const resolvedIntent = shouldForceBusiness ? 'business' : intentFromModel;

    if (input.includes('联系客户经理') || input.includes('客户经理')) {
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: { title: '已通知客户经理，预计 5 分钟内与您联系。', progress: 100 },
      });
      await streamAssistantText('我已把当前会话上下文同步给客户经理，您也可以继续描述问题细节。');
      return;
    }

    if (input.includes('反馈') || input.includes('意见') || input.includes('建议')) {
      appendMessage({
        role: 'system',
        kind: 'systemNotice',
        data: { title: '反馈已记录，产品团队将在 1 个工作日内回访。', progress: 100 },
      });
      await streamAssistantText('感谢反馈，若您愿意我可以继续引导您描述复现步骤。');
      return;
    }

    if (resolvedIntent === 'report') {
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'reportCard', data: activeReport });
      });
      return;
    }

    if (resolvedIntent === 'business') {
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'businessQuery',
          data: buildBusinessQueryData(activeCustomer),
        });
      }, 460);
      return;
    }

    if (resolvedIntent === 'ticket') {
      await appendCardWithThinking(() => {
        appendMessage({ role: 'assistant', kind: 'ticketCard', data: tickets[0] || TICKETS[0] });
      }, 420);
      return;
    }

    if (resolvedIntent === 'fault') {
      await appendCardWithThinking(() => {
        const businessOptions = buildBusinessQueryData(activeCustomer)
          .flatMap((category) => category.items.slice(0, 10).map((item) => ({
            id: item.id,
            label: `${category.label}｜${item.name}`,
            value: item.name,
            type: category.label,
            region: item.region,
            site: item.site,
          })));
        appendMessage({
          role: 'assistant',
          kind: 'faultForm',
          data: {
            defaultTitle: faultContext?.title || (ticketDraftFromDiagnosis ? `${ticketDraftFromDiagnosis.name}异常报障` : '业务异常报障'),
            defaultBusiness: faultContext?.business || ticketDraftFromDiagnosis?.name || businessOptions[0]?.value || '政企业务专网',
            defaultDesc: faultContext?.desc || '',
            defaultSeverity: faultContext?.severity || '中',
            context: faultContext,
            businessOptions,
            fromDiagnosis: !!ticketDraftFromDiagnosis || !!faultContext,
          },
        });
      }, 420);
      return;
    }

    if (resolvedIntent === 'diagnosis') {
      const matched = pickDiagnosis(input);
      if (!matched) {
        await appendCardWithThinking(() => {
          appendMessage({
            role: 'assistant',
            kind: 'businessDiagnosisSelect',
            data: buildBusinessQueryData(activeCustomer),
          });
        }, 360);
      } else {
        await runDiagnosisFlow(matched);
      }
      return;
    }

    const faq = findFaq(input);
    if (faq) {
      await appendCardWithThinking(() => {
        pushQa(faq);
      }, 360);
      return;
    }

    if (resolvedIntent === 'knowledge') {
      const knowledge = matchKnowledge(input);
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: {
            conclusion: `已为您定位到知识条目：《${knowledge.title}》`,
            explanation: '您可以先看摘要，若需完整内容可打开右侧知识详情。',
            sourceId: knowledge.id,
            followups: ['给我看完整内容', '还有相关知识吗？', '能生成一份说明吗？'],
          } as QaPayload,
        });
      }, 360);
      return;
    }

    if (resolvedIntent === 'qa') {
      await appendCardWithThinking(() => {
        appendMessage({
          role: 'assistant',
          kind: 'qa',
          data: {
            conclusion: '当前业务整体健康，重点风险集中在5G和智算高峰时段。',
            explanation: '建议优先关注5G接入波动和智算排队时延，已可直接发起诊断。',
            suggestions: ['发起5G诊断', '查看本月运行报告'],
            followups: ['本周告警趋势如何？', '有待处理工单吗？', '给我一个优化建议'],
          } as QaPayload,
        });
      }, 360);
      return;
    }

    await appendCardWithThinking(() => {
      appendMessage({
        role: 'assistant',
        kind: 'fallback',
        data: {
          title: '暂时没找到准确答案',
          desc: '可以换个关键词，或直接联系客户经理协助处理。',
        },
      });
    }, 360);
  }, [activeCustomer, activeReport, appendCardWithThinking, appendMessage, faultContext, pushQa, runDiagnosisFlow, ticketDraftFromDiagnosis, tickets]);

  const sendUserText = useCallback(async (text: string, forcedIntent?: IntentType) => {
    const trimmed = text.trim();
    if (!trimmed || processingRef.current) return;

    stopRespondingRef.current = false;
    processingRef.current = true;
    setIsResponding(true);

    updateActiveSession((session) => {
      const shouldRename = session.messages.length === 0 || session.title === '新会话' || session.title === '当前会话';
      return shouldRename
        ? { ...session, title: formatSessionTitle(trimmed), updatedAt: Date.now() }
        : session;
    });

    appendMessage({ role: 'user', kind: 'text', text: trimmed });
    try {
      await delay(280);
      if (stopRespondingRef.current) return;
      await handleIntent(trimmed, forcedIntent);
    } finally {
      setIsResponding(false);
      processingRef.current = false;
      stopRespondingRef.current = false;
    }
  }, [appendMessage, handleIntent, updateActiveSession]);

  const stopResponding = useCallback(() => {
    if (!processingRef.current) return;
    stopRespondingRef.current = true;
    processingRef.current = false;
    setIsResponding(false);
  }, []);

  const handleQuickChip = useCallback(async (chip: QuickChip) => {
    await sendUserText(chip.prompt);
  }, [sendUserText]);

  const retryLastQuestion = useCallback(async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user' && typeof m.text === 'string' && m.text.trim());
    if (!lastUser?.text) return;
    await sendUserText(lastUser.text);
  }, [messages, sendUserText]);

  const openKnowledgeDrawer = useCallback((id: string) => {
    const item = KNOWLEDGE_ITEMS.find((k) => k.id === id);
    if (item) setDrawer({ type: 'knowledge', item });
  }, []);

  const openReportHistory = useCallback(() => {
    setDrawer({ type: 'reportHistory', list: REPORTS });
  }, []);

  const openDiagnosisHistory = useCallback(() => {
    setDrawer({ type: 'diagnosisHistory', list: DIAGNOSIS_TEMPLATES });
  }, []);

  const openTicketDetail = useCallback((id: string) => {
    const item = tickets.find((t) => t.id === id);
    if (item) setDrawer({ type: 'ticket', item });
  }, [tickets]);

  const submitFaultTicket = useCallback(async (payload: { title: string; business: string; desc: string; severity: string }) => {
    setIsResponding(true);
    const id = `TKT-${Date.now()}`;
    const ticket: TicketItem = {
      id,
      title: payload.title,
      business: payload.business,
      status: '待受理',
      owner: '自动分派中',
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      detail: payload.desc,
      timeline: [
        { time: '刚刚', text: '工单已提交，等待运维人员受理。' },
      ],
    };

    await delay(420);
    appendMessage({ role: 'assistant', kind: 'ticketCard', data: ticket });

    updateActiveSession((session) => ({
      ...session,
      updatedAt: Date.now(),
      tickets: [ticket, ...session.tickets],
      ticketDraftFromDiagnosis: null,
      faultContext: null,
    }));

    const { id: noticeId, logs: initialLogs } = createSystemNoticeFlow(`工单 ${id} 状态流转中`, `工单 ${id} 已创建，等待系统分派`, 25);
    let logs = initialLogs;
    await delay(360);
    logs = advanceSystemNoticeFlow(noticeId, {
      logs,
      logText: '工单已自动分派到二线团队',
      progress: 60,
      title: `工单 ${id} 状态流转中`,
    });
    await delay(420);
    logs = advanceSystemNoticeFlow(noticeId, {
      logs,
      logText: '责任人已确认受理，进入处理中',
      progress: 85,
      title: `工单 ${id} 状态流转中`,
    });
    await delay(360);
    advanceSystemNoticeFlow(noticeId, {
      logs,
      logText: '状态已更新为处理中，可在工单详情追踪进展',
      progress: 100,
      status: 'done',
      title: `工单 ${id} 状态更新：处理中`,
    });
    setIsResponding(false);
  }, [advanceSystemNoticeFlow, appendMessage, createSystemNoticeFlow, updateActiveSession]);

  const setActiveReportId = useCallback((id: string) => {
    updateActiveSession((session) => ({ ...session, activeReportId: id, updatedAt: Date.now() }));
  }, [updateActiveSession]);

  const setTicketDraftFromDiagnosis = useCallback((diagnosis: DiagnosisTemplate | null) => {
    updateActiveSession((session) => ({ ...session, ticketDraftFromDiagnosis: diagnosis, updatedAt: Date.now() }));
  }, [updateActiveSession]);

  const setFaultContext = useCallback((context: FaultContext | null) => {
    updateActiveSession((session) => ({ ...session, faultContext: context, updatedAt: Date.now() }));
  }, [updateActiveSession]);

  const createConversation = useCallback(() => {
    const next = createSession();
    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(next.id);
    setDrawer(null);
    setIsResponding(false);
  }, []);

  const switchConversation = useCallback((id: string) => {
    if (id === activeSessionId) return;
    setActiveSessionId(id);
    setDrawer(null);
    setIsResponding(false);
  }, [activeSessionId]);

  const deleteConversation = useCallback((id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const next = createSession('当前会话');
        setActiveSessionId(next.id);
        return [next];
      }
      if (!filtered.some((s) => s.id === activeSessionId)) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
    setDrawer(null);
  }, [activeSessionId]);

  const deleteConversations = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    if (!idSet.size) return;
    setSessions((prev) => {
      const filtered = prev.filter((s) => !idSet.has(s.id));
      if (filtered.length === 0) {
        const next = createSession('当前会话');
        setActiveSessionId(next.id);
        return [next];
      }
      if (!filtered.some((s) => s.id === activeSessionId)) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
    setDrawer(null);
  }, [activeSessionId]);

  const sessionMetas = useMemo<AiConversationSessionMeta[]>(() => {
    return [...sessions]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((session) => {
        const last = session.messages[session.messages.length - 1];
        return {
          id: session.id,
          title: session.title,
          updatedAt: session.updatedAt,
          lastText: extractMessagePreview(last),
          messageCount: session.messages.length,
          customerName: session.customer.name,
          snapshotTags: buildSessionSnapshotTags(session.messages),
        };
      });
  }, [sessions]);

  return {
    open,
    minimized,
    unread,
    position,
    windowSize,
    setWindowSize,
    setPosition,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    clearConversation,
    messages,
    isResponding,
    sendUserText,
    stopResponding,
    quickChips,
    handleQuickChip,
    retryLastQuestion,
    drawer,
    setDrawer,
    openKnowledgeDrawer,
    openReportHistory,
    openDiagnosisHistory,
    openTicketDetail,
    activeReport,
    setActiveReportId,
    runReportExport,
    runDiagnosisFlow,
    runBusinessDiagnosisFlow,
    setTicketDraftFromDiagnosis,
    setFaultContext,
    submitFaultTicket,
    managedBusinesses: MANAGED_BUSINESSES,
    activeSessionId,
    sessionMetas,
    createConversation,
    switchConversation,
    deleteConversation,
    deleteConversations,
  };
};

export type AiDockStore = ReturnType<typeof useAiDock>;
