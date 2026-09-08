import { CanvasView } from "./CanvasView";
import { Frame } from "./Frame";
import { Palette } from "./Palette";
import { RodGeometry, niceStep } from "./RodGeometry";

const MONO = '10px "Cascadia Mono", Consolas, ui-monospace, "SF Mono", Menlo, monospace';

/**
 * 時空図（横 = 位置、縦↓ = 時間）。
 *
 * ここが仕掛けの中心。描く線の形は 2 つのモードでまったく同じで、
 * 変わるのは「どの線を同じ 1 匹と見なすか」＝色の割り当てだけ。
 * 反転ではジグザグに、すり抜けでは直線に見える。
 */
export class ChartView extends CanvasView<Frame> {
  private static readonly TOP = 14;
  private static readonly BOTTOM = 14;

  protected paint(ctx: CanvasRenderingContext2D, frame: Frame): void {
    if (frame.simulation.count === 0) return;
    const palette = Palette.current();
    const geometry = RodGeometry.forCanvas(this.width, frame.rodLength);
    const duration = Math.max(frame.simulation.totalTime, 1e-6);
    const top = ChartView.TOP;
    const bottom = this.height - ChartView.BOTTOM;
    const toY = (t: number) => top + (t / duration) * (bottom - top);

    this.paintGrid(ctx, palette, geometry, duration, top, bottom, toY);
    this.paintTrajectories(ctx, frame, palette, geometry, toY);
    this.paintPlayhead(ctx, frame, palette, geometry, toY);
  }

  private paintGrid(
    ctx: CanvasRenderingContext2D,
    palette: Palette,
    geometry: RodGeometry,
    duration: number,
    top: number,
    bottom: number,
    toY: (t: number) => number,
  ): void {
    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.grid;
    for (const value of geometry.tickValues()) {
      const x = Math.round(geometry.toPixel(value)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }

    ctx.font = MONO;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const step = niceStep(duration / 5);
    for (let t = 0; t <= duration + 1e-9; t += step) {
      const y = Math.round(toY(t)) + 0.5;
      ctx.strokeStyle = palette.grid;
      ctx.beginPath();
      ctx.moveTo(geometry.left, y);
      ctx.lineTo(geometry.right, y);
      ctx.stroke();
      ctx.fillStyle = palette.faint;
      ctx.fillText(String(Math.round(t * 100) / 100), geometry.left - 6, toY(t));
    }
  }

  private paintTrajectories(
    ctx: CanvasRenderingContext2D,
    frame: Frame,
    palette: Palette,
    geometry: RodGeometry,
    toY: (t: number) => number,
  ): void {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // 1 周目は全体を薄く（この先どうなるか）、2 周目は現在時刻までを濃く。
    for (const solid of [false, true]) {
      ctx.lineWidth = solid ? 2 : 1.2;
      for (const track of frame.simulation.tracks) {
        for (const segment of track.segments) {
          const endTime = solid ? Math.min(segment.endTime, frame.time) : segment.endTime;
          if (endTime <= segment.startTime + 1e-9) continue;
          const rank = frame.isReverseMode
            ? frame.simulation.rankOf(track.index)
            : frame.simulation.ghostRankOf(segment);
          ctx.strokeStyle = palette.antColor(rank, solid ? 0.95 : 0.16);
          ctx.beginPath();
          ctx.moveTo(geometry.toPixel(segment.startPosition), toY(segment.startTime));
          ctx.lineTo(geometry.toPixel(segment.positionAt(endTime)), toY(endTime));
          ctx.stroke();
        }
      }
    }
  }

  private paintPlayhead(
    ctx: CanvasRenderingContext2D,
    frame: Frame,
    palette: Palette,
    geometry: RodGeometry,
    toY: (t: number) => number,
  ): void {
    const y = toY(frame.time);
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(geometry.left, y);
    ctx.lineTo(geometry.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    for (const state of frame.simulation.walkingStates(frame.time)) {
      const rank = frame.isReverseMode
        ? frame.simulation.rankOf(state.index)
        : frame.simulation.ghostRankOf(state.segment);
      ctx.fillStyle = palette.antColor(rank);
      ctx.beginPath();
      ctx.arc(geometry.toPixel(state.position), y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = palette.surface;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
}
