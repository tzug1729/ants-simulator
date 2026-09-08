import { RodSeparator } from "../domain/RodSeparator";
import { AntSprite } from "./AntSprite";
import { CanvasView } from "./CanvasView";
import { Frame } from "./Frame";
import { Palette } from "./Palette";
import { RodGeometry } from "./RodGeometry";
import type { AntState } from "../domain/AntState";
import type { TrajectorySegment } from "../domain/TrajectorySegment";

const MONO = '10px "Cascadia Mono", Consolas, ui-monospace, "SF Mono", Menlo, monospace';

/** 落下しきるまでの秒数（見た目だけの値） */
const FALL_DURATION = 0.45;

interface Layout {
  geometry: RodGeometry;
  rodTop: number;
  rodBottom: number;
  antBaseline: number;
  /** 体の長さ（棒の座標系） */
  bodyWidth: number;
  sprite: AntSprite;
}

/**
 * 棒の上の実演。
 *
 * 物理は点のままなので、そのまま描くと衝突の瞬間に 2 匹が完全に重なってしまう。
 * そこで RodSeparator で体の長さぶん押し分け、頭が触れたところで止まって見えるようにする。
 * 反転そのものは、体をその場で回して見せる。
 */
export class SceneView extends CanvasView<Frame> {
  private layout: Layout | null = null;

  protected paint(ctx: CanvasRenderingContext2D, frame: Frame): void {
    const palette = Palette.current();
    const layout = this.computeLayout(frame);
    this.layout = layout;

    this.paintRod(ctx, layout, palette);
    this.paintTicks(ctx, layout, palette);
    if (frame.isReverseMode) this.paintRealAnts(ctx, frame, layout, palette);
    else this.paintGhostAnts(ctx, frame, layout, palette);
  }

  /** キャンバス上の x 座標を棒の座標に直す */
  positionAt(pixelX: number): number {
    return this.layout ? this.layout.geometry.toPosition(pixelX) : 0;
  }

  /** アリを置ける／掴める帯の中か */
  isInteractive(pixelY: number): boolean {
    if (!this.layout) return false;
    return pixelY > this.layout.rodTop - this.layout.sprite.length * 1.4 && pixelY < this.layout.rodBottom + 6;
  }

  /** その座標に居るアリの番号。無ければ -1。 */
  antAt(pixelX: number, pixelY: number, frame: Frame): number {
    if (!this.layout || !this.isInteractive(pixelY)) return -1;
    const { geometry } = this.layout;
    const tolerance = Math.max(14, this.layout.sprite.length * 0.8);
    let found = -1;
    let bestDistance = tolerance;
    for (const state of frame.simulation.walkingStates(frame.time)) {
      const distance = Math.abs(geometry.toPixel(state.position) - pixelX);
      if (distance < bestDistance) {
        bestDistance = distance;
        found = state.index;
      }
    }
    return found;
  }

  private computeLayout(frame: Frame): Layout {
    const geometry = RodGeometry.forCanvas(this.width, frame.rodLength);
    const rodHeight = Math.max(7, Math.min(12, this.height * 0.07));
    const rodTop = Math.round(this.height * 0.4);

    const maxSprite = Math.max(11, Math.min(20, this.width / 42));
    const bodyWidth = Math.min(maxSprite / geometry.pixelsPerUnit, 0.6 * this.minimumGap(frame));
    const spriteLength = Math.max(5, Math.min(maxSprite, bodyWidth * geometry.pixelsPerUnit));

    return {
      geometry,
      rodTop,
      rodBottom: rodTop + rodHeight,
      antBaseline: rodTop - spriteLength * 0.33,
      bodyWidth,
      sprite: new AntSprite(spriteLength),
    };
  }

  /** 初期配置での最小の間隔。詰まった配置では体を小さく描くための上限。 */
  private minimumGap(frame: Frame): number {
    const positions = frame.scenario.ants.map((a) => a.position).sort((p, q) => p - q);
    let gap = Number.POSITIVE_INFINITY;
    for (let i = 0; i + 1 < positions.length; i++) gap = Math.min(gap, positions[i + 1] - positions[i]);
    return gap;
  }

  private paintRod(ctx: CanvasRenderingContext2D, layout: Layout, palette: Palette): void {
    ctx.fillStyle = palette.rod;
    ctx.fillRect(layout.geometry.left, layout.rodTop, layout.geometry.span, layout.rodBottom - layout.rodTop);
  }

  private paintTicks(ctx: CanvasRenderingContext2D, layout: Layout, palette: Palette): void {
    const { geometry } = layout;
    ctx.font = MONO;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = 1;
    for (const value of geometry.tickValues()) {
      const x = geometry.toPixel(value);
      ctx.strokeStyle = palette.rule;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, layout.rodBottom);
      ctx.lineTo(Math.round(x) + 0.5, layout.rodBottom + 5);
      ctx.stroke();
      ctx.fillStyle = palette.faint;
      ctx.fillText(String(value), x, layout.rodBottom + 7);
    }
  }

  /** 反転モード：本物のアリ。押し分けて、めり込ませない。 */
  private paintRealAnts(ctx: CanvasRenderingContext2D, frame: Frame, layout: Layout, palette: Palette): void {
    const walking: AntState[] = [];
    for (let i = 0; i < frame.simulation.count; i++) {
      const state = frame.simulation.stateAt(i, frame.time);
      const color = palette.antColor(this.colorRank(frame, i, state.segment));
      if (state.isWalking) walking.push(state);
      else this.paintFalling(ctx, layout, state, color);
    }

    const separator = new RodSeparator(layout.bodyWidth);
    const drawn = separator.apply(walking.map((s) => s.position));
    walking.forEach((state, k) => {
      const color = palette.antColor(this.colorRank(frame, state.index, state.segment));
      const facing = this.facingOf(state.segment, frame.time, layout.bodyWidth);
      layout.sprite.draw(ctx, layout.geometry.toPixel(drawn[k]), layout.antBaseline, facing, color);
    });
  }

  /** すり抜けモード：ゴーストは直進し、互いを通り抜ける。 */
  private paintGhostAnts(ctx: CanvasRenderingContext2D, frame: Frame, layout: Layout, palette: Palette): void {
    for (const ghost of frame.simulation.ghosts) {
      const color = palette.antColor(frame.simulation.rankOf(ghost.index));
      if (ghost.hasFallenAt(frame.time)) {
        this.paintFallingAt(
          ctx,
          layout,
          ghost.direction < 0 ? 0 : frame.rodLength,
          ghost.direction,
          frame.time - ghost.fallTime,
          color,
        );
      } else {
        layout.sprite.draw(
          ctx,
          layout.geometry.toPixel(ghost.positionAt(frame.time)),
          layout.antBaseline,
          ghost.direction,
          color,
          0.75,
        );
      }
    }
  }

  /**
   * 反転した直後は、体をその場で回して見せる。
   * 押し分けによって描画位置が止まっている時間（体の長さの半分）にちょうど収まる。
   */
  private facingOf(segment: TrajectorySegment, time: number, bodyWidth: number): number {
    if (!segment.startsWithReversal) return segment.direction;
    const turn = Math.min(bodyWidth / 2, segment.duration);
    if (turn <= 0) return segment.direction;
    const progress = (time - segment.startTime) / turn;
    if (progress >= 1) return segment.direction;
    return segment.direction * (2 * progress - 1);
  }

  private colorRank(frame: Frame, index: number, segment: TrajectorySegment): number {
    return frame.isReverseMode ? frame.simulation.rankOf(index) : frame.simulation.ghostRankOf(segment);
  }

  private paintFalling(ctx: CanvasRenderingContext2D, layout: Layout, state: AntState, color: string): void {
    this.paintFallingAt(ctx, layout, state.position, state.direction, state.fallenFor ?? 0, color);
  }

  private paintFallingAt(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    position: number,
    direction: number,
    elapsed: number,
    color: string,
  ): void {
    if (elapsed < 0 || elapsed >= FALL_DURATION) return;
    const progress = elapsed / FALL_DURATION;
    const distance = Math.max(20, this.height - layout.rodBottom);
    const y = layout.rodBottom + 4 + distance * progress * progress;
    layout.sprite.draw(ctx, layout.geometry.toPixel(position), y, direction, color, 1 - progress);
  }
}
