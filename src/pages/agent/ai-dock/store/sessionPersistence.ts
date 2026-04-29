export type PersistedState<TSession> = {
  sessions: TSession[];
  activeSessionId: string;
};

export const getPersistedStamp = <TSession extends { updatedAt?: number; createdAt?: number; messages?: unknown[] }>(
  value: PersistedState<TSession>
): number => {
  const latestSessionAt = value.sessions.reduce(
    (max, item) => Math.max(max, item.updatedAt || item.createdAt || 0),
    0
  );
  const messageCount = value.sessions.reduce((sum, item) => sum + (Array.isArray(item.messages) ? item.messages.length : 0), 0);
  return latestSessionAt * 1000 + messageCount;
};

export const readLocalPersisted = <TSession>(
  storageKey: string,
  parse: (raw: unknown) => PersistedState<TSession> | null,
  fallback: () => PersistedState<TSession>
): PersistedState<TSession> => {
  if (typeof window === 'undefined') return fallback();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback();
    const normalized = parse(JSON.parse(raw));
    return normalized || fallback();
  } catch (_error) {
    return fallback();
  }
};

export const readRemotePersisted = async <TSession>(
  endpoint: string,
  parse: (raw: unknown) => PersistedState<TSession> | null
): Promise<PersistedState<TSession> | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) return null;
    const parsed = await response.json();
    return parse(parsed);
  } catch (_error) {
    return null;
  }
};

export const writeLocalPersisted = <TSession>(storageKey: string, payload: PersistedState<TSession>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
};

export const writeRemotePersisted = async <TSession>(endpoint: string, payload: PersistedState<TSession>): Promise<void> => {
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Persist ai-dock sessions failed: ${response.status}`);
  }
};

