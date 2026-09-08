/**
 * Canvas ビューの土台。
 * 高 DPI 対応とリサイズ追従だけを引き受け、中身の描き方は派生クラスに任せる。
 */
export abstract class CanvasView<TModel> {
  protected context: CanvasRenderingContext2D | null = null;
  protected width = 0;
  protected height = 0;
  protected lastModel: TModel | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private observer: ResizeObserver | null = null;

  /** キャンバスに結び付ける。戻り値を呼ぶと解除される。 */
  attach(canvas: HTMLCanvasElement): () => void {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.observer = new ResizeObserver(() => this.fitToElement());
    this.observer.observe(canvas);
    this.fitToElement();
    return () => {
      this.observer?.disconnect();
      this.observer = null;
      this.canvas = null;
      this.context = null;
    };
  }

  render(model: TModel): void {
    const ctx = this.context;
    if (!ctx || this.width === 0 || this.height === 0) return;
    this.lastModel = model;
    ctx.clearRect(0, 0, this.width, this.height);
    this.paint(ctx, model);
  }

  protected abstract paint(ctx: CanvasRenderingContext2D, model: TModel): void;

  private fitToElement(): void {
    const canvas = this.canvas;
    const ctx = this.context;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
    this.width = rect.width;
    this.height = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (this.lastModel !== null) this.render(this.lastModel);
  }
}
