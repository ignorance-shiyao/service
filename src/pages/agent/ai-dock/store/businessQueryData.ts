import type { ManagedBusiness } from '../../../../mock/assistant';
import { MANAGED_BUSINESSES } from '../../../../mock/assistant';
import type { BusinessQueryItem } from './aiDockTypes';

export type CustomerContext = {
  name: string;
  code: string;
};

export type BusinessQueryCategory = {
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

const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length];
const hashText = (text: string) => text.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

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

export const buildBusinessQueryData = (customer: CustomerContext): BusinessQueryCategory[] => {
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

