
export enum UserType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CROSS_DOMAIN_USER = 'CROSS_DOMAIN_USER',
  DOMAIN_USER = 'DOMAIN_USER'
}

export type DomainMode = 'fusion' | 'switching';

export interface Customer {
  id: string;
  name: string;
  code: string;
  businessTypes: string[]; // Added: Customer's subscribed business types
}

export interface Domain {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  manager: string;
  businessTypes: string[];
  status: 'active' | 'inactive';
  createTime: string;
  children?: Domain[];
  customerIds?: string[];
  managementMode: DomainMode; // Updated: 'fusion' or 'switching'
  isSuper?: boolean; // New: Identifies the system default super domain
  description?: string; // New
  updateTime?: string; // New
  creator?: string; // New
  updater?: string; // New
}

export interface Menu {
  id: string;
  name: string;
  type: 'dir' | 'menu' | 'button';
  parentId: string | null;
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  sort: number;
  visible: boolean;
  children?: Menu[];
  description?: string; // New
  createTime?: string; // New
  updateTime?: string; // New
  creator?: string; // New
  updater?: string; // New
}

export interface Department {
  id: string;
  name: string;
  parentId: string | null;
  domainId: string; // Added: Link to Domain
  leader: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  sort: number;
  createTime: string;
  children?: Department[];
  updateTime?: string; // New
  creator?: string; // New
  updater?: string; // New
}

export interface Role {
  id: string;
  name: string;
  code: string;
  domainId: string;
  description: string;
  menuIds?: string[]; // Added: Persist menu selections
  regionScope?: string[]; // e.g., ['0551', '0553']
  bizCategoryScope?: string[];
  bizInstanceScope?: string[];
}

export interface UserRoleRelation {
  roleId: string;
  targetDomainId: string;
  roleName?: string; // Optional for UI convenience
}

export interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email: string;
  status: 'active' | 'locked';
  baseDomainId: string;
  deptId?: string; // Added: Link to Department
  createTime: string;
  roles: UserRoleRelation[]; // Support cross-domain roles
  updateTime?: string; // New
  creator?: string; // New
  updater?: string; // New
}

export interface BusinessInstance {
  id: string;
  name: string;
  categoryCode: string; // e.g., 'BIZ_LINE'
}

export interface Post {
  id: string;
  code: string;
  name: string;
  sort: number;
  status: 'active' | 'inactive';
  createTime: string;
  remark?: string;
}

export interface DictType {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  createTime: string;
  remark?: string;
}

export interface DictData {
  id: string;
  dictType: string;
  label: string;
  value: string;
  sort: number;
  status: 'active' | 'inactive';
  classType?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  isDefault?: boolean;
}

export interface OperLog {
  id: string;
  title: string;
  businessType: number; // 0=other, 1=add, 2=update, 3=delete
  operName: string;
  operIp: string;
  operUrl: string;
  method: string;
  status: 'success' | 'fail';
  errorMsg?: string;
  operTime: string;
  costTime: number;
}

// UI Types
export interface NavItem {
  id: string;
  title: string;
  icon: any;
  children?: NavItem[];
}