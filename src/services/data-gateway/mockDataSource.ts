import {
  BUSINESS_TYPES,
  MOCK_COMPONENTS,
  MOCK_CUSTOMERS,
  MOCK_TEMPLATES,
  REGIONS,
  MOCK_DOMAINS,
  MOCK_DEPTS,
  MOCK_MENUS,
  MOCK_ROLES,
  MOCK_USERS,
  MOCK_POSTS,
  MOCK_DICT_TYPES,
  MOCK_DICT_DATA,
  MOCK_LOGS,
} from '../../mock';
import {
  Customer,
  Department,
  DictData,
  DictType,
  Domain,
  Menu,
  OperLog,
  Post,
  Role,
  User,
} from '../../types';

export type BusinessTypeOption = { code: string; name: string };
export type RegionOption = { code: string; name: string };

export type DemoOrder = {
  id: string;
  customer: string;
  product: string;
  amount: string;
  domainId: string;
  domainName: string;
  status: 'normal' | 'warning';
};

export type AppBootstrapData = {
  businessTypes: BusinessTypeOption[];
  components: Array<{ id: string; name: string; category: string; type: string; status?: string }>;
  customers: Customer[];
  templates: Array<{ id: string; customerId: string; name: string; status: string; lastUpdate: string; businessTypes: string[] }>;
  regions: RegionOption[];
  domains: Domain[];
  depts: Department[];
  menus: Menu[];
  roles: Role[];
  users: User[];
  posts: Post[];
  dictTypes: DictType[];
  dictData: DictData[];
  logs: OperLog[];
  demoOrders: DemoOrder[];
};

const MOCK_DEMO_ORDERS: DemoOrder[] = [
  { id: 'ORD-001', customer: '安徽省电力公司', product: '互联网专线 100M', amount: '¥50,000', domainId: '5', domainName: '合肥分公司', status: 'normal' },
  { id: 'ORD-002', customer: '江淮汽车集团', product: '5G 切片服务', amount: '¥120,000', domainId: '5', domainName: '合肥分公司', status: 'normal' },
  { id: 'ORD-003', customer: '马钢集团', product: 'IDC 机柜托管', amount: '¥80,000', domainId: '6', domainName: '马鞍山分公司', status: 'warning' },
  { id: 'ORD-004', customer: '马钢集团', product: '5G 智慧工厂工业控制', amount: '¥580,000', domainId: '6', domainName: '马鞍山分公司', status: 'normal' },
  { id: 'ORD-005', customer: '科大讯飞', product: 'AI 算力包', amount: '¥200,000', domainId: '5', domainName: '合肥分公司', status: 'normal' },
  { id: 'ORD-006', customer: '马钢集团', product: '企业上云服务', amount: '¥45,000', domainId: '6', domainName: '马鞍山分公司', status: 'normal' },
];

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const loadMockBootstrapData = async (): Promise<AppBootstrapData> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return deepClone({
    businessTypes: BUSINESS_TYPES,
    components: MOCK_COMPONENTS,
    customers: MOCK_CUSTOMERS,
    templates: MOCK_TEMPLATES,
    regions: REGIONS,
    domains: MOCK_DOMAINS,
    depts: MOCK_DEPTS,
    menus: MOCK_MENUS,
    roles: MOCK_ROLES,
    users: MOCK_USERS,
    posts: MOCK_POSTS,
    dictTypes: MOCK_DICT_TYPES,
    dictData: MOCK_DICT_DATA,
    logs: MOCK_LOGS,
    demoOrders: MOCK_DEMO_ORDERS,
  });
};
