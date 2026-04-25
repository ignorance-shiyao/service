import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadBootstrapData, saveBootstrapData } from '../services/data-gateway';
import { AppBootstrapData } from '../services/data-gateway/mockDataSource';

type AppDataContextType = AppBootstrapData & {
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateBusinessTypes: (value: AppBootstrapData['businessTypes']) => void;
  updateComponents: (value: AppBootstrapData['components']) => void;
  updateTemplates: (value: AppBootstrapData['templates']) => void;
  updateDomains: (value: AppBootstrapData['domains']) => void;
  updateDepts: (value: AppBootstrapData['depts']) => void;
  updateMenus: (value: AppBootstrapData['menus']) => void;
  updateRoles: (value: AppBootstrapData['roles']) => void;
  updateUsers: (value: AppBootstrapData['users']) => void;
  updatePosts: (value: AppBootstrapData['posts']) => void;
  updateDictTypes: (value: AppBootstrapData['dictTypes']) => void;
  updateDictData: (value: AppBootstrapData['dictData']) => void;
  updateLogs: (value: AppBootstrapData['logs']) => void;
  updateDemoOrders: (value: AppBootstrapData['demoOrders']) => void;
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
  updateBusinessTypes: () => {},
  updateComponents: () => {},
  updateTemplates: () => {},
  updateDomains: () => {},
  updateDepts: () => {},
  updateMenus: () => {},
  updateRoles: () => {},
  updateUsers: () => {},
  updatePosts: () => {},
  updateDictTypes: () => {},
  updateDictData: () => {},
  updateLogs: () => {},
  updateDemoOrders: () => {},
});

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppBootstrapData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSnapshotRef = useRef<AppBootstrapData | null>(null);

  const persistData = useCallback(async (next: AppBootstrapData) => {
    try {
      await saveBootstrapData(next);
    } catch (error) {
      console.warn('Persist bootstrap data failed:', error);
    }
  }, []);

  const schedulePersist = useCallback(
    (next: AppBootstrapData) => {
      pendingSnapshotRef.current = next;
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = setTimeout(() => {
        const snapshot = pendingSnapshotRef.current;
        if (snapshot) {
          void persistData(snapshot);
          pendingSnapshotRef.current = null;
        }
        persistTimerRef.current = null;
      }, 250);
    },
    [persistData]
  );

  const updateSlice = useCallback(
    <K extends keyof AppBootstrapData>(key: K, value: AppBootstrapData[K]) => {
      setData((prev) => {
        const next = { ...prev, [key]: value };
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist]
  );

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

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
      if (pendingSnapshotRef.current) {
        void persistData(pendingSnapshotRef.current);
      }
    };
  }, [persistData]);

  const value = useMemo(
    () => ({
      ...data,
      isLoading,
      refresh,
      updateBusinessTypes: (value) => updateSlice('businessTypes', value),
      updateComponents: (value) => updateSlice('components', value),
      updateTemplates: (value) => updateSlice('templates', value),
      updateDomains: (value) => updateSlice('domains', value),
      updateDepts: (value) => updateSlice('depts', value),
      updateMenus: (value) => updateSlice('menus', value),
      updateRoles: (value) => updateSlice('roles', value),
      updateUsers: (value) => updateSlice('users', value),
      updatePosts: (value) => updateSlice('posts', value),
      updateDictTypes: (value) => updateSlice('dictTypes', value),
      updateDictData: (value) => updateSlice('dictData', value),
      updateLogs: (value) => updateSlice('logs', value),
      updateDemoOrders: (value) => updateSlice('demoOrders', value),
    }),
    [data, isLoading, refresh, updateSlice]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => useContext(AppDataContext);
