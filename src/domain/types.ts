/** 進行方向。-1 = 左、+1 = 右。速さは常に 1。 */
export type Direction = -1 | 1;

export const LEFT: Direction = -1;
export const RIGHT: Direction = 1;

/** イベント時刻の同時性を判定する許容誤差 */
export const EPSILON = 1e-7;

export function opposite(direction: Direction): Direction {
  return direction === LEFT ? RIGHT : LEFT;
}
