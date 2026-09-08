/**
 * CSS カスタムプロパティから配色を読み出す。
 * Canvas は CSS 変数を解釈しないので、描画前にここで実体の色に変換しておく。
 */
export class Palette {
  private static cached: Palette | null = null;

  /** アリの識別色。初期位置の順（左→右）に割り当てる。 */
  private static readonly HUES = [4, 30, 48, 92, 152, 186, 212, 254, 292, 328];

  private constructor(
    private readonly tokens: Record<string, string>,
    readonly isDark: boolean,
  ) {}

  static current(): Palette {
    if (Palette.cached) return Palette.cached;
    const style = getComputedStyle(document.documentElement);
    const read = (name: string) => style.getPropertyValue(name).trim();
    const tokens: Record<string, string> = {};
    for (const key of ["text", "dim", "faint", "rule", "grid", "accent", "surface", "rod"]) {
      tokens[key] = read(`--c-${key}`);
    }
    Palette.cached = new Palette(tokens, read("--is-dark") === "1");
    return Palette.cached;
  }

  static invalidate(): void {
    Palette.cached = null;
  }

  /** テーマが変わったらキャッシュを捨てる。戻り値は購読解除。 */
  static observe(): () => void {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => Palette.invalidate();
    media.addEventListener("change", onChange);
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    return () => {
      media.removeEventListener("change", onChange);
      observer.disconnect();
    };
  }

  get text(): string {
    return this.tokens.text;
  }
  get dim(): string {
    return this.tokens.dim;
  }
  get faint(): string {
    return this.tokens.faint;
  }
  get rule(): string {
    return this.tokens.rule;
  }
  get grid(): string {
    return this.tokens.grid;
  }
  get accent(): string {
    return this.tokens.accent;
  }
  get surface(): string {
    return this.tokens.surface;
  }
  get rod(): string {
    return this.tokens.rod;
  }

  antColor(rank: number, alpha?: number): string {
    const hues = Palette.HUES;
    const hue = hues[((rank % hues.length) + hues.length) % hues.length];
    const saturation = this.isDark ? 55 : 58;
    const lightness = this.isDark ? 63 : 38;
    const base = `${hue} ${saturation}% ${lightness}%`;
    return alpha === undefined ? `hsl(${base})` : `hsl(${base} / ${alpha})`;
  }
}
