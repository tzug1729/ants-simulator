import type { Direction } from "./types";
import type { TrajectorySegment } from "./TrajectorySegment";

/** ある時刻におけるアリ 1 匹の様子 */
export class AntState {
  private constructor(
    readonly index: number,
    readonly position: number,
    readonly direction: Direction,
    readonly segment: TrajectorySegment,
    /** 落ちてからの経過時間。生存中は null。 */
    readonly fallenFor: number | null,
  ) {}

  static walking(index: number, position: number, segment: TrajectorySegment): AntState {
    return new AntState(index, position, segment.direction, segment, null);
  }

  static fallen(index: number, position: number, direction: Direction, segment: TrajectorySegment, elapsed: number): AntState {
    return new AntState(index, position, direction, segment, elapsed);
  }

  get isWalking(): boolean {
    return this.fallenFor === null;
  }
}
