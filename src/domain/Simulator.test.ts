import { describe, expect, it } from "vitest";
import { Scenario } from "./Scenario";
import { Simulator } from "./Simulator";
import type { Direction } from "./types";
import type { Simulation } from "./Simulation";

const EPS = 1e-6;

function scenarioOf(rodLength: number, positions: number[], directions: number[]): Scenario {
  return Scenario.of(rodLength, positions, directions as Direction[]);
}

const CASES: { name: string; scenario: Scenario }[] = [
  { name: "標準", scenario: scenarioOf(14, [2, 4, 6, 7, 10, 12], [1, -1, 1, -1, 1, -1]) },
  { name: "例1", scenario: scenarioOf(10, [2, 6, 7], [1, -1, 1]) },
  { name: "例2", scenario: scenarioOf(214, [11, 12, 7, 13, 176, 23, 191], [1, -1, 1, -1, 1, -1, 1]) },
  { name: "対称", scenario: scenarioOf(16, [3, 5, 8, 11, 13], [1, 1, -1, -1, -1]) },
  { name: "密集", scenario: scenarioOf(12, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11], [1, 1, 1, 1, 1, -1, -1, -1, -1, -1]) },
  { name: "1匹", scenario: scenarioOf(10, [3], [-1]) },
  { name: "全部右", scenario: scenarioOf(10, [1, 2, 3, 4], [1, 1, 1, 1]) },
  { name: "全部左", scenario: scenarioOf(10, [1, 2, 3, 4], [-1, -1, -1, -1]) },
  { name: "正面衝突", scenario: scenarioOf(10, [1, 9], [1, -1]) },
  { name: "端ぎりぎり", scenario: scenarioOf(10, [0.5, 9.5], [-1, 1]) },
];

/** すり抜けたと仮定したときの、生きているアリの位置（昇順） */
function ghostPositions(scenario: Scenario, time: number): number[] {
  return scenario.ants
    .map((a) => a.position + a.direction * time)
    .filter((x) => x > 1e-9 && x < scenario.rodLength - 1e-9)
    .sort((p, q) => p - q);
}

function realPositions(simulation: Simulation, time: number): number[] {
  return simulation
    .walkingStates(time)
    .map((s) => s.position)
    .sort((p, q) => p - q);
}

describe("Simulator", () => {
  it.each(CASES)("$name: 全滅時刻がすり抜け計算の最大値と一致する", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    const expected = Math.max(0, ...scenario.ghostFallTimes());
    expect(simulation.totalTime).toBeCloseTo(expected, 9);
  });

  it.each(CASES)("$name: 落下時刻の多重集合が一致する", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    const actual = simulation.tracks.map((t) => t.fallTime ?? NaN).sort((p, q) => p - q);
    const expected = scenario.ghostFallTimes().sort((p, q) => p - q);
    expect(actual.length).toBe(expected.length);
    actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 9));
  });

  it.each(CASES)("$name: 全員が棒から落ちる", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    expect(simulation.tracks.every((t) => t.hasFallen)).toBe(true);
  });

  it.each(CASES)("$name: 位置の多重集合が常にすり抜けと一致する", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    const total = simulation.totalTime;
    for (let k = 0; k <= 200; k++) {
      const time = (total * k) / 200;
      const real = realPositions(simulation, time);
      const ghost = ghostPositions(scenario, time);
      expect(real.length).toBe(ghost.length);
      real.forEach((value, i) => expect(Math.abs(value - ghost[i])).toBeLessThan(EPS));
    }
  });

  it.each(CASES)("$name: アリが互いを追い越さない", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    const total = simulation.totalTime;
    for (let k = 0; k <= 200; k++) {
      const states = simulation.walkingStates((total * k) / 200);
      for (let i = 0; i + 1 < states.length; i++) {
        expect(states[i].position).toBeLessThanOrEqual(states[i + 1].position + EPS);
      }
    }
  });

  it.each(CASES)("$name: 軌跡が連続し、速さが常に 1 で、端で終わる", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    simulation.tracks.forEach((track, index) => {
      const first = track.segments[0];
      expect(first.startPosition).toBeCloseTo(scenario.ants[index].position, 9);
      expect(first.direction).toBe(scenario.ants[index].direction);

      for (let k = 0; k + 1 < track.segments.length; k++) {
        const a = track.segments[k];
        const b = track.segments[k + 1];
        expect(a.endTime).toBeCloseTo(b.startTime, 9);
        expect(a.endPosition).toBeCloseTo(b.startPosition, 9);
        expect(a.direction).not.toBe(b.direction); // 区間が切れるのは反転したときだけ
        expect(a.endPosition - a.startPosition).toBeCloseTo(a.direction * a.duration, 9);
      }

      const last = track.segments[track.segments.length - 1];
      const edge = (track.fallSide ?? 1) < 0 ? 0 : scenario.rodLength;
      expect(last.endPosition).toBeCloseTo(edge, 9);
      expect(last.endTime).toBeCloseTo(track.fallTime ?? -1, 9);
    });
  });

  it.each(CASES)("$name: 各区間がすり抜けアリの直線に乗っている", ({ scenario }) => {
    const simulation = Simulator.run(scenario);
    for (const track of simulation.tracks) {
      for (const segment of track.segments) {
        const ghost = simulation.ghosts[segment.ghostIndex];
        expect(ghost.direction).toBe(segment.direction);
        expect(ghost.positionAt(segment.startTime)).toBeCloseTo(segment.startPosition, 6);
      }
    }
  });

  it("ランダム 500 ケースでも不変量が保たれる", () => {
    let seed = 12345;
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let round = 0; round < 500; round++) {
      const rodLength = 5 + Math.floor(random() * 25);
      const wanted = 1 + Math.floor(random() * 10);
      const chosen = new Set<number>();
      const slotCount = (rodLength - 1) * 2;
      while (chosen.size < Math.min(wanted, slotCount)) {
        chosen.add(Math.round((0.5 + random() * (rodLength - 1)) * 2) / 2);
      }
      const positions = [...chosen].filter((x) => x > 0 && x < rodLength).sort((p, q) => p - q);
      if (positions.length === 0) continue;
      const scenario = scenarioOf(
        rodLength,
        positions,
        positions.map(() => (random() < 0.5 ? -1 : 1)),
      );

      const simulation = Simulator.run(scenario);
      const ghostTimes = scenario.ghostFallTimes().sort((p, q) => p - q);
      expect(simulation.totalTime).toBeCloseTo(ghostTimes[ghostTimes.length - 1], 9);

      const fallTimes = simulation.tracks.map((t) => t.fallTime ?? NaN).sort((p, q) => p - q);
      fallTimes.forEach((value, i) => expect(Math.abs(value - ghostTimes[i])).toBeLessThan(EPS));

      for (let k = 0; k <= 40; k++) {
        const time = (simulation.totalTime * k) / 40;
        const real = realPositions(simulation, time);
        const ghost = ghostPositions(scenario, time);
        expect(real.length).toBe(ghost.length);
        real.forEach((value, i) => expect(Math.abs(value - ghost[i])).toBeLessThan(EPS));
      }
    }
  });

  it("例題の答えが POJ 1852 の期待出力と一致する", () => {
    const sample1 = scenarioOf(10, [2, 6, 7], [1, 1, 1]);
    expect(sample1.shortestTime).toBe(4);
    expect(sample1.longestTime).toBe(8);

    const sample2 = scenarioOf(214, [11, 12, 7, 13, 176, 23, 191], [1, 1, 1, 1, 1, 1, 1]);
    expect(sample2.shortestTime).toBe(38);
    expect(sample2.longestTime).toBe(207);

    // 実際に反転させて動かしても、最長の向きなら同じ時刻で全滅する
    expect(Simulator.run(sample2.facingFarEnds()).totalTime).toBe(207);
    expect(Simulator.run(sample1.facingNearEnds()).totalTime).toBe(4);
  });
});
