import type { Scenario } from "../domain/Scenario";
import type { Simulation } from "../domain/Simulation";

/** 見せ方。反転＝実際の動き / すり抜け＝名札を交換したと見なした動き。 */
export type ViewMode = "reverse" | "passthrough";

/** 「この時刻を、この見せ方で描く」という 1 コマ分の指示 */
export class Frame {
  constructor(
    readonly simulation: Simulation,
    readonly time: number,
    readonly mode: ViewMode,
  ) {}

  get scenario(): Scenario {
    return this.simulation.scenario;
  }

  get rodLength(): number {
    return this.simulation.scenario.rodLength;
  }

  get isReverseMode(): boolean {
    return this.mode === "reverse";
  }
}
