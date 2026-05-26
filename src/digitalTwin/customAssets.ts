export interface CustomAsset {
  key: `custom:${string}`;
  name: string;
  group: string;
  src: string;
  filename: string;
  w: number;
  h: number;
}

const KEY = 'dt-custom-assets';

export function loadCustomAssets(): CustomAsset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomAssets(list: CustomAsset[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function addCustomAsset(asset: CustomAsset) {
  const list = loadCustomAssets().filter(item => item.key !== asset.key);
  list.push(asset);
  saveCustomAssets(list);
}

export function removeCustomAsset(key: string) {
  const next = loadCustomAssets().filter(item => item.key !== key);
  saveCustomAssets(next);
}

export function customAssetKey(filename: string): `custom:${string}` {
  const base = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^A-Za-z0-9_\-一-龥]/g, '_');
  return `custom:${base}`;
}
