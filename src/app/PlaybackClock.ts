/**
 * 再生位置を持つ時計。React の外で毎フレーム進み、購読者に変化を通知する。
 * 画面の再描画は Canvas 側が直接行い、React は表示だけを受け取る。
 */
export class PlaybackClock {
  private static readonly RESTART_DELAY_MS = 900;

  private currentTime = 0;
  private isPlaying = false;
  private currentSpeed = 1;
  private isLooping = true;
  private totalDuration = 0;
  private restartAtMs = 0;

  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  // useSyncExternalStore へ渡すため、参照が変わらないよう束縛しておく
  readTime = (): number => this.currentTime;
  readPlaying = (): boolean => this.isPlaying;
  readSpeed = (): number => this.currentSpeed;
  readLooping = (): boolean => this.isLooping;
  readDuration = (): number => this.totalDuration;
  readProgress = (): number => (this.totalDuration > 0 ? this.currentTime / this.totalDuration : 0);

  get time(): number {
    return this.currentTime;
  }

  setDuration(duration: number, resetTime: boolean): void {
    this.totalDuration = duration;
    this.restartAtMs = 0;
    this.currentTime = resetTime ? 0 : Math.min(this.currentTime, duration);
    this.notify();
  }

  play(): void {
    if (this.currentTime >= this.totalDuration) this.currentTime = 0;
    this.isPlaying = true;
    this.restartAtMs = 0;
    this.notify();
  }

  pause(): void {
    this.isPlaying = false;
    this.restartAtMs = 0;
    this.notify();
  }

  toggle(): void {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.totalDuration, time));
    this.isPlaying = false;
    this.restartAtMs = 0;
    this.notify();
  }

  seekProgress(fraction: number): void {
    this.seek(fraction * this.totalDuration);
  }

  nudge(delta: number): void {
    this.seek(this.currentTime + delta);
  }

  reset(): void {
    this.seek(0);
  }

  setSpeed(speed: number): void {
    this.currentSpeed = speed;
    this.notify();
  }

  setLooping(looping: boolean): void {
    this.isLooping = looping;
    if (!looping) this.restartAtMs = 0;
    this.notify();
  }

  /** 毎フレーム呼ばれる。dt は秒。 */
  advance(deltaSeconds: number, nowMs: number): void {
    let changed = false;

    if (this.isPlaying) {
      this.currentTime += deltaSeconds * this.currentSpeed;
      if (this.currentTime >= this.totalDuration) {
        this.currentTime = this.totalDuration;
        this.isPlaying = false;
        if (this.isLooping && this.totalDuration > 0) {
          this.restartAtMs = nowMs + PlaybackClock.RESTART_DELAY_MS;
        }
      }
      changed = true;
    }

    if (this.restartAtMs !== 0 && nowMs >= this.restartAtMs) {
      this.restartAtMs = 0;
      if (this.isLooping) {
        this.currentTime = 0;
        this.isPlaying = true;
        changed = true;
      }
    }

    if (changed) this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
