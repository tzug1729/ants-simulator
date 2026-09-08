import { useEffect, useRef } from "react";
import { AnimationLoop } from "../AnimationLoop";
import { ChartView } from "../../render/ChartView";
import { Frame } from "../../render/Frame";
import { Palette } from "../../render/Palette";
import { SceneView } from "../../render/SceneView";
import type { PlaybackClock } from "../PlaybackClock";
import type { Scenario } from "../../domain/Scenario";
import type { Simulation } from "../../domain/Simulation";
import type { ViewMode } from "../../render/Frame";
import type { PointerEvent as ReactPointerEvent } from "react";

interface StageProps {
  scenario: Scenario;
  simulation: Simulation;
  mode: ViewMode;
  clock: PlaybackClock;
  onScenarioChange: (scenario: Scenario) => void;
}

interface Drag {
  index: number;
  moved: boolean;
  wasPlaying: boolean;
}

/**
 * 2 つの Canvas を持ち、毎フレーム描き直す。
 * 時計が進むのも描画も React の再描画を経由しないので、状態更新は操作時だけになる。
 */
export function Stage({ scenario, simulation, mode, clock, onScenarioChange }: StageProps) {
  const sceneCanvas = useRef<HTMLCanvasElement>(null);
  const chartCanvas = useRef<HTMLCanvasElement>(null);
  const sceneView = useRef<SceneView | null>(null);
  const drag = useRef<Drag | null>(null);

  // 描画ループから最新の値を読むための受け渡し口
  const model = useRef({ simulation, mode });
  model.current = { simulation, mode };

  useEffect(() => {
    const scene = sceneCanvas.current;
    const chart = chartCanvas.current;
    if (!scene || !chart) return;

    const sceneRenderer = new SceneView();
    const chartRenderer = new ChartView();
    sceneView.current = sceneRenderer;

    const detachScene = sceneRenderer.attach(scene);
    const detachChart = chartRenderer.attach(chart);
    const unwatchTheme = Palette.observe();

    const loop = new AnimationLoop((delta, now) => {
      clock.advance(delta, now);
      const frame = new Frame(model.current.simulation, clock.time, model.current.mode);
      sceneRenderer.render(frame);
      chartRenderer.render(frame);
    });
    loop.start();

    return () => {
      loop.stop();
      detachScene();
      detachChart();
      unwatchTheme();
      sceneView.current = null;
    };
  }, [clock]);

  const localPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const view = sceneView.current;
    if (!view) return;
    const { x, y } = localPoint(event);
    const index = view.antAt(x, y, new Frame(simulation, clock.time, mode));

    if (index >= 0) {
      event.currentTarget.setPointerCapture(event.pointerId);
      const wasPlaying = clock.readPlaying();
      clock.seek(0); // 動かすのは初期配置なので先頭へ戻す
      drag.current = { index, moved: false, wasPlaying };
    } else if (view.isInteractive(y)) {
      onScenarioChange(scenario.addedAt(view.positionAt(x)));
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const current = drag.current;
    const view = sceneView.current;
    if (!current || !view) return;
    const next = scenario.movedAt(current.index, view.positionAt(localPoint(event).x));
    if (next === scenario) return;
    current.moved = true;
    onScenarioChange(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (!current.moved) onScenarioChange(scenario.reversedAt(current.index));
    if (current.wasPlaying) clock.play();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <>
      <div className="canvas-box scene-box">
        <canvas
          ref={sceneCanvas}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
      <div className="canvas-box chart-box">
        <canvas ref={chartCanvas} />
      </div>
    </>
  );
}
