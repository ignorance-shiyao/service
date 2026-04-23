import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KNOWLEDGE_ITEMS, KnowledgeItem } from '../mocks/knowledge';
import { FAQ_ITEMS, FaqItem } from '../mocks/faq';
import { REPORTS, ReportItem } from '../mocks/reports';
import { DIAGNOSIS_STEPS, DIAGNOSIS_TEMPLATES, DiagnosisTemplate } from '../mocks/diagnosis';
import { TICKETS, TicketItem } from '../mocks/tickets';
import { MANAGED_BUSINESSES, ManagedBusiness } from '../mocks/businesses';
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
};

export type AiConversationSessionMeta = {
  id: string;
  title: string;
  updatedAt: number;
  lastText: string;
  messageCount: number;
};

type PersistedAiDockSessions = {
  sessions: AiConversationSession[];
  activeSessionId: string;
};

const quickChips: QuickChip[] = [
  { id: 'chip_health', label: '业务体检', prompt: '帮我做一次业务体检' },
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
  return MANAGED_BUSINESSES.map((biz, idx) => {
    const count = 28 + idx * 9;
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

  const streamAssistantText = useCallback(async (text: string) => {
    const source = text.trim();
    if (!source) return;
    const messageId = appendMessage({
      role: 'assistant',
      kind: 'text',
      text: '▌',
    });
    await delay(180);

    let current = '';
    let index = 0;
    while (index < source.length) {
      const ch = source[index];
      const step = /[，。！？；,.!?：:\n]/.test(ch) ? 1 : Math.min(source.length - index, ch.charCodeAt(0) > 127 ? 1 : 2);
      current += source.slice(index, index + step);
      index += step;
      const hasMore = index < source.length;
      updateMessageText(messageId, hasMore ? `${current}▌` : current);
      const wait =
        /[，。！？；,.!?：:]/.test(ch)
          ? 145
          : ch === '\n'
            ? 180
            : current.length < 8
              ? 56
              : 42 + Math.floor(Math.random() * 24);
      await delay(wait);
    }
  }, [appendMessage, updateMessageText]);

  const appendCardWithThinking = useCallback(async (appendCard: () => void | Promise<void>, ms = 380) => {
    await delay(ms);
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
    await delay(380);
    const progressId = appendMessage({
      role: 'assistant',
      kind: 'diagnosisProgress',
      data: { title: template.title, progress: 0, step: DIAGNOSIS_STEPS[0], running: true },
    });

    for (let i = 0; i < DIAGNOSIS_STEPS.length; i += 1) {
      await delay(600);
      const progress = Math.round(((i + 1) / DIAGNOSIS_STEPS.length) * 100);
      updateMessageData(progressId, { progress, step: DIAGNOSIS_STEPS[i], running: progress < 100 });
    }

    await delay(350);
    appendMessage({ role: 'assistant', kind: 'diagnosisReport', data: template });
  }, [appendMessage, updateMessageData]);

  const runReportExport = useCallback(async (type: 'pdf' | 'image') => {
    const id = appendMessage({
      role: 'system',
      kind: 'systemNotice',
      data: { title: `正在生成${type === 'pdf' ? 'PDF' : '长图'}...`, progress: 30 },
    });
    await delay(450);
    updateMessageData(id, { progress: 60, title: `正在生成${type === 'pdf' ? 'PDF' : '长图'}...` });
    await delay(450);
    updateMessageData(id, { progress: 100, title: `已生成${type === 'pdf' ? 'PDF' : '长图'}，点击下载` });
  }, [appendMessage, updateMessageData]);

  const handleIntent = useCallback(async (inputRaw: string, intent?: IntentType) => {
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
        appendMessage({
          role: 'assistant',
          kind: 'faultForm',
          data: {
            defaultTitle: ticketDraftFromDiagnosis
              ? `${ticketDraftFromDiagnosis.name}异常报障`
              : '业务异常报障',
            defaultBusiness: ticketDraftFromDiagnosis?.name || '政企业务专网',
            fromDiagnosis: !!ticketDraftFromDiagnosis,
          },
        });
      }, 420);
      return;
    }

    if (resolvedIntent === 'diagnosis') {
      const matched = pickDiagnosis(input);
      if (!matched) {
        await appendCardWithThinking(() => {
          appendMessage({ role: 'assistant', kind: 'diagnosisSelect', data: DIAGNOSIS_TEMPLATES });
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
  }, [activeCustomer, activeReport, appendCardWithThinking, appendMessage, pushQa, runDiagnosisFlow, ticketDraftFromDiagnosis, tickets]);

  const sendUserText = useCallback(async (text: string, forcedIntent?: IntentType) => {
    const trimmed = text.trim();
    if (!trimmed || processingRef.current) return;

    processingRef.current = true;
    setIsResponding(true);

    updateActiveSession((session) => {
      const shouldRename = session.messages.length === 0 || session.title === '新会话' || session.title === '当前会话';
      return shouldRename
        ? { ...session, title: formatSessionTitle(trimmed), updatedAt: Date.now() }
        : session;
    });

    appendMessage({ role: 'user', kind: 'text', text: trimmed });
    await delay(280);
    await handleIntent(trimmed, forcedIntent);
    setIsResponding(false);
    processingRef.current = false;
  }, [appendMessage, handleIntent, updateActiveSession]);

  const handleQuickChip = useCallback(async (chip: QuickChip) => {
    await sendUserText(chip.prompt);
  }, [sendUserText]);

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
    }));

    await delay(350);
    appendMessage({
      role: 'system',
      kind: 'systemNotice',
      data: { title: `工单 ${id} 状态更新：已自动分派到二线团队`, progress: 100 },
    });
    setIsResponding(false);
  }, [appendMessage, updateActiveSession]);

  const setActiveReportId = useCallback((id: string) => {
    updateActiveSession((session) => ({ ...session, activeReportId: id, updatedAt: Date.now() }));
  }, [updateActiveSession]);

  const setTicketDraftFromDiagnosis = useCallback((diagnosis: DiagnosisTemplate | null) => {
    updateActiveSession((session) => ({ ...session, ticketDraftFromDiagnosis: diagnosis, updatedAt: Date.now() }));
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
      if (prev.length <= 1) {
        const keep = prev[0] || createSession('当前会话');
        return [{
          ...keep,
          title: '当前会话',
          updatedAt: Date.now(),
          messages: welcomeMessages(),
          tickets: TICKETS,
          activeReportId: REPORTS[0].id,
          ticketDraftFromDiagnosis: null,
        }];
      }
      const filtered = prev.filter((s) => s.id !== id);
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
    quickChips,
    handleQuickChip,
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
    setTicketDraftFromDiagnosis,
    submitFaultTicket,
    managedBusinesses: MANAGED_BUSINESSES,
    activeSessionId,
    sessionMetas,
    createConversation,
    switchConversation,
    deleteConversation,
  };
};

export type AiDockStore = ReturnType<typeof useAiDock>;
