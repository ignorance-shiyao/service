
export type AssetType = 'LINE' | '5G' | 'IDC' | 'SDWAN';
export type DiagnosticStatus = 'normal' | 'minor' | 'major' | 'warning' | 'fault' | 'scanning';

export interface DiagnosticMetric {
  name: string;
  value: string | number;
  unit: string;
  status: DiagnosticStatus;
}

export interface AssetDiagnostic {
  id: string;
  name: string;
  type: AssetType;
  uuid: string;
  metrics: DiagnosticMetric[];
  overallStatus: DiagnosticStatus;
  suggestion?: string;
}
