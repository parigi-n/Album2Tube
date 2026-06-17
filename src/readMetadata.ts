import path from 'node:path';
import { parseFile } from 'music-metadata';
import type { Track } from './types.js';

// Read tags + format info for one audio file. `duration: true` forces a full
// scan, required for Vorbis/Ogg which don't store duration in a header.
export async function readTrack(filePath: string): Promise<Track> {
  const { common, format } = await parseFile(filePath, { duration: true });
  const fileName = path.basename(filePath);
  return {
    filePath,
    fileName,
    title: common.title?.trim() || fileName.replace(/\.[^.]+$/, ''),
    artist: common.artist?.trim(),
    album: common.album?.trim(),
    albumArtist: common.albumartist?.trim(),
    trackNo: common.track?.no ?? undefined,
    discNo: common.disk?.no ?? undefined,
    year: common.year ?? undefined,
    duration: format.duration ?? 0,
  };
}
