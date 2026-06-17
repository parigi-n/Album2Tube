import path from 'node:path';
import fs from 'fs-extra';
import { parseFile } from 'music-metadata';
import { COVER_NAMES } from './paths.js';

// Look for a cover image file in the album folder; if none, extract the
// embedded picture from the first track and cache it next to the audio.
export async function findCover(folderPath: string, firstTrackPath: string): Promise<string> {
  for (const name of COVER_NAMES) {
    const p = path.join(folderPath, name);
    if (await fs.pathExists(p)) return p;
  }
  const meta = await parseFile(firstTrackPath);
  const pic = meta.common.picture?.[0];
  if (!pic) {
    throw new Error(`No cover image found in ${folderPath} and no embedded picture in ${path.basename(firstTrackPath)}`);
  }
  // Pick a sensible extension from the MIME type so ffmpeg picks the right demuxer.
  const ext = pic.format.includes('png') ? '.png' : '.jpg';
  const cachePath = path.join(folderPath, `.embedded-cover${ext}`);
  await fs.writeFile(cachePath, pic.data);
  return cachePath;
}
