import { useEffect, useState } from "react";

/**
 * A `Date` that refreshes on an interval. Starts from a caller-supplied instant
 * so the first client render is deterministic, then ticks after mount.
 */
export function useNow(intervalMs = 1000, initial: Date = new Date()) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
