import type { Direction } from "./types";

/** 軌跡の 1 区間。反転するたびに区切られる。区間の中では等速直線運動。 */
export class TrajectorySegment {
  endTime = Number.POSITIVE_INFINITY;
  endPosition = Number.NaN;
  /** この区間が乗っている直線に対応する、すり抜けアリの番号 */
  ghostIndex = -1;

  constructor(
    readonly startTime: number,
    readonly startPosition: number,
    readonly direction: Direction,
  ) {}

  close(time: number, position: number): void {
    this.endTime = time;
    this.endPosition = position;
  }

  positionAt(time: number): number {
    return this.startPosition + this.direction * (time - this.startTime);
  }

  get duration(): number {
    return this.endTime - this.startTime;
  }

  /** 反転で始まった区間か（最初の区間だけ t=0 から始まる） */
  get startsWithReversal(): boolean {
    return this.startTime > 0;
  }

  /** この区間を時刻 0 まで延長したときの位置。すり抜けアリとの対応づけに使う。 */
  get lineOrigin(): number {
    return this.startPosition - this.direction * this.startTime;
  }
}
