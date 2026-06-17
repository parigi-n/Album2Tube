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

export function outDir(folderPath: string, mode: 'album' | 'tracks'): string {
  return path.join(folderPath, 'out', mode);
}
