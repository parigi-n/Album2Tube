import path from 'node:path';
import fs from 'fs-extra';
import type { Album } from './types.js';
import { outDir } from './paths.js';
import { renderAlbumVideo as renderAlbumMp4 } from './ffmpeg.js';
import { albumDescription } from './descriptions.js';
import { cumulativeOffsets, formatTimestamp } from './timestamps.js';

// Render the whole album as one MP4 with chaptered description + metadata
// under out/album/. Removes the temp workdir on success.
export async function renderAlbumVideo(album: Album): Promise<void> {
  const dir = outDir(album.folderPath, 'album');
  const workDir = path.join(dir, '.work');
  await fs.ensureDir(dir);

  const videoPath = path.join(dir, 'video.mp4');
  const descPath = path.join(dir, 'description.txt');
  const metaPath = path.join(dir, 'metadata.json');

  console.log(`Rendering album: ${album.title} (${album.tracks.length} tracks)`);
  await renderAlbumMp4(album.coverPath, album.tracks, workDir, videoPath);
  await fs.writeFile(descPath, albumDescription(album));

  const offsets = cumulativeOffsets(album.tracks.map((t) => t.duration));
  await fs.writeJson(metaPath, {
    mode: 'album',
    album: album.title,
    artist: album.artist,
    year: album.year,
    tracks: album.tracks.map((t, i) => ({
      trackNo: t.trackNo ?? i + 1,
      title: t.title,
      duration: t.duration,
      offset: offsets[i],
      offsetTimestamp: formatTimestamp(offsets[i]),
    })),
  }, { spaces: 2 });

  await fs.remove(workDir);
}
