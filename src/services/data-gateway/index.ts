import { AppBootstrapData, loadMockBootstrapData } from './mockDataSource';

export type DataSourceMode = 'mock' | 'api';

const DATA_SOURCE_MODE: DataSourceMode = 'mock';

export const loadBootstrapData = async (): Promise<AppBootstrapData> => {
  if (DATA_SOURCE_MODE === 'mock') {
    return loadMockBootstrapData();
  }

  throw new Error('API data source is not configured yet.');
};

