import { useEffect, useState } from 'react';

export function usePresence(open: boolean) {
  const [wasOpen, setWasOpen] = useState(open);
  const [present, setPresent] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setPresent(true);
  }
  useEffect(() => {
    if (open || !present) return;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    const timer = window.setTimeout(() => setPresent(false), delay);
    return () => window.clearTimeout(timer);
  }, [open, present]);
  return { present: open || present, closing: !open };
}
