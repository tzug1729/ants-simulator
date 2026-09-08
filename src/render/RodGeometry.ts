/** 「ちょうどよい」目盛り幅（1, 2, 5, 10, 20, ... のいずれか） */
export function niceStep(rough: number): number {
  if (!(rough > 0)) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

/**
 * 棒の座標（0..rodLength）とキャンバスの横位置の対応。
 * 上の実演と下の時空図が同じ式を使うので、2 つの図の横軸は必ず揃う。
 */
export class RodGeometry {
  private constructor(
    readonly canvasWidth: number,
    readonly rodLength: number,
    readonly pad: number,
  ) {}

  static forCanvas(canvasWidth: number, rodLength: number): RodGeometry {
    const pad = Math.max(30, Math.min(40, canvasWidth * 0.055));
    return new RodGeometry(canvasWidth, Math.max(1e-6, rodLength), pad);
  }

  get left(): number {
    return this.pad;
  }

  get right(): number {
    return this.canvasWidth - this.pad;
  }

  get span(): number {
    return Math.max(1, this.right - this.left);
  }

  get pixelsPerUnit(): number {
    return this.span / this.rodLength;
  }

  toPixel(position: number): number {
    return this.left + (position / this.rodLength) * this.span;
  }

  toPosition(pixel: number): number {
    return ((pixel - this.left) / this.span) * this.rodLength;
  }

  tickValues(): number[] {
    const step = niceStep(this.rodLength / 8);
    const values: number[] = [];
    for (let v = 0; v <= this.rodLength + 1e-9; v += step) values.push(Math.round(v * 1e6) / 1e6);
    return values;
  }
}
