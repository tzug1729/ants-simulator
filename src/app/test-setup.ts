import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom に無いものを最小限だけ用意する。
// 画面サイズは PC 相当（min-width クエリは満たす）として扱う。
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("min-width"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom の canvas は 2D コンテキストを持たない。CanvasView は null を許容する設計。
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"];

// 描画ループは止めておく（テストでは時計を明示的に動かす）
vi.stubGlobal("requestAnimationFrame", () => 0);
vi.stubGlobal("cancelAnimationFrame", () => {});

afterEach(() => cleanup());
