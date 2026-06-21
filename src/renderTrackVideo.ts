import path from 'node:path';
import fs from 'fs-extra';
import type { Album, RenderOptions } from './types.js';
import { fsSafeFilename, outDir, trackDirName } from './paths.js';
import { renderTrackVideo } from './ffmpeg.js';
import { trackDescription } from './descriptions.js';

// Render one MP4 + description + metadata per track under out/tracks/NN-slug/.
export async function renderTrackVideos(album: Album, opts: RenderOptions): Promise<void> {
  const base = outDir(album.folderPath, 'tracks');
  await fs.ensureDir(base);

  for (let i = 0; i < album.tracks.length; i++) {
    const track = album.tracks[i];
    const trackNo = track.trackNo ?? i + 1;
    const dir = path.join(base, trackDirName(trackNo, track.title));
    await fs.ensureDir(dir);

    // Filename = track title so YouTube Studio prefills the upload's title.
    const videoName = `${fsSafeFilename(track.title)}.mp4`;
    const videoPath = path.join(dir, videoName);
    const descPath = path.join(dir, 'description.txt');
    const metaPath = path.join(dir, 'metadata.json');

    const label = `[${i + 1}/${album.tracks.length}] ${track.title}`;
    await renderTrackVideo(album.coverPath, track, videoPath, label);
    await fs.writeFile(descPath, trackDescription(album, track, i, opts.playlist));
    await fs.writeJson(metaPath, {
      mode: 'track',
      album: album.title,
      artist: track.artist || album.artist,
      title: track.title,
      trackNo,
      duration: track.duration,
      playlist: opts.playlist,
      source: path.basename(track.filePath),
    }, { spaces: 2 });
  }

  console.log('');
  console.log(`Done. ${album.tracks.length} videos written to:`);
  console.log(`  ${base}`);
  console.log('Each track folder contains:');
  console.log('  <Track Title>.mp4 — upload to YouTube (filename prefills the title)');
  console.log('  description.txt   — paste into the description field');
  console.log('  metadata.json     — machine-readable summary');
  console.log('');
  console.log(`Tip: run \`album2tube next ${base}\` to upload one track at a time.`);
}
