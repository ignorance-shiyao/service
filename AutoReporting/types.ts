
import { DiagnosticStatus } from '../FaultReporting/types';

export interface ReportMetric {
  name: string;
  value: string | number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changeRate: string;
  status: DiagnosticStatus;
}

export interface RegionalStat {
  region: string;
  score: number;
  status: 'excellent' | 'good' | 'warning';
}

export interface Recommendation {
  type: 'optimization' | 'risk' | 'maintenance';
  title: string;
  content: string;
}

export interface BusinessSummary {
  businessType: string;
  metrics: ReportMetric[];
}

export interface ReportItem {
  id: string;
  title: string;
  period: string;
  createTime: string;
  status: 'published' | 'generating';
  smsSent: boolean;
  overallScore: number;
  aiInterpretation: string;
  highlights: { label: string; value: string; unit: string; trend: 'up' | 'down' }[];
  recommendations: Recommendation[];
  regionalStats: RegionalStat[];
  data: BusinessSummary[];
}
