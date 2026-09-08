import { useClockValue } from "../hooks";
import { SegmentedControl } from "./ui";
import type { CSSProperties } from "react";
import type { PlaybackClock } from "../PlaybackClock";

const SPEEDS = [
  { value: 0.25, label: "¼×" },
  { value: 0.5, label: "½×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
  { value: 4, label: "4×" },
] as const;

export function Transport({ clock }: { clock: PlaybackClock }) {
  const time = useClockValue(clock, clock.readTime);
  const playing = useClockValue(clock, clock.readPlaying);
  const speed = useClockValue(clock, clock.readSpeed);
  const looping = useClockValue(clock, clock.readLooping);
  const duration = useClockValue(clock, clock.readDuration);
  const progress = duration > 0 ? time / duration : 0;

  return (
    <div className="transport">
      <button
        type="button"
        className="play"
        onClick={() => clock.toggle()}
        aria-label={playing ? "一時停止" : "再生"}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <div className="time">
        <span className="time-now">{time.toFixed(2)}</span>
        <span className="time-sep">/</span>
        <span>{duration.toFixed(2)}</span>
      </div>

      <input
        className="scrub"
        type="range"
        min={0}
        max={1000}
        step={1}
        value={Math.round(progress * 1000)}
        style={{ "--fill": `${progress * 100}%` } as CSSProperties}
        onChange={(event) => clock.seekProgress(Number(event.target.value) / 1000)}
        aria-label="時刻"
      />

      <SegmentedControl
        label="再生速度"
        options={SPEEDS}
        value={speed}
        onChange={(value) => clock.setSpeed(value)}
      />

      <label className="checkbox">
        <input
          type="checkbox"
          checked={looping}
          onChange={(event) => clock.setLooping(event.target.checked)}
        />
        ループ
      </label>
    </div>
  );
}
