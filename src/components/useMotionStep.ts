import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

/** Complete the outgoing frame before changing content; ignore overlapping gestures. */
export function useMotionStep<T extends HTMLElement = HTMLDivElement>(distance = 24) {
  const ref = useRef<T>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  const animation = useRef<Animation | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; animation.current?.cancel(); };
  }, []);

  const run = useCallback(async (change: () => void, direction = 1) => {
    if (locked.current || !mounted.current) return;
    locked.current = true;
    setBusy(true);
    const frame = (opacity: number, offset: number): Keyframe => distance
      ? { opacity, transform: `translateX(${offset}px)` }
      : { opacity };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      const outgoing = ref.current;
      if (!reduced && outgoing?.animate) {
        animation.current = outgoing.animate([frame(1, 0), frame(0, -distance * direction)], { duration: 110, easing: 'ease-in', fill: 'forwards' });
        await animation.current.finished;
      }
      if (!mounted.current) return;
      flushSync(change);
      animation.current?.cancel();
      const incoming = ref.current;
      if (!reduced && incoming?.animate) {
        animation.current = incoming.animate([frame(0, distance * direction), frame(1, 0)], { duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)' });
        await animation.current.finished;
      }
    } catch (error) {
      // Unmounting cancels the animation's finished promise.
      if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
    } finally {
      animation.current?.cancel();
      animation.current = null;
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [distance]);

  return { ref, run, busy };
}
