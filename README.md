# 棒の上のアリ (POJ 1852 — Ants)

長さ L の棒の上を n 匹のアリが毎秒 1cm で歩き、出会うと反転し、端で落ちる。
その様子を**本当に反転させて**動かし、「反転＝すり抜け」の読み替えを時空図で見せる。

## 使い方

```
npm install
npm run dev      # 開発サーバ
npm run test     # ドメイン層 + UI のテスト
npm run build    # dist/index.html（単一 HTML）と dist/artifact.html を生成
```

`npm run build` の出力 `dist/index.html` は外部リソースを一切参照しないので、
そのままブラウザで開ける。

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

計算とアニメーションは React の再描画を経由しない。
`PlaybackClock` が毎フレーム進み、Canvas は直接描き直す。
React が再描画するのは、操作で配置が変わったときと、時刻表示などの小さな部品だけ。

## 設計上の要点

**物理はアリを点として扱う。** これが競技プログラミングの問題そのもので、
全滅時刻・理論上の最短/最長は教科書の値と一致する。

**そのまま描くと衝突の瞬間に 2 匹が完全に重なる**ので、`RodSeparator` が描画位置だけを
体の長さぶん押し分ける。制約付き最小二乗を等調回帰（PAVA）で解いているため、
離れたアリは動かず、ぶつかった 2 匹はちょうど接する位置で止まり、
3 匹以上の数珠つなぎも塊ごとに正しく展開される。答えの数値には影響しない。

**時空図の線の形は、2 つのモードでまったく同じ。** 変わるのは色の割り当て
（＝どの線を同じ 1 匹と見なすか）だけで、それがジグザグと直線を分けている。
