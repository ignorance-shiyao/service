export type ManagedBusiness = {
  id: string;
  code: 'LINE' | '5G' | 'IDC' | 'SDWAN' | 'AIC';
  name: string;
  onlineRate: number;
  latency: number;
  loss: number;
  status: 'normal' | 'warning' | 'danger';
};

export const MANAGED_BUSINESSES: ManagedBusiness[] = [
  { id: 'b1', code: 'LINE', name: '政企专线', onlineRate: 99.92, latency: 12, loss: 0.18, status: 'normal' },
  { id: 'b2', code: '5G', name: '5G专网', onlineRate: 99.76, latency: 22, loss: 0.22, status: 'warning' },
  { id: 'b3', code: 'IDC', name: 'IDC动环', onlineRate: 99.6, latency: 9, loss: 0.1, status: 'normal' },
  { id: 'b4', code: 'SDWAN', name: '量子+SD-WAN', onlineRate: 99.81, latency: 15, loss: 0.14, status: 'normal' },
  { id: 'b5', code: 'AIC', name: '智算中心', onlineRate: 99.62, latency: 31, loss: 0.24, status: 'warning' },
];
