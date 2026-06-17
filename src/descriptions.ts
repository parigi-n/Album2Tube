import type { Album, Track } from './types.js';
import { cumulativeOffsets, formatTimestamp } from './timestamps.js';

// Description for the full-album video. The timestamp list doubles as
// YouTube chapters as long as the first entry is 00:00.
export function albumDescription(album: Album): string {
  const durations = album.tracks.map((t) => t.duration);
  const offsets = cumulativeOffsets(durations);
  const lines: string[] = [];
  album.tracks.forEach((t, i) => {
    lines.push(`${formatTimestamp(offsets[i])} ${t.title}`);
  });
  lines.push('', `Album: ${album.title}`, `Artist: ${album.artist}`);
  if (album.year) lines.push(`Year: ${album.year}`);
  return lines.join('\n') + '\n';
}

export function trackDescription(album: Album, track: Track, index: number, playlist?: string): string {
  const trackArtist = track.artist || album.artist;
  const trackNo = String(track.trackNo ?? index + 1).padStart(2, '0');
  const lines: string[] = [];
  lines.push(`From the album: ${album.title}`, '');
  lines.push(`Album: ${album.title}`, `Artist: ${trackArtist}`, `Track: ${trackNo}`);
  if (playlist) lines.push(`Playlist: ${playlist}`);
  return lines.join('\n') + '\n';
}
