import { Scenario } from "../../domain/Scenario";
import { PRESETS } from "../presets";
import { ActionButton, ButtonRow, Section, Stepper, Tabs } from "./ui";
import type { ReactNode } from "react";
import type { Simulation } from "../../domain/Simulation";

interface Props {
  scenario: Scenario;
  simulation: Simulation;
  compact: boolean;
  onChange: (scenario: Scenario) => void;
}

function format(value: number): string {
  return Math.abs(value - Math.round(value)) < 1e-9 ? String(Math.round(value)) : value.toFixed(2);
}

function Placement({ scenario, onChange }: Pick<Props, "scenario" | "onChange">) {
  return (
    <Section title="配置">
      <Stepper
        label="アリの数 n"
        value={scenario.count}
        min={0}
        max={Scenario.MAX_ANTS}
        onChange={(n) => onChange(scenario.withCount(n))}
      />
      <Stepper
        label="棒の長さ L"
        value={scenario.rodLength}
        min={Scenario.MIN_ROD}
        max={Scenario.MAX_ROD}
        onChange={(length) => onChange(scenario.withRodLength(length))}
      />
      <ButtonRow>
        <ActionButton onClick={() => onChange(scenario.randomized())}>ランダム配置</ActionButton>
      </ButtonRow>
      <p className="hint">棒をタップで追加／アリをタップで反転／ドラッグで移動</p>
    </Section>
  );
}

function Directions({ scenario, onChange }: Pick<Props, "scenario" | "onChange">) {
  return (
    <Section title="向き">
      <ButtonRow>
        <ActionButton onClick={() => onChange(scenario.facingNearEnds())}>最短</ActionButton>
        <ActionButton onClick={() => onChange(scenario.facingFarEnds())}>最長</ActionButton>
        <ActionButton onClick={() => onChange(scenario.allReversed())}>全反転</ActionButton>
        <ActionButton onClick={() => onChange(scenario.withRandomDirections())}>ランダム</ActionButton>
      </ButtonRow>
    </Section>
  );
}

function Presets({ onChange }: Pick<Props, "onChange">) {
  return (
    <Section title="例題">
      <ButtonRow>
        {PRESETS.map((preset) => (
          <ActionButton key={preset.name} onClick={() => onChange(preset.scenario)}>
            {preset.name}
          </ActionButton>
        ))}
      </ButtonRow>
    </Section>
  );
}

function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd className={strong ? "stat-key" : undefined}>{value}</dd>
    </div>
  );
}

function Results({ scenario, simulation }: Pick<Props, "scenario" | "simulation">) {
  const counts = simulation.fallCounts();
  return (
    <Section title="結果">
      <dl className="stats">
        <Row label="この向きでの全滅時刻" value={format(simulation.totalTime)} strong />
        <Row label="理論上の最短" value={format(scenario.shortestTime)} />
        <Row label="理論上の最長" value={format(scenario.longestTime)} />
        <Row label="衝突回数" value={simulation.collisions.length} />
        <Row label="左 / 右に落ちた数" value={`${counts.left} / ${counts.right}`} />
      </dl>
    </Section>
  );
}

export function ControlPanel({ scenario, simulation, compact, onChange }: Props) {
  if (compact) {
    return (
      <Tabs
        tabs={[
          { id: "配置", content: <Placement scenario={scenario} onChange={onChange} /> },
          { id: "向き", content: <Directions scenario={scenario} onChange={onChange} /> },
          { id: "例題", content: <Presets onChange={onChange} /> },
          { id: "結果", content: <Results scenario={scenario} simulation={simulation} /> },
        ]}
      />
    );
  }

  return (
    <div className="side-stack">
      <Placement scenario={scenario} onChange={onChange} />
      <Directions scenario={scenario} onChange={onChange} />
      <Presets onChange={onChange} />
      <Results scenario={scenario} simulation={simulation} />
    </div>
  );
}
