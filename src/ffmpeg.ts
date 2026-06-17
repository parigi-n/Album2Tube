import path from 'node:path';
import fs from 'fs-extra';
import { execa } from 'execa';
import cliProgress from 'cli-progress';
import type { Track } from './types.js';

// Scale cover so its longest side is 1080 (keeps aspect, no padding).
// Round both dimensions to an even number — libx264 with yuv420p requires it.
const VIDEO_FILTER =
  "scale='if(gt(iw,ih),1080,-2)':'if(gt(iw,ih),-2,1080)',format=yuv420p";

// 2 fps + tune=stillimage + GOP=120: still cover, so encoding stays cheap
// while keyframes every minute keep seeking responsive on YouTube.
const VIDEO_ARGS = [
  '-c:v', 'libx264',
  '-profile:v', 'high',
  '-preset', 'slow',
  '-tune', 'stillimage',
  '-crf', '30',
  '-r', '2',
  '-g', '120',
];

// ALAC is lossless: bit-exact storage of the source's decoded PCM. Used
// for sources that can't be muxed into MP4 as-is (Vorbis, Opus, FLAC, WAV)
// so we don't add a lossy generation on top of whatever YouTube re-encodes.
// No bitrate/sample-rate/channel coercion — keep the source's native shape.
const LOSSLESS_AUDIO_ARGS = ['-c:a', 'alac'];

// Can we mux the track's audio into MP4 without re-encoding? MP3 and AAC
// fit MP4 natively; FLAC/Vorbis/Opus/WAV need a transcode.
const COPYABLE_EXTS = new Set(['.mp3', '.m4a', '.aac']);
export function canCopyAudio(track: Track): boolean {
  return COPYABLE_EXTS.has(path.extname(track.filePath).toLowerCase());
}

// Run ffmpeg silently with a progress bar. Reads `-progress pipe:1` (machine-
// readable key=value stream) on stdout to advance the bar; buffers stderr and
// replays the tail only on failure. Pass totalSec = -1 to skip the bar.
async function runFfmpeg(args: string[], totalSec: number, label: string): Promise<void> {
  const showBar = totalSec > 0;
  const bar = showBar
    ? new cliProgress.SingleBar(
        { format: `${label} [{bar}] {percentage}% {value}s/{total}s`, hideCursor: true },
        cliProgress.Presets.shades_classic,
      )
    : null;
  bar?.start(Math.round(totalSec), 0);

  const proc = execa('ffmpeg', [...args, '-progress', 'pipe:1', '-nostats'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    reject: false,
  });
  const stderrTail: string[] = [];
  proc.stderr!.on('data', (chunk: Buffer) => {
    // Keep only the last ~50 lines of stderr to replay on failure.
    stderrTail.push(chunk.toString());
    if (stderrTail.length > 200) stderrTail.splice(0, stderrTail.length - 200);
  });
  proc.stdout!.on('data', (chunk: Buffer) => {
    const m = /out_time_us=(\d+)/.exec(chunk.toString());
    if (m && bar) bar.update(Math.min(Math.round(totalSec), Math.round(Number(m[1]) / 1e6)));
  });

  const result = await proc;
  bar?.update(Math.round(totalSec));
  bar?.stop();
  if (result.exitCode !== 0) {
    process.stderr.write(stderrTail.join(''));
    throw new Error(`ffmpeg failed (exit ${result.exitCode}) — ${label}`);
  }
}

// Loop the cover image as a video, mux in the track audio, stop when the
// audio ends (`-shortest`), and move the moov atom up front (`+faststart`)
// so YouTube can start playback before the upload is fully read.
export async function renderTrackVideo(
  coverPath: string,
  track: Track,
  outPath: string,
  label: string,
): Promise<void> {
  const audioArgs = canCopyAudio(track) ? ['-c:a', 'copy'] : LOSSLESS_AUDIO_ARGS;
  await runFfmpeg(
    [
      '-y',
      '-loop', '1', '-framerate', '2', '-i', coverPath,
      '-i', track.filePath,
      '-vf', VIDEO_FILTER,
      ...VIDEO_ARGS,
      ...audioArgs,
      '-shortest',
      '-movflags', '+faststart',
      outPath,
    ],
    track.duration,
    label,
  );
}

// Two-pass build to keep the final ffmpeg invocation simple: use the concat
// *filter* (not the concat demuxer) to merge tracks into one ALAC file, then
// loop the cover against that merged audio. The concat filter decodes each
// input independently and joins PCM frames, so it tolerates differing sample
// rates / channel layouts between sources — the concat demuxer does not and
// silently corrupts later tracks when stream params mismatch.
export async function renderAlbumVideo(
  coverPath: string,
  tracks: Track[],
  workDir: string,
  outPath: string,
): Promise<void> {
  await fs.ensureDir(workDir);

  const totalSec = tracks.reduce((acc, t) => acc + t.duration, 0);
  const inputArgs = tracks.flatMap((t) => ['-i', t.filePath]);
  const concatInputs = tracks.map((_, i) => `[${i}:a]`).join('');
  const filter = `${concatInputs}concat=n=${tracks.length}:v=0:a=1[a]`;

  const mergedAudio = path.join(workDir, 'album.m4a');
  await runFfmpeg(
    [
      '-y',
      ...inputArgs,
      '-filter_complex', filter,
      '-map', '[a]',
      ...LOSSLESS_AUDIO_ARGS,
      mergedAudio,
    ],
    totalSec,
    'merging audio',
  );

  await runFfmpeg(
    [
      '-y',
      '-loop', '1', '-framerate', '2', '-i', coverPath,
      '-i', mergedAudio,
      '-vf', VIDEO_FILTER,
      ...VIDEO_ARGS,
      '-c:a', 'copy',
      '-shortest',
      '-movflags', '+faststart',
      outPath,
    ],
    totalSec,
    'rendering video',
  );
}
