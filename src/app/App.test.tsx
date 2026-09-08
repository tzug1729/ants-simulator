import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "./App";

/** 「結果」欄の値を読む */
function statValue(label: string): string {
  const row = screen.getByText(label).closest(".stat");
  if (!row) throw new Error(`${label} の行が見つかりません`);
  const value = row.querySelector("dd");
  return value?.textContent ?? "";
}

function stepper(label: string): HTMLElement {
  const field = screen.getByText(label).closest(".field");
  if (!field) throw new Error(`${label} が見つかりません`);
  return field as HTMLElement;
}

describe("App", () => {
  it("初期表示で標準の例が計算されている", () => {
    render(<App />);
    expect(screen.getByText("棒の上のアリ")).toBeTruthy();
    expect(statValue("この向きでの全滅時刻")).toBe("12");
    expect(statValue("理論上の最短")).toBe("7");
    expect(statValue("理論上の最長")).toBe("12");
    expect(statValue("衝突回数")).toBe("6");
    expect(statValue("左 / 右に落ちた数")).toBe("3 / 3");
  });

  it("例題を選ぶと結果が入れ替わる", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "例1" }));
    expect(statValue("この向きでの全滅時刻")).toBe("8");
    expect(statValue("理論上の最短")).toBe("4");
    expect(statValue("理論上の最長")).toBe("8");

    fireEvent.click(screen.getByRole("button", { name: "例2" }));
    expect(statValue("理論上の最短")).toBe("38");
    expect(statValue("理論上の最長")).toBe("207");
  });

  it("アリの数を増減できる", () => {
    render(<App />);
    const field = stepper("アリの数 n");
    const input = within(field).getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("6");

    fireEvent.click(within(field).getByLabelText("アリの数 nを増やす"));
    expect(input.value).toBe("7");

    fireEvent.click(within(field).getByLabelText("アリの数 nを減らす"));
    fireEvent.click(within(field).getByLabelText("アリの数 nを減らす"));
    expect(input.value).toBe("5");

    // 直接入力しても反映される
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.blur(input);
    expect(input.value).toBe("12");
  });

  it("棒の長さを変えると理論値が変わる", () => {
    render(<App />);
    const field = stepper("棒の長さ L");
    const input = within(field).getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("14");

    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.blur(input);
    expect(input.value).toBe("20");
    // アリはそのまま（2..12）なので、いちばん遠い端までの距離は 18
    expect(statValue("理論上の最長")).toBe("18");
  });

  it("向きの一括操作で全滅時刻が理論値に一致する", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "最短" }));
    expect(statValue("この向きでの全滅時刻")).toBe(statValue("理論上の最短"));

    fireEvent.click(screen.getByRole("button", { name: "最長" }));
    expect(statValue("この向きでの全滅時刻")).toBe(statValue("理論上の最長"));
  });

  it("見せ方を切り替えられる", () => {
    render(<App />);
    const reverse = screen.getByRole("button", { name: "反転" });
    const passthrough = screen.getByRole("button", { name: "すり抜け" });
    expect(reverse.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(passthrough);
    expect(passthrough.getAttribute("aria-pressed")).toBe("true");
    expect(reverse.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText(/色の割り当てだけを交換/)).toBeTruthy();
  });

  it("解説を開閉できる", () => {
    render(<App />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "解説" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("再生・停止と速度の切り替えができる", () => {
    render(<App />);
    const play = screen.getByLabelText("一時停止"); // 初期状態は再生中
    fireEvent.click(play);
    expect(screen.getByLabelText("再生")).toBeTruthy();

    const speed = screen.getByRole("button", { name: "2×" });
    fireEvent.click(speed);
    expect(speed.getAttribute("aria-pressed")).toBe("true");
  });

  it("PC 幅では操作項目が一画面にすべて並ぶ（タブに隠れない）", () => {
    render(<App />);
    for (const title of ["配置", "向き", "例題", "結果"]) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});

describe("App（スマホ幅）", () => {
  const wide = window.matchMedia;

  function useNarrowScreen(): void {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false, // min-width も prefers-reduced-motion も満たさない
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

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", { writable: true, value: wide });
  });

  it("タブに畳まれるが、どの操作にも到達できる", () => {
    useNarrowScreen();
    render(<App />);

    expect(screen.getByRole("tablist")).toBeTruthy();
    // 既定は「配置」タブ
    expect(screen.getByText("アリの数 n")).toBeTruthy();
    expect(screen.getByText("棒の長さ L")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "向き" }));
    expect(screen.getByRole("button", { name: "最長" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "例題" }));
    expect(screen.getByRole("button", { name: "例1" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "結果" }));
    expect(statValue("この向きでの全滅時刻")).toBe("12");

    fireEvent.click(screen.getByRole("tab", { name: "配置" }));
    expect(screen.getByText("棒の長さ L")).toBeTruthy();
  });

  it("再生バーと見せ方の切り替えはタブの外に常に出ている", () => {
    useNarrowScreen();
    render(<App />);
    expect(screen.getByLabelText("時刻")).toBeTruthy();
    expect(screen.getByRole("button", { name: "反転" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "すり抜け" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "解説" })).toBeTruthy();
  });
});
