import path from 'node:path';
import slugify from '@sindresorhus/slugify';

export const AUDIO_EXTS = new Set([
  '.mp3', '.m4a', '.aac', '.flac', '.ogg', '.opus', '.wav',
]);

export const COVER_NAMES = [
  'cover.jpg', 'cover.jpeg', 'cover.png',
  'folder.jpg', 'folder.jpeg', 'folder.png',
  'front.jpg', 'front.jpeg', 'front.png',
];

export function trackDirName(num: number, title: string): string {
  return `${String(num).padStart(2, '0')}-${slugify(title)}`;
}

// Sanitize a track title for use as a real filename. Keeps spaces and case so
// YouTube Studio's "title = filename" auto-fill produces a clean track title.
// Strips chars that are illegal on Windows/macOS, collapses whitespace, and
// trims trailing dots/spaces (Windows refuses those).
export function fsSafeFilename(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
}

export function outDir(folderPath: string, mode: 'album' | 'tracks'): string {
  return path.join(folderPath, 'out', mode);
}
