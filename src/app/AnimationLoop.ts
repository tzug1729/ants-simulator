/** requestAnimationFrame の薄い包み。経過秒を渡して呼び返す。 */
export class AnimationLoop {
  private static readonly MAX_STEP_SECONDS = 0.05;

  private handle = 0;
  private lastMs = 0;

  constructor(private readonly step: (deltaSeconds: number, nowMs: number) => void) {}

  start(): void {
    if (this.handle !== 0) return;
    this.lastMs = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(AnimationLoop.MAX_STEP_SECONDS, (now - this.lastMs) / 1000);
      this.lastMs = now;
      this.step(delta, now);
      this.handle = requestAnimationFrame(tick);
    };
    this.handle = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.handle !== 0) cancelAnimationFrame(this.handle);
    this.handle = 0;
  }
}
