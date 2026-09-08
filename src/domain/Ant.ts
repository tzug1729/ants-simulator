import { LEFT, RIGHT, opposite } from "./types";
import type { Direction } from "./types";

/** 棒の上のアリ 1 匹。位置と向きだけを持つ不変オブジェクト。 */
export class Ant {
  constructor(
    readonly position: number,
    readonly direction: Direction,
  ) {}

  reversed(): Ant {
    return new Ant(this.position, opposite(this.direction));
  }

  movedTo(position: number): Ant {
    return new Ant(position, this.direction);
  }

  facing(direction: Direction): Ant {
    return new Ant(this.position, direction);
  }

  /** すり抜けてよいと仮定したとき、このアリが棒から落ちる時刻 */
  ghostFallTime(rodLength: number): number {
    return this.direction === LEFT ? this.position : rodLength - this.position;
  }

  distanceToNearEnd(rodLength: number): number {
    return Math.min(this.position, rodLength - this.position);
  }

  distanceToFarEnd(rodLength: number): number {
    return Math.max(this.position, rodLength - this.position);
  }

  /** 近い端を向かせる（全体を最短で終わらせたいとき） */
  towardNearEnd(rodLength: number): Ant {
    return this.facing(this.position <= rodLength - this.position ? LEFT : RIGHT);
  }

  /** 遠い端を向かせる（全体を最長にしたいとき） */
  towardFarEnd(rodLength: number): Ant {
    return this.facing(this.position <= rodLength - this.position ? RIGHT : LEFT);
  }
}
