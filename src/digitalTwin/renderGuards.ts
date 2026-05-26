import type { SceneItem } from './layoutStore';

export function shouldRenderSceneItem(
  item: SceneItem,
  _baseMap?: string,
  selectedId?: string | null,
): boolean {
  if (item.hidden) return false;
  void selectedId;
  return true;
}
