import path from 'node:path';
import fs from 'fs-extra';
import type { Album, Track } from './types.js';
import { AUDIO_EXTS } from './paths.js';
import { readTrack } from './readMetadata.js';
import { findCover } from './findCover.js';

// Order by disc + track number when both tracks expose them. Otherwise
// return 0 so the stable sort preserves the prior filename order.
function compareTracks(a: Track, b: Track): number {
  if (a.trackNo == null || b.trackNo == null) return 0;
  const disc = (a.discNo ?? 1) - (b.discNo ?? 1);
  return disc !== 0 ? disc : a.trackNo - b.trackNo;
}

// Scan a folder: collect audio files, read their metadata, sort them, then
// derive album-level fields (title/artist/year) from the first track with
// a folder-name fallback.
export async function scanAlbum(folderPath: string): Promise<Album> {
  const abs = path.resolve(folderPath);
  const stat = await fs.stat(abs);
  if (!stat.isDirectory()) throw new Error(`Not a directory: ${abs}`);

  const entries = await fs.readdir(abs);
  const audioFiles = entries
    .filter((f) => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map((f) => path.join(abs, f));

  if (audioFiles.length === 0) throw new Error(`No audio files found in ${abs}`);

  const tracks: Track[] = [];
  for (const f of audioFiles) tracks.push(await readTrack(f));
  tracks.sort(compareTracks);

  const first = tracks[0];
  return {
    folderPath: abs,
    title: first.album || path.basename(abs),
    artist: first.albumArtist || first.artist || 'Unknown Artist',
    year: first.year ? String(first.year) : undefined,
    coverPath: await findCover(abs, first.filePath),
    tracks,
  };
}
