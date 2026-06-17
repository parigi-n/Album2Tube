#!/usr/bin/env node
import { Command } from 'commander';
import { scanAlbum } from './scanAlbum.js';
import { renderAlbumVideo } from './renderAlbumVideo.js';
import { renderTrackVideos } from './renderTrackVideo.js';

const program = new Command();
program.name('album2video').description('Turn an album folder into YouTube-ready videos');

program
  .command('album')
  .description('Render the whole album as one concatenated video')
  .argument('<folder>', 'album folder')
  .action(async (folder: string) => {
    const album = await scanAlbum(folder);
    await renderAlbumVideo(album);
  });

program
  .command('tracks')
  .description('Render one video per track')
  .argument('<folder>', 'album folder')
  .option('--playlist <name>', 'playlist name to include in descriptions')
  .action(async (folder: string, opts: { playlist?: string }) => {
    const album = await scanAlbum(folder);
    await renderTrackVideos(album, { playlist: opts.playlist });
  });

program.parseAsync().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
