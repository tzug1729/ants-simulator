import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { PlaybackClock } from "./PlaybackClock";

/** メディアクエリの成否を購読する */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** 時計の値をひとつだけ購読する。値が変わったコンポーネントだけが再描画される。 */
export function useClockValue<T>(clock: PlaybackClock, read: () => T): T {
  return useSyncExternalStore(clock.subscribe, read, read);
}

/** キーボード操作 */
export function useKeyboardShortcuts(handlers: Record<string, () => void>): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const key = event.code === "Space" ? "Space" : event.key;
      const handler = handlers[key];
      if (!handler) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}

/** 初回だけ値を作る（クラスのインスタンス用） */
export function useInstance<T>(factory: () => T): T {
  const [instance] = useState(factory);
  return instance;
}
