# album2tube

Turn an album folder into YouTube-ready videos. Point it at a directory of
audio files plus a cover image, get back MP4s with descriptions and metadata.

## Requirements

- Node 18+
- `ffmpeg` and `ffprobe` on PATH

## Install

```
npm install
npm run build
```

The CLI lives at `dist/cli.js`.

## Usage

Two modes.

**One video per track:**

```
node dist/cli.js tracks ./path/to/album --playlist "Some Playlist Name"
```

Produces:

```
album/out/tracks/
  01-first-track/
    video.mp4
    description.txt
    metadata.json
  02-second-track/
    ...
```

`--playlist` is optional. When set, it's added to each track's description.

**One concatenated video for the whole album:**

```
node dist/cli.js album ./path/to/album
```

Produces:

```
album/out/album/
  video.mp4
  description.txt
  metadata.json
```

The description includes a chapter list with cumulative timestamps starting
at `00:00`, which YouTube auto-detects as chapters once you paste it into the
video description on upload.

## Album folder layout

```
my-album/
  cover.jpg          # or cover.jpeg / cover.png / folder.* / front.*
  01 - Intro.flac
  02 - Track.mp3
  03 - Outro.ogg
```

If no cover image is found in the folder, the embedded cover from the first
track is extracted and used.

Supported audio: `.mp3`, `.m4a`, `.aac`, `.flac`, `.ogg`, `.opus`, `.wav`.

Tracks are ordered by disc + track number when present in the tags, otherwise
by filename (natural sort).

## Audio handling

| Source format        | What happens                            |
|----------------------|-----------------------------------------|
| MP3, AAC, M4A        | Stream-copied into MP4. No re-encode.   |
| OGG, Opus, FLAC, WAV | Re-encoded to ALAC (lossless) in MP4.   |

ALAC keeps things bit-exact instead of adding a lossy generation on top of
whatever YouTube re-encodes after upload.

In `album` mode, all tracks go through the concat filter and are merged into
a single ALAC stream regardless of source format — this is necessary because
MP4 only allows one audio codec per file.

## Video

Cover scaled to 1080 on its longest side, native aspect kept (no padding).
H.264, CRF 30, 2 fps (still image), `+faststart` for fast YouTube ingest.

A square cover will play back square on YouTube. The player adds its own
side bars on the 16:9 frame — there's no way around that without baking a
filler (e.g. blurred background) into the video itself.

## Output

Each output directory contains:

- `video.mp4`
- `description.txt` — paste into the YouTube description field
- `metadata.json` — machine-readable summary (track list, durations, offsets)
