/**
 * アリの絵。
 * facing は -1..1 の連続値で、0 に近いほど真横（＝向きを変えている途中）を表す。
 */
export class AntSprite {
  /** 絵の原寸（この単位系での体長がおよそ 8） */
  private static readonly UNIT = 8;
  private static readonly MIN_FACING = 0.12;

  constructor(readonly length: number) {}

  private get scale(): number {
    return this.length / AntSprite.UNIT;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    color: string,
    alpha = 1,
  ): void {
    const clamped =
      Math.abs(facing) < AntSprite.MIN_FACING
        ? AntSprite.MIN_FACING * (facing < 0 ? -1 : 1)
        : facing;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.scale(clamped * this.scale, this.scale);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";

    if (this.length >= 11) this.drawDetailed(ctx);
    else this.drawSimplified(ctx);

    ctx.restore();
  }

  private drawDetailed(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = 0.62; // 脚
    for (let i = 0; i < 3; i++) {
      const baseX = -0.4 + i * 0.95;
      const spread = (i - 1) * 0.5;
      ctx.beginPath();
      ctx.moveTo(baseX, 0.2);
      ctx.lineTo(baseX + spread, 2.5);
      ctx.moveTo(baseX, 0.2);
      ctx.lineTo(baseX + spread, -2.5);
      ctx.stroke();
    }

    ctx.lineWidth = 0.5; // 触角
    ctx.beginPath();
    ctx.moveTo(2.7, -0.5);
    ctx.quadraticCurveTo(4.1, -1.6, 4.7, -2.6);
    ctx.moveTo(2.7, 0.5);
    ctx.quadraticCurveTo(4.1, 1.6, 4.7, 2.6);
    ctx.stroke();

    ctx.beginPath(); // 腹部
    ctx.ellipse(-2.7, 0, 2.0, 1.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 0.7; // 腹柄
    ctx.beginPath();
    ctx.moveTo(-1.1, 0);
    ctx.lineTo(-0.2, 0);
    ctx.stroke();

    ctx.beginPath(); // 胸部
    ctx.ellipse(0.5, 0, 1.25, 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath(); // 頭
    ctx.ellipse(2.6, 0, 1.45, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSimplified(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.ellipse(-1.4, 0, 2.4, 1.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2.2, 0, 1.5, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
