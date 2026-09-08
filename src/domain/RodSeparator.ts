/**
 * 点として計算されたアリの位置を、体の長さ width だけ間隔を空けた配置に直す。
 *
 * 物理は点のまま（＝問題の答えを変えない）で、描画位置だけを直すための道具。
 * 「q[k+1] - q[k] >= width を満たしつつ元の位置に最も近い配置」を求める問題は、
 * u[k] = q[k] - k*width が単調増加、という制約に読み替えられるので等調回帰（PAVA）で解ける。
 *
 * - 十分に離れたアリは 1 ミリも動かない
 * - ぶつかった 2 匹は左右対称に ±width/2 ずれ、ちょうど頭が接して止まる
 * - 3 匹以上が数珠つなぎに触れた場合も、塊ごとにまとめて正しく展開される
 */
export class RodSeparator {
  constructor(readonly width: number) {}

  apply(positions: readonly number[]): number[] {
    return this.applyWithBlocks(positions).positions;
  }

  /** 押し分けた位置と、各アリが属する塊の大きさ */
  applyWithBlocks(positions: readonly number[]): { positions: number[]; blockSizes: number[] } {
    const n = positions.length;
    const value = new Array<number>(n);
    const size = new Array<number>(n);
    let top = -1;

    for (let k = 0; k < n; k++) {
      let v = positions[k] - k * this.width;
      let c = 1;
      while (top >= 0 && value[top] > v) {
        // 直前の塊と順序が逆転した ⇒ 併合して平均をとる
        v = (value[top] * size[top] + v * c) / (size[top] + c);
        c += size[top];
        top--;
      }
      top++;
      value[top] = v;
      size[top] = c;
    }

    const out = new Array<number>(n);
    const blockSizes = new Array<number>(n);
    let k = 0;
    for (let b = 0; b <= top; b++) {
      for (let j = 0; j < size[b]; j++, k++) {
        out[k] = value[b] + k * this.width;
        blockSizes[k] = size[b];
      }
    }
    return { positions: out, blockSizes };
  }
}
