const CODE = `int mn = 0, mx = 0;
for (int i = 0; i < n; i++) {
    mn = max(mn, min(x[i], L - x[i]));
    mx = max(mx, max(x[i], L - x[i]));
}`;

export function Explain({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="解説">
      <div className="overlay-head">
        <h2>解説</h2>
        <button type="button" className="btn" onClick={onClose}>
          閉じる
        </button>
      </div>

      <div className="overlay-body">
        <article className="note">
          <h3>反転は、名札の交換にすぎない</h3>
          <p>
            2 匹が反転する瞬間を、「この 2 匹が名札を交換して、そのまますれ違った」と読み替える。
            棒の上に見えている位置と向きの集合はまったく同じで、区別がつかない。
          </p>
          <p>
            モードを切り替えると、時空図の線は<b>1 本も動かない</b>まま、ジグザグが直線に変わる。
            変わったのは色 — つまり「どれを同じ 1 匹と見なすか」だけ。
          </p>
        </article>

        <article className="note">
          <h3>だから答えは O(n) で出る</h3>
          <p>
            すり抜けてよいなら、各アリは初期位置から向いている端までまっすぐ歩くだけ。
            落ちる時刻は左向きなら <code>x</code>、右向きなら <code>L−x</code>、全滅時刻はその最大値。
            向きが未知なら、それぞれ近い端／遠い端を選ばせればよい。
          </p>
          <pre className="code">{CODE}</pre>
        </article>

        <article className="note">
          <h3>ただし「どのアリが」は別の話</h3>
          <p>
            保たれているのは<b>位置の集合</b>であって、個体の対応ではない。
            「3 号がいつ、どちら側に落ちるか」を問われたら、この読み替えはそのままでは使えない。
          </p>
          <p>
            使えるのはアリが<b>互いを追い越せない</b>ことのほう。左から <i>k</i> 番目のアリは、
            常に「生き残っているすり抜けアリのうち左から <i>k</i> 番目」の位置にいる。
            この対応づけを一段挟めば、個体の運命も追える。
          </p>
        </article>

        <article className="note">
          <h3>この画面で何を計算しているか</h3>
          <p>
            公式は使っていない。次に何かが起きる時刻（端に着く／隣とぶつかる）まで一気に進める
            イベント駆動の計算で、衝突は<b>本当に反転</b>として処理している。
          </p>
          <p>
            ただし物理はアリを<b>点</b>として扱うので、そのまま描くと衝突の瞬間に 2 匹が重なってしまう。
            そこで描画位置だけを体の長さぶん押し分け、頭が触れたところで止まって見えるようにしている。
            答えの数値は点のままの計算から出ているので、教科書の値と一致する。
          </p>
        </article>
      </div>
    </div>
  );
}
