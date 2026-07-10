export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n < 10) return n.toFixed(2);
  return n.toFixed(0);
}

/** Formats a real (level-multiplier-adjusted) growth cycle duration in
 *  minutes into a human string ("30sn", "3dk", "1sa 15dk") — always the
 *  actual current wait time, not the raw per-config `harvestMinutes`. */
export function formatCycleDuration(minutes: number): string {
  const totalSec = Math.max(0, Math.round(minutes * 60));
  if (totalSec < 60) return `${totalSec}sn`;
  const totalMin = Math.round(totalSec / 60);
  if (totalMin < 60) return `${totalMin}dk`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}sa${m > 0 ? ` ${m}dk` : ''}`;
}
