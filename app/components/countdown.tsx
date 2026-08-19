import { splitDuration } from "~/lib/prayer";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ ms }: { ms: number }) {
  const { hours, minutes, seconds } = splitDuration(ms);
  return (
    <span className="font-sans text-2xl font-semibold tabular-nums sm:text-4xl">
      {hours > 0 && (
        <>
          {pad(hours)}
          <span className="px-0.5 text-ink-subtle">:</span>
        </>
      )}
      {pad(minutes)}
      <span className="px-0.5 text-ink-subtle">:</span>
      {pad(seconds)}
    </span>
  );
}
