# album2tube

Turn an album folder into YouTube-ready videos. Point it at a directory of
audio files plus a cover image, get back MP4s with descriptions and metadata.

## Install

### From a release binary

Download the binary for your platform from the [Releases](../../releases) page.

**Linux / macOS** — install ffmpeg first via your package manager:

```
sudo apt install ffmpeg      # Debian/Ubuntu
sudo dnf install ffmpeg      # Fedora
sudo pacman -S ffmpeg        # Arch
brew install ffmpeg          # macOS
```

Then run `./album2tube-<platform>`.

**Windows** — download the zip. It contains `album2tube.exe`, `ffmpeg.exe`,
and `ffprobe.exe` side by side. Extract everything into the same folder and
run `album2tube.exe` from a terminal. No separate install needed.

### From source

```
bun install
bun src/cli.ts --help
```

Requires Bun 1.x and ffmpeg on PATH.

## Usage

Two modes.

**One video per track:**

```
album2tube tracks ./path/to/album --playlist "Some Playlist Name"
```

Produces:

```
album/out/tracks/
  01-first-track/
    First Track.mp4
    description.txt
    metadata.json
  02-second-track/
    ...
```

The MP4 is named after the track title so YouTube Studio pre-fills the title
field from the filename — one less thing to retype.

`--playlist` is optional. When set, it's added to each track's description.

### Uploading tracks one at a time

Uploading 50+ tracks manually is tedious. To make it less so:

```
album2tube next ./path/to/album/out/tracks
```

This picks the next track that hasn't been uploaded yet, copies its
`description.txt` to your clipboard, and prints the file path. Drag the MP4
into YouTube Studio, paste the description, hit publish, come back to the
terminal and press Enter — it touches a `.uploaded` marker in the folder so
the next run skips to the following track. Run again to keep going.

**One concatenated video for the whole album:**

```
album2tube album ./path/to/album
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

- The MP4 video — named `video.mp4` in album mode, `<Track Title>.mp4` in tracks mode
- `description.txt` — paste into the YouTube description field
- `metadata.json` — machine-readable summary (track list, durations, offsets)

In tracks mode, an empty `.uploaded` file is dropped into a track folder once
you confirm an upload via `album2tube next` — delete it to re-queue that
track.
