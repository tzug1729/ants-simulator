import { Scenario } from "../domain/Scenario";
import type { Direction } from "../domain/types";

export interface Preset {
  readonly name: string;
  readonly scenario: Scenario;
}

function build(name: string, rodLength: number, positions: number[], directions: number[]): Preset {
  return { name, scenario: Scenario.of(rodLength, positions, directions as Direction[]) };
}

export const PRESETS: readonly Preset[] = [
  build("標準", 14, [2, 4, 6, 7, 10, 12], [1, -1, 1, -1, 1, -1]),
  build("例1", 10, [2, 6, 7], [1, -1, 1]),
  build("例2", 214, [11, 12, 7, 13, 176, 23, 191], [1, -1, 1, -1, 1, -1, 1]),
  build("対称", 16, [3, 5, 8, 11, 13], [1, 1, -1, -1, -1]),
  build("密集", 12, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11], [1, 1, 1, 1, 1, -1, -1, -1, -1, -1]),
  build("1匹", 10, [3], [-1]),
];
