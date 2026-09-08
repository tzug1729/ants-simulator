import { AntState } from "./AntState";
import { TrajectorySegment } from "./TrajectorySegment";
import type { Direction } from "./types";

/** アリ 1 匹の全軌跡と落下情報 */
export class AntTrack {
  readonly segments: TrajectorySegment[] = [];
  fallTime: number | null = null;
  fallSide: Direction | null = null;

  constructor(readonly index: number) {}

  openSegment(time: number, position: number, direction: Direction): void {
    this.segments.push(new TrajectorySegment(time, position, direction));
  }

  get currentSegment(): TrajectorySegment {
    return this.segments[this.segments.length - 1];
  }

  closeSegment(time: number, position: number): void {
    this.currentSegment.close(time, position);
  }

  markFallen(time: number, side: Direction): void {
    this.fallTime = time;
    this.fallSide = side;
  }

  get hasFallen(): boolean {
    return this.fallTime !== null;
  }

  stateAt(time: number, rodLength: number): AntState {
    if (this.fallTime !== null && time >= this.fallTime) {
      const side = this.fallSide as Direction;
      return AntState.fallen(
        this.index,
        side < 0 ? 0 : rodLength,
        side,
        this.currentSegment,
        time - this.fallTime,
      );
    }
    for (let k = this.segments.length - 1; k >= 0; k--) {
      const seg = this.segments[k];
      if (time >= seg.startTime - 1e-9) return AntState.walking(this.index, seg.positionAt(time), seg);
    }
    const first = this.segments[0];
    return AntState.walking(this.index, first.startPosition, first);
  }
}
