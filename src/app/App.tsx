import { useEffect, useMemo, useState } from "react";
import { Simulator } from "../domain/Simulator";
import { ControlPanel } from "./components/ControlPanel";
import { Explain } from "./components/Explain";
import { Stage } from "./components/Stage";
import { Transport } from "./components/Transport";
import { SegmentedControl } from "./components/ui";
import { PlaybackClock } from "./PlaybackClock";
import { PRESETS } from "./presets";
import { useInstance, useKeyboardShortcuts, useMediaQuery } from "./hooks";
import type { Scenario } from "../domain/Scenario";
import type { ViewMode } from "../render/Frame";

const MODES = [
  { value: "reverse" as ViewMode, label: "反転" },
  { value: "passthrough" as ViewMode, label: "すり抜け" },
];

const MODE_NOTE: Record<ViewMode, string> = {
  reverse: "頭が触れたところで止まり、その場で向きを変える。",
  passthrough: "線は 1 本も動かない。色の割り当てだけを交換した。",
};

export function App() {
  const [scenario, setScenario] = useState<Scenario>(() => PRESETS[0].scenario);
  const [mode, setMode] = useState<ViewMode>("reverse");
  const [showExplain, setShowExplain] = useState(false);

  const clock = useInstance(() => new PlaybackClock());
  const simulation = useMemo(() => Simulator.run(scenario), [scenario]);

  const isWide = useMediaQuery("(min-width: 920px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // 配置が変われば軌跡も変わるので、先頭へ戻す（再生中かどうかは保つ）
  useEffect(() => {
    clock.setDuration(simulation.totalTime, true);
  }, [clock, simulation]);

  useEffect(() => {
    if (!prefersReducedMotion) clock.play();
  }, [clock, prefersReducedMotion]);

  const shortcuts = useMemo(
    () => ({
      Space: () => clock.toggle(),
      ArrowRight: () => clock.nudge(0.25),
      ArrowLeft: () => clock.nudge(-0.25),
      r: () => clock.reset(),
      R: () => clock.reset(),
    }),
    [clock],
  );
  useKeyboardShortcuts(shortcuts);

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          棒の上のアリ <span className="topbar-sub">POJ 1852 — Ants</span>
        </h1>
        <button type="button" className="btn" onClick={() => setShowExplain((open) => !open)}>
          解説
        </button>
      </header>

      <main className="stage">
        <Stage
          scenario={scenario}
          simulation={simulation}
          mode={mode}
          clock={clock}
          onScenarioChange={setScenario}
        />
        <Transport clock={clock} />
        <div className="modebar">
          <SegmentedControl label="見せ方" options={MODES} value={mode} onChange={setMode} />
          <p className="mode-note">{MODE_NOTE[mode]}</p>
        </div>
      </main>

      <aside className="side">
        <ControlPanel
          scenario={scenario}
          simulation={simulation}
          compact={!isWide}
          onChange={setScenario}
        />
      </aside>

      {showExplain && <Explain onClose={() => setShowExplain(false)} />}
    </div>
  );
}
