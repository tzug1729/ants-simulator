import type { AntState } from "./AntState";
import type { AntTrack } from "./AntTrack";
import type { Collision } from "./Collision";
import type { GhostTrack } from "./GhostTrack";
import type { Scenario } from "./Scenario";
import type { TrajectorySegment } from "./TrajectorySegment";

/** シミュレーション結果。時刻を渡せば、その瞬間の様子を返す。 */
export class Simulation {
  readonly totalTime: number;

  constructor(
    readonly scenario: Scenario,
    readonly tracks: readonly AntTrack[],
    readonly collisions: readonly Collision[],
    readonly ghosts: readonly GhostTrack[],
    /** ranks[i] = アリ i の初期位置の順位（左から 0,1,2,...）。アリは追い越さないので不変。 */
    private readonly ranks: readonly number[],
  ) {
    this.totalTime = tracks.reduce((acc, t) => Math.max(acc, t.fallTime ?? 0), 0);
  }

  get count(): number {
    return this.tracks.length;
  }

  rankOf(index: number): number {
    return this.ranks[index];
  }

  /** 区間が乗っている直線に対応する、すり抜けアリの順位 */
  ghostRankOf(segment: TrajectorySegment): number {
    return this.ranks[segment.ghostIndex] ?? 0;
  }

  stateAt(index: number, time: number): AntState {
    return this.tracks[index].stateAt(time, this.scenario.rodLength);
  }

  /** その時刻に棒の上に居るアリを、左から順に並べて返す */
  walkingStates(time: number): AntState[] {
    const states: AntState[] = [];
    for (let i = 0; i < this.count; i++) {
      const s = this.stateAt(i, time);
      if (s.isWalking) states.push(s);
    }
    return states.sort((a, b) => this.ranks[a.index] - this.ranks[b.index]);
  }

  fallCounts(): { left: number; right: number } {
    let left = 0;
    let right = 0;
    for (const t of this.tracks) {
      if (t.fallSide === null) continue;
      if (t.fallSide < 0) left++;
      else right++;
    }
    return { left, right };
  }
}
