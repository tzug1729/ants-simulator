import { describe, expect, it } from "vitest";
import { Scenario } from "./Scenario";
import { LEFT, RIGHT } from "./types";
import type { Direction } from "./types";

function scenarioOf(rodLength: number, positions: number[], directions: number[]): Scenario {
  return Scenario.of(rodLength, positions, directions as Direction[]);
}

describe("Scenario", () => {
  it("アリの数を増減できる", () => {
    const base = scenarioOf(14, [2, 7], [1, -1]);
    expect(base.withCount(6).count).toBe(6);
    expect(base.withCount(1).count).toBe(1);
    expect(base.withCount(0).count).toBe(0);
    expect(base.withCount(999).count).toBe(Scenario.MAX_ANTS);
  });

  it("増やしたアリは既存のアリと重ならない", () => {
    const grown = scenarioOf(14, [2, 7], [1, -1]).withCount(12);
    const positions = grown.ants.map((a) => a.position);
    expect(new Set(positions).size).toBe(positions.length);
    for (const x of positions) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(grown.rodLength);
    }
  });

  it("置ける場所が尽きたらそれ以上増えない", () => {
    // L=3, 刻み 0.5 なら端を除いて 5 か所しか置けない
    const packed = scenarioOf(3, [], []).withCount(20);
    expect(packed.count).toBe(5);
  });

  it("棒を縮めると外に出たアリは落とされる", () => {
    const shrunk = scenarioOf(20, [2, 8, 15, 18], [1, 1, 1, 1]).withRodLength(10);
    expect(shrunk.ants.map((a) => a.position)).toEqual([2, 8]);
  });

  it("同じ位置には置けない", () => {
    const base = scenarioOf(14, [4], [1]);
    expect(base.addedAt(4).count).toBe(1);
    expect(base.addedAt(5).count).toBe(2);
    expect(base.movedAt(0, 4).ants[0].position).toBe(4);
  });

  it("理論上の最短・最長が公式どおりになる", () => {
    // POJ 1852 のサンプル
    const sample1 = scenarioOf(10, [2, 6, 7], [1, 1, 1]);
    expect(sample1.shortestTime).toBe(4);
    expect(sample1.longestTime).toBe(8);

    const sample2 = scenarioOf(214, [11, 12, 7, 13, 176, 23, 191], [1, 1, 1, 1, 1, 1, 1]);
    expect(sample2.shortestTime).toBe(38);
    expect(sample2.longestTime).toBe(207);
  });

  it("最短・最長の向きが、それぞれ近い端・遠い端を向く", () => {
    const base = scenarioOf(10, [2, 6, 7], [1, 1, 1]);
    expect(base.facingNearEnds().ants.map((a) => a.direction)).toEqual([LEFT, RIGHT, RIGHT]);
    expect(base.facingFarEnds().ants.map((a) => a.direction)).toEqual([RIGHT, LEFT, LEFT]);
  });

  it("向きの操作で位置は変わらない", () => {
    const base = scenarioOf(14, [2, 4, 9], [1, -1, 1]);
    for (const next of [base.allReversed(), base.facingNearEnds(), base.facingFarEnds()]) {
      expect(next.ants.map((a) => a.position)).toEqual([2, 4, 9]);
    }
    expect(base.allReversed().ants.map((a) => a.direction)).toEqual([LEFT, RIGHT, LEFT]);
  });

  it("ランダム配置は匹数を保ち、位置が重複しない", () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const base = scenarioOf(14, [2, 4, 6, 7, 10, 12], [1, -1, 1, -1, 1, -1]);
    for (let i = 0; i < 50; i++) {
      const shuffled = base.randomized(random);
      expect(shuffled.count).toBe(base.count);
      expect(new Set(shuffled.ants.map((a) => a.position)).size).toBe(base.count);
    }
  });

  it("変更しても元のオブジェクトは書き換わらない", () => {
    const base = scenarioOf(14, [2, 7], [1, -1]);
    const changed = base.reversedAt(0).withCount(5).withRodLength(20);
    expect(base.count).toBe(2);
    expect(base.rodLength).toBe(14);
    expect(base.ants[0].direction).toBe(RIGHT);
    expect(changed).not.toBe(base);
  });
});
