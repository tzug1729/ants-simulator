import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

/** 数値入力。打ち終わってから（Enter か focus 離脱で）反映する。 */
function NumberField({
  value,
  min,
  max,
  id,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  id: string;
  onCommit: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const parsed = Number(text);
    if (Number.isFinite(parsed)) onCommit(Math.max(min, Math.min(max, Math.round(parsed))));
    else setText(String(value));
  };

  return (
    <input
      id={id}
      className="stepper-input"
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        commit();
        (event.target as HTMLInputElement).blur();
      }}
    />
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="stepper">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`${label}を減らす`}
        >
          −
        </button>
        <NumberField id={id} value={value} min={min} max={max} onCommit={onChange} />
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`${label}を増やす`}
        >
          ＋
        </button>
      </div>
    </div>
  );
}

export interface Option<T> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className="segmented-btn"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <div className="button-row">{children}</div>;
}

export function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="btn" onClick={onClick}>
      {children}
    </button>
  );
}

export function Tabs({ tabs }: { tabs: readonly { id: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  return (
    <div className="tabs">
      <div className="tab-strip" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab.id === current?.id}
            onClick={() => setActive(tab.id)}
          >
            {tab.id}
          </button>
        ))}
      </div>
      <div className="tab-body" role="tabpanel">
        {current?.content}
      </div>
    </div>
  );
}
