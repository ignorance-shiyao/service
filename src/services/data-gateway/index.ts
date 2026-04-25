import { AppBootstrapData, loadMockBootstrapData } from './mockDataSource';

const BOOTSTRAP_ENDPOINT = '/mock-api/bootstrap';
const LOCAL_STORAGE_KEY = 'app_bootstrap_data_backup';

const readFromLocalStorage = (): AppBootstrapData | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppBootstrapData) : null;
  } catch {
    return null;
  }
};

const writeToLocalStorage = (data: AppBootstrapData) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / unavailable storage
  }
};

const normalizeBootstrapData = (partial: Partial<AppBootstrapData>, fallback: AppBootstrapData): AppBootstrapData => ({
  ...fallback,
  ...partial,
});

export const loadBootstrapData = async (): Promise<AppBootstrapData> => {
  const fallback = await loadMockBootstrapData();

  try {
    const response = await fetch(BOOTSTRAP_ENDPOINT, { cache: 'no-store' });
    if (response.ok) {
      const data = normalizeBootstrapData((await response.json()) as Partial<AppBootstrapData>, fallback);
      writeToLocalStorage(data);
      return data;
    }
  } catch {
    // fallback below
  }

  const cached = readFromLocalStorage();
  if (cached) {
    return normalizeBootstrapData(cached, fallback);
  }

  writeToLocalStorage(fallback);
  try {
    await saveBootstrapData(fallback);
  } catch {
    // ignore fs persistence failure and keep local fallback
  }
  return fallback;
};

export const saveBootstrapData = async (data: AppBootstrapData): Promise<void> => {
  writeToLocalStorage(data);

  const response = await fetch(BOOTSTRAP_ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Persist failed: ${response.status}`);
  }
};
