import { Ant } from "./Ant";
import { LEFT, RIGHT } from "./types";
import type { Direction } from "./types";

/**
 * 棒の長さとアリの初期配置。
 * すべての変更操作は新しい Scenario を返す（不変）。React の状態としてそのまま扱える。
 */
export class Scenario {
  static readonly MAX_ANTS = 24;
  static readonly MIN_ROD = 2;
  static readonly MAX_ROD = 400;

  constructor(
    readonly rodLength: number,
    readonly ants: readonly Ant[],
  ) {}

  static of(rodLength: number, positions: readonly number[], directions: readonly Direction[]): Scenario {
    return new Scenario(
      rodLength,
      positions.map((x, i) => new Ant(x, directions[i] ?? RIGHT)),
    );
  }

  get count(): number {
    return this.ants.length;
  }

  /** 位置を置ける刻み幅。棒が長いときは 1、短いときは 0.5。 */
  get snapUnit(): number {
    return this.rodLength <= 20 ? 0.5 : 1;
  }

  snap(x: number): number {
    const u = this.snapUnit;
    return Math.max(0, Math.min(this.rodLength, Math.round(x / u) * u));
  }

  isOccupied(x: number, exceptIndex = -1): boolean {
    return this.ants.some((a, i) => i !== exceptIndex && Math.abs(a.position - x) < 1e-6);
  }

  /** 端を除く、まだアリの居ない格子点 */
  private freeSlots(): number[] {
    const u = this.snapUnit;
    const slots: number[] = [];
    for (let k = 1; k * u < this.rodLength - 1e-9; k++) {
      const v = Math.round(k * u * 1e6) / 1e6;
      if (!this.isOccupied(v)) slots.push(v);
    }
    return slots;
  }

  /** いちばん広く空いている区間の中央 */
  private widestGapCenter(): number {
    const points = [0, ...this.ants.map((a) => a.position).sort((p, q) => p - q), this.rodLength];
    let center = this.rodLength / 2;
    let widest = -1;
    for (let i = 0; i + 1 < points.length; i++) {
      const gap = points[i + 1] - points[i];
      if (gap > widest) {
        widest = gap;
        center = (points[i] + points[i + 1]) / 2;
      }
    }
    return center;
  }

  withRodLength(rodLength: number): Scenario {
    const L = Math.max(Scenario.MIN_ROD, Math.min(Scenario.MAX_ROD, Math.round(rodLength)));
    return new Scenario(
      L,
      this.ants.filter((a) => a.position > 0 && a.position < L),
    );
  }

  /** いちばん広く空いている場所へ 1 匹足す。置けなければ自分自身を返す。 */
  addedAtWidestGap(): Scenario {
    if (this.count >= Scenario.MAX_ANTS) return this;
    const slots = this.freeSlots();
    if (slots.length === 0) return this;
    const target = this.widestGapCenter();
    let best = slots[0];
    for (const v of slots) if (Math.abs(v - target) < Math.abs(best - target)) best = v;
    // 交互に向かせておくと必ず衝突が起きる
    const direction: Direction = this.count % 2 === 0 ? RIGHT : LEFT;
    return new Scenario(this.rodLength, [...this.ants, new Ant(best, direction)]);
  }

  addedAt(x: number): Scenario {
    const v = this.snap(x);
    if (this.count >= Scenario.MAX_ANTS || v <= 0 || v >= this.rodLength || this.isOccupied(v)) return this;
    const direction: Direction = x < this.rodLength / 2 ? RIGHT : LEFT;
    return new Scenario(this.rodLength, [...this.ants, new Ant(v, direction)]);
  }

  withCount(n: number): Scenario {
    const target = Math.max(0, Math.min(Scenario.MAX_ANTS, Math.round(n) || 0));
    let next: Scenario = this;
    while (next.count > target) next = new Scenario(next.rodLength, next.ants.slice(0, -1));
    while (next.count < target) {
      const grown = next.addedAtWidestGap();
      if (grown === next) break; // 置ける場所がもう無い
      next = grown;
    }
    return next;
  }

  reversedAt(index: number): Scenario {
    return this.replaceAt(index, this.ants[index].reversed());
  }

  movedAt(index: number, x: number): Scenario {
    const v = this.snap(x);
    if (v <= 0 || v >= this.rodLength || this.isOccupied(v, index)) return this;
    return this.replaceAt(index, this.ants[index].movedTo(v));
  }

  private replaceAt(index: number, ant: Ant): Scenario {
    if (index < 0 || index >= this.count) return this;
    const next = this.ants.slice();
    next[index] = ant;
    return new Scenario(this.rodLength, next);
  }

  mapAnts(fn: (ant: Ant, index: number) => Ant): Scenario {
    return new Scenario(this.rodLength, this.ants.map(fn));
  }

  facingNearEnds(): Scenario {
    return this.mapAnts((a) => a.towardNearEnd(this.rodLength));
  }

  facingFarEnds(): Scenario {
    return this.mapAnts((a) => a.towardFarEnd(this.rodLength));
  }

  allReversed(): Scenario {
    return this.mapAnts((a) => a.reversed());
  }

  withRandomDirections(random: () => number = Math.random): Scenario {
    return this.mapAnts((a) => a.facing(random() < 0.5 ? LEFT : RIGHT));
  }

  /** 匹数を保ったまま位置と向きを振り直す */
  randomized(random: () => number = Math.random): Scenario {
    const u = this.snapUnit;
    const slots: number[] = [];
    for (let k = 1; k * u < this.rodLength - 1e-9; k++) slots.push(Math.round(k * u * 1e6) / 1e6);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const picked = slots.slice(0, Math.min(this.count, slots.length)).sort((p, q) => p - q);
    return new Scenario(
      this.rodLength,
      picked.map((x) => new Ant(x, random() < 0.5 ? LEFT : RIGHT)),
    );
  }

  /** 向きを自由に選べるときの、全滅までの最短時間 */
  get shortestTime(): number {
    return this.ants.reduce((acc, a) => Math.max(acc, a.distanceToNearEnd(this.rodLength)), 0);
  }

  /** 同じく最長時間 */
  get longestTime(): number {
    return this.ants.reduce((acc, a) => Math.max(acc, a.distanceToFarEnd(this.rodLength)), 0);
  }

  ghostFallTimes(): number[] {
    return this.ants.map((a) => a.ghostFallTime(this.rodLength));
  }
}
