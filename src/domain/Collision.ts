/** 2 匹が出会って反転した瞬間 */
export class Collision {
  constructor(
    readonly time: number,
    readonly position: number,
    readonly leftIndex: number,
    readonly rightIndex: number,
  ) {}
}
