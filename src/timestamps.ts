// YouTube chapter format: MM:SS or HH:MM:SS. First chapter in a description
// must be 00:00 for YouTube to recognize the list as chapters.
export function formatTimestamp(seconds: number): string {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Running sum: each entry is the start time of track i (so the first is 0).
export function cumulativeOffsets(durations: number[]): number[] {
  const offsets: number[] = [];
  let acc = 0;
  for (const d of durations) {
    offsets.push(acc);
    acc += d;
  }
  return offsets;
}
