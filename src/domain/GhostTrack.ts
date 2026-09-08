import type { Direction } from "./types";

/**
 * すり抜けると仮定したアリ。初期状態のまま、端まで一直線に歩く。
 * 実際のアリの「位置の集合」は、常にこのゴーストたちの位置の集合と一致する。
 */
export class GhostTrack {
  readonly fallTime: number;

  constructor(
    readonly index: number,
    readonly startPosition: number,
    readonly direction: Direction,
    readonly rodLength: number,
  ) {
    this.fallTime = direction < 0 ? startPosition : rodLength - startPosition;
  }

  positionAt(time: number): number {
    return this.startPosition + this.direction * time;
  }

  hasFallenAt(time: number): boolean {
    return time >= this.fallTime;
  }
}
