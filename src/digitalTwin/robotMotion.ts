import type { SceneItem } from './layoutStore';

type MotionPoint = { x: number; y: number };

export const ROBOT_MOTION_DURATION = 12000;

export const ROBOT_MOTION_PATH: MotionPoint[] = [
  { x: 0, y: 0 },
  { x: 7.2, y: -3.8 },
  { x: 13.2, y: 1.2 },
  { x: 8.2, y: 7.2 },
  { x: -4.8, y: 3.6 },
  { x: 0, y: 0 },
];

export function isMotionRobotItem(item: SceneItem): boolean {
  const text = `${item.id}${item.asset}${item.label ?? ''}`;
  return /机器人|机械臂|Robot|robot|Arm|arm/.test(text);
}

export function getRobotMotionOffset(time: number, duration = ROBOT_MOTION_DURATION): MotionPoint {
  const lengths = ROBOT_MOTION_PATH.slice(1).map((p, i) => {
    const prev = ROBOT_MOTION_PATH[i];
    return Math.hypot(p.x - prev.x, p.y - prev.y);
  });
  const total = lengths.reduce((sum, len) => sum + len, 0);
  let distance = ((time % duration) / duration) * total;

  for (let i = 0; i < lengths.length; i += 1) {
    if (distance <= lengths[i]) {
      const from = ROBOT_MOTION_PATH[i];
      const to = ROBOT_MOTION_PATH[i + 1];
      const t = lengths[i] === 0 ? 0 : distance / lengths[i];
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      };
    }
    distance -= lengths[i];
  }

  return ROBOT_MOTION_PATH[0];
}

export function getRobotMotionPoint(item: SceneItem, time: number): MotionPoint {
  const offset = getRobotMotionOffset(time);
  return {
    x: item.cx + offset.x,
    y: item.cy + offset.y,
  };
}

export function getRobotTrackPoints(item: SceneItem): string {
  return ROBOT_MOTION_PATH
    .map(point => `${item.cx + point.x},${item.cy + point.y}`)
    .join(' ');
}
