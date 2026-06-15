import type { MotionPoint, SceneItem } from './layoutStore';

export const ROBOT_MOTION_DURATION = 12000;

export const DEFAULT_ROBOT_MOTION_PATH: MotionPoint[] = [
  { x: 0, y: 0 },
  { x: 7.2, y: -3.8 },
  { x: 13.2, y: 1.2 },
  { x: 8.2, y: 7.2 },
  { x: -4.8, y: 3.6 },
  { x: 0, y: 0 },
];

export function isMotionRobotItem(item: SceneItem): boolean {
  if (!item.motion) return false;
  if (item.motion.enabled === false) return false;
  if (item.motion.enabled === true) return true;
  return Array.isArray(item.motion.path) && item.motion.path.length > 1;
}

function getPointOnPath(path: MotionPoint[], time: number, duration = ROBOT_MOTION_DURATION, loop = true): MotionPoint {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];

  const segmentCount = loop ? path.length : path.length - 1;
  const lengths = Array.from({ length: segmentCount }, (_, i) => {
    const from = path[i];
    const to = path[(i + 1) % path.length];
    return Math.hypot(to.x - from.x, to.y - from.y);
  });
  const total = lengths.reduce((sum, len) => sum + len, 0);
  if (total === 0) return path[0];
  if (duration <= 0) return path[0];
  const elapsed = duration > 0 ? (loop ? (time % duration) : Math.min(time, duration)) : 0;
  let distance = (elapsed / duration) * total;
  if (!loop) distance = Math.min(distance, total);

  for (let i = 0; i < lengths.length; i += 1) {
    if (distance <= lengths[i]) {
      const from = path[i];
      const to = path[(i + 1) % path.length];
      const t = lengths[i] === 0 ? 0 : distance / lengths[i];
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      };
    }
    distance -= lengths[i];
  }

  return path[path.length - 1];
}

function getActiveMotionPath(item: SceneItem): MotionPoint[] {
  if (Array.isArray(item.motion?.path) && item.motion!.path!.length > 1) {
    return item.motion!.path!;
  }
  return DEFAULT_ROBOT_MOTION_PATH;
}

function getActiveMotionDuration(item: SceneItem): number {
  return Number.isFinite(item.motion?.duration as number) && Number(item.motion?.duration) > 0
    ? Number(item.motion!.duration)
    : ROBOT_MOTION_DURATION;
}

function getActiveMotionLoop(item: SceneItem): boolean {
  return item.motion?.loop ?? true;
}

function hasMotionPoint(item: SceneItem): boolean {
  return isMotionRobotItem(item);
}

export function getRobotMotionPoint(item: SceneItem, time: number): MotionPoint {
  if (!hasMotionPoint(item)) {
    return { x: item.cx, y: item.cy };
  }
  const point = getPointOnPath(getActiveMotionPath(item), time, getActiveMotionDuration(item), getActiveMotionLoop(item));
  return {
    x: item.cx + point.x,
    y: item.cy + point.y,
  };
}

export function getRobotTrackPoints(item: SceneItem): string {
  if (!hasMotionPoint(item)) return '';
  return getActiveMotionPath(item)
    .map(point => `${item.cx + point.x},${item.cy + point.y}`)
    .join(' ');
}

export function getRobotMotionOffset(time: number, duration = ROBOT_MOTION_DURATION): MotionPoint {
  return getPointOnPath(DEFAULT_ROBOT_MOTION_PATH, time, duration, true);
}
