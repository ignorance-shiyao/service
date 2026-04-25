import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadBootstrapData } from '../services/data-gateway';
import { AppBootstrapData } from '../services/data-gateway/mockDataSource';

type AppDataContextType = AppBootstrapData & {
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const EMPTY_DATA: AppBootstrapData = {
  businessTypes: [],
  components: [],
  customers: [],
  templates: [],
  regions: [],
  domains: [],
  depts: [],
  menus: [],
  roles: [],
  users: [],
  posts: [],
  dictTypes: [],
  dictData: [],
  logs: [],
  demoOrders: [],
};

const AppDataContext = createContext<AppDataContextType>({
  ...EMPTY_DATA,
  isLoading: true,
  refresh: async () => {},
});

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppBootstrapData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await loadBootstrapData();
      setData(loaded);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...data,
      isLoading,
      refresh,
    }),
    [data, isLoading, refresh]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => useContext(AppDataContext);

