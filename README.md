# 棒の上のアリ (POJ 1852 — Ants)

長さ L の棒の上を n 匹のアリが毎秒 1cm で歩き、出会うと反転し、端で落ちる。
その様子を**本当に反転させて**動かし、「反転＝すり抜け」の読み替えを時空図で見せる。

[Visit Site](https://tzug1729.github.io/ants-simulator/)

## 構成

```
src/
  domain/    問題そのもの。ブラウザに依存しない。
    Ant            アリ 1 匹（位置と向き）
    Scenario       棒の長さ + 初期配置。すべての変更は新しい実体を返す
    Simulator      イベント駆動の実行器。衝突を本当に反転として処理する
    Simulation     結果。時刻を渡すとその瞬間の様子を返す
    AntTrack / TrajectorySegment / GhostTrack / Collision
    RodSeparator   描画用に、体の長さぶん押し分ける（等調回帰 / PAVA）
  render/    Canvas 描画。domain を読むだけで書き換えない。
    CanvasView     高 DPI 対応とリサイズ追従の土台（抽象クラス）
    SceneView      棒の上の実演
    ChartView      時空図
    RodGeometry    2 つの図で横軸を揃えるための座標変換
    Palette / AntSprite / Frame
  app/       React。状態の持ち回りと入力だけを担当する。
    PlaybackClock  再生位置。React の外で進み、購読者に通知する
    AnimationLoop  requestAnimationFrame の包み
    components/    App, Stage, Transport, ControlPanel, Explain, ui
```
