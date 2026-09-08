import { AntTrack } from "./AntTrack";
import { Collision } from "./Collision";
import { GhostTrack } from "./GhostTrack";
import { Simulation } from "./Simulation";
import { EPSILON, LEFT, RIGHT, opposite } from "./types";
import type { Direction } from "./types";
import type { Scenario } from "./Scenario";
import type { TrajectorySegment } from "./TrajectorySegment";

/** 計算中のアリ 1 匹 */
interface Walker {
  index: number;
  position: number;
  direction: Direction;
}

/**
 * イベント駆動のシミュレータ。
 * 「次に何かが起きる時刻」まで一気に進め、衝突は本当に反転として処理する。
 * アリは点として扱う（＝競技プログラミングの問題そのまま）。
 */
export class Simulator {
  private static readonly MAX_EVENTS = 20000;

  private readonly tracks: AntTrack[];
  private readonly collisions: Collision[] = [];
  private readonly ranks: number[];
  private walkers: Walker[];
  private time = 0;

  static run(scenario: Scenario): Simulation {
    return new Simulator(scenario).execute();
  }

  private constructor(private readonly scenario: Scenario) {
    const ants = scenario.ants;
    this.tracks = ants.map((_, i) => new AntTrack(i));
    this.ranks = new Array<number>(ants.length);

    // 左から順に並べる。アリは互いを追い越せないので、この順序は最後まで変わらない。
    const order = ants.map((_, i) => i).sort((a, b) => ants[a].position - ants[b].position || a - b);
    order.forEach((index, rank) => {
      this.ranks[index] = rank;
    });

    this.walkers = order.map((index) => ({
      index,
      position: ants[index].position,
      direction: ants[index].direction,
    }));
    for (const w of this.walkers) this.tracks[w.index].openSegment(0, w.position, w.direction);
  }

  private execute(): Simulation {
    for (let guard = 0; this.walkers.length > 0 && guard < Simulator.MAX_EVENTS; guard++) {
      const dt = this.timeToNextEvent();
      if (!Number.isFinite(dt)) break;

      this.advanceBy(Math.max(0, dt));
      const reversing = this.collectCollisions();
      const falling = this.collectFalls();

      for (const w of this.walkers) {
        if (falling.has(w.index) || reversing.has(w.index)) {
          this.tracks[w.index].closeSegment(this.time, w.position);
        }
      }
      if (falling.size > 0) this.walkers = this.walkers.filter((w) => !falling.has(w.index));
      for (const w of this.walkers) {
        if (!reversing.has(w.index)) continue;
        w.direction = opposite(w.direction);
        this.tracks[w.index].openSegment(this.time, w.position, w.direction);
      }

      if (dt < EPSILON && reversing.size === 0 && falling.size === 0) break; // 保険
    }
    this.closeDanglingSegments();

    const ghosts = this.scenario.ants.map(
      (a, i) => new GhostTrack(i, a.position, a.direction, this.scenario.rodLength),
    );
    this.assignGhosts(ghosts);
    return new Simulation(this.scenario, this.tracks, this.collisions, ghosts, this.ranks);
  }

  /** 端に着くか、隣とぶつかるか。いちばん早いものまでの時間。 */
  private timeToNextEvent(): number {
    const rod = this.scenario.rodLength;
    let dt = Number.POSITIVE_INFINITY;
    for (let k = 0; k < this.walkers.length; k++) {
      const a = this.walkers[k];
      const toEnd = a.direction === LEFT ? a.position : rod - a.position;
      if (toEnd < dt) dt = toEnd;

      const b = this.walkers[k + 1];
      if (b && a.direction === RIGHT && b.direction === LEFT) {
        const meet = (b.position - a.position) / 2;
        if (meet < dt) dt = meet;
      }
    }
    return dt;
  }

  private advanceBy(dt: number): void {
    const rod = this.scenario.rodLength;
    for (const w of this.walkers) {
      w.position = Math.max(0, Math.min(rod, w.position + w.direction * dt));
    }
    this.time += dt;
  }

  /** 今この瞬間に重なった、向かい合う隣どうし */
  private collectCollisions(): Set<number> {
    const reversing = new Set<number>();
    for (let k = 0; k + 1 < this.walkers.length; k++) {
      const a = this.walkers[k];
      const b = this.walkers[k + 1];
      if (a.direction !== RIGHT || b.direction !== LEFT) continue;
      if (b.position - a.position >= EPSILON) continue;
      reversing.add(a.index);
      reversing.add(b.index);
      this.collisions.push(new Collision(this.time, (a.position + b.position) / 2, a.index, b.index));
    }
    return reversing;
  }

  /** 今この瞬間に端へ着いたアリ */
  private collectFalls(): Set<number> {
    const rod = this.scenario.rodLength;
    const falling = new Set<number>();
    for (const w of this.walkers) {
      const atLeft = w.direction === LEFT && w.position <= EPSILON;
      const atRight = w.direction === RIGHT && w.position >= rod - EPSILON;
      if (!atLeft && !atRight) continue;
      falling.add(w.index);
      this.tracks[w.index].markFallen(this.time, atLeft ? LEFT : RIGHT);
    }
    return falling;
  }

  private closeDanglingSegments(): void {
    for (const track of this.tracks) {
      const seg = track.currentSegment;
      if (seg && !Number.isFinite(seg.endTime)) seg.close(this.time, seg.positionAt(this.time));
    }
  }

  /**
   * 各区間が、どのすり抜けアリの直線に乗っているかを対応づける。
   * 「反転 = 名札の交換」なので、実際の軌跡の集合とすり抜けの直線の集合は完全に一致する。
   */
  private assignGhosts(ghosts: readonly GhostTrack[]): void {
    for (const track of this.tracks) {
      for (const seg of track.segments) {
        seg.ghostIndex = this.nearestGhost(seg, ghosts);
      }
    }
  }

  private nearestGhost(segment: TrajectorySegment, ghosts: readonly GhostTrack[]): number {
    const origin = segment.lineOrigin;
    let best = 0;
    let bestError = Number.POSITIVE_INFINITY;
    for (const g of ghosts) {
      if (g.direction !== segment.direction) continue;
      const error = Math.abs(g.startPosition - origin);
      if (error < bestError) {
        bestError = error;
        best = g.index;
      }
    }
    return best;
  }
}
