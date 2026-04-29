import type { ManagedBusiness } from '../../../../mock/assistant';

export type BusinessQueryItem = {
  id: string;
  name: string;
  site: string;
  region: string;
  bandwidth: string;
  updatedAt: string;
  owner: string;
  details: Array<{ label: string; value: string }>;
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

