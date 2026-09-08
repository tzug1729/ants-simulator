import { describe, expect, it } from "vitest";
import { RodSeparator } from "./RodSeparator";
import { Scenario } from "./Scenario";
import { Simulator } from "./Simulator";
import type { Direction } from "./types";

function scenarioOf(rodLength: number, positions: number[], directions: number[]): Scenario {
  return Scenario.of(rodLength, positions, directions as Direction[]);
}

/** 画面幅 700px 相当での体の長さ。SceneView と同じ決め方。 */
function bodyWidth(scenario: Scenario): number {
  const sorted = scenario.ants.map((a) => a.position).sort((p, q) => p - q);
  let gap = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 1 < sorted.length; i++) gap = Math.min(gap, sorted[i + 1] - sorted[i]);
  return Math.min(20 / (700 / scenario.rodLength), 0.6 * gap);
}

describe("RodSeparator", () => {
  it("十分に離れていれば 1 ミリも動かさない", () => {
    const separator = new RodSeparator(0.4);
    const input = [0, 5, 9];
    expect(separator.apply(input)).toEqual(input);
  });

  it("重なった 2 匹を左右対称に押し分け、ちょうど接する位置に置く", () => {
    const separator = new RodSeparator(0.4);
    const [left, right] = separator.apply([5, 5]);
    expect(left).toBeCloseTo(4.8, 12);
    expect(right).toBeCloseTo(5.2, 12);
    expect(right - left).toBeCloseTo(0.4, 12);
    expect((left + right) / 2).toBeCloseTo(5, 12); // 重心は動かない
  });

  it("3 匹以上の数珠つなぎもまとめて展開する", () => {
    const separator = new RodSeparator(1);
    const { positions, blockSizes } = separator.applyWithBlocks([4, 4, 4]);
    expect(positions).toEqual([3, 4, 5]);
    expect(blockSizes).toEqual([3, 3, 3]);
  });

  it("押し広げた結果ぶつかる隣も塊に取り込む", () => {
    const separator = new RodSeparator(0.6);
    const { positions, blockSizes } = separator.applyWithBlocks([0, 0.7, 1.0]);
    for (let i = 0; i + 1 < positions.length; i++) {
      expect(positions[i + 1] - positions[i]).toBeGreaterThanOrEqual(0.6 - 1e-12);
    }
    expect(blockSizes).toEqual([3, 3, 3]);
  });

  const CASES = [
    { name: "標準", scenario: scenarioOf(14, [2, 4, 6, 7, 10, 12], [1, -1, 1, -1, 1, -1]) },
    { name: "対称", scenario: scenarioOf(16, [3, 5, 8, 11, 13], [1, 1, -1, -1, -1]) },
    { name: "密集", scenario: scenarioOf(12, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11], [1, 1, 1, 1, 1, -1, -1, -1, -1, -1]) },
    { name: "例2", scenario: scenarioOf(214, [11, 12, 7, 13, 176, 23, 191], [1, -1, 1, -1, 1, -1, 1]) },
  ];

  it.each(CASES)("$name: 描画位置が最後までめり込まない", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    const width = bodyWidth(scenario);
    const separator = new RodSeparator(width);
    const steps = 3000;

    for (let k = 0; k <= steps; k++) {
      const time = (simulation.totalTime * k) / steps;
      const drawn = separator.apply(simulation.walkingStates(time).map((s) => s.position));
      for (let i = 0; i + 1 < drawn.length; i++) {
        expect(drawn[i + 1] - drawn[i]).toBeGreaterThanOrEqual(width - 1e-9);
      }
    }
  });

  it.each(CASES)("$name: 2 匹どうしの接触では進行方向と逆に動かない", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    const width = bodyWidth(scenario);
    const separator = new RodSeparator(width);
    const steps = 3000;
    const dt = simulation.totalTime / steps;

    let previous: Map<number, { x: number; block: number }> | null = null;
    for (let k = 0; k <= steps; k++) {
      const time = (simulation.totalTime * k) / steps;
      const states = simulation.walkingStates(time);
      const result = separator.applyWithBlocks(states.map((s) => s.position));
      const current = new Map(
        states.map((s, i) => [s.index, { x: result.positions[i], block: result.blockSizes[i] }]),
      );

      if (previous) {
        for (const state of states) {
          const now = current.get(state.index);
          const before = previous.get(state.index);
          if (!now || !before) continue;
          // 3 匹以上が触れ合っている間は、押されて下がるのが剛体として正しい
          if (now.block >= 3 || before.block >= 3) continue;
          const velocity = ((now.x - before.x) / dt) * state.direction;
          expect(velocity).toBeGreaterThan(-1e-4);
        }
      }
      previous = current;
    }
  });
});
