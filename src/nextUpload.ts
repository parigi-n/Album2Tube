import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import fs from 'fs-extra';
import clipboard from 'clipboardy';

const STUDIO_URL = 'https://studio.youtube.com/';
const UPLOADED_FLAG = '.uploaded';

// Walk tracksDir, find the first track folder without an .uploaded marker,
// copy its description to the clipboard, print the upload URL and file path,
// then wait for the user to confirm before touching the .uploaded marker.
export async function nextUpload(tracksDir: string): Promise<void> {
  if (!(await fs.pathExists(tracksDir))) {
    throw new Error(`Tracks directory not found: ${tracksDir}`);
  }

  // Sorted lexicographically — matches the "NN-slug" naming so order = track order.
  const entries = (await fs.readdir(tracksDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  if (entries.length === 0) {
    throw new Error(`No track directories in: ${tracksDir}`);
  }

  const total = entries.length;
  let done = 0;
  let nextIdx = -1;
  for (let i = 0; i < entries.length; i++) {
    const flag = path.join(tracksDir, entries[i], UPLOADED_FLAG);
    if (await fs.pathExists(flag)) done++;
    else if (nextIdx === -1) nextIdx = i;
  }

  if (nextIdx === -1) {
    console.log(`All ${total} tracks already uploaded.`);
    return;
  }

  const dir = path.join(tracksDir, entries[nextIdx]);
  const files = await fs.readdir(dir);
  const mp4 = files.find((f) => f.toLowerCase().endsWith('.mp4'));
  if (!mp4) throw new Error(`No .mp4 found in ${dir}`);

  const descPath = path.join(dir, 'description.txt');
  const description = await fs.readFile(descPath, 'utf8');
  // Use the sync variant: clipboardy's async write hangs on Bun + Wayland
  // (wl-copy's daemonization doesn't release stdio piped by execa).
  clipboard.writeSync(description);

  console.log('');
  console.log(`Next: [${done + 1}/${total}] ${path.basename(mp4, '.mp4')}`);
  console.log(`Folder: ${dir}`);
  console.log(`File:   ${mp4}`);
  console.log('Description copied to clipboard.');
  console.log(`Upload at: ${STUDIO_URL}`);
  console.log('');

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question('Press Enter once uploaded, or `s` + Enter to skip: '))
    .trim()
    .toLowerCase();
  rl.close();

  if (answer === 's') {
    console.log(`Skipped. ${done}/${total} marked uploaded.`);
    return;
  }

  await fs.writeFile(path.join(dir, UPLOADED_FLAG), '');
  const newDone = done + 1;
  console.log(`Marked uploaded. ${newDone}/${total} done.`);
  if (newDone < total) {
    console.log(`Run \`album2tube next ${tracksDir}\` for the next track.`);
  } else {
    console.log('All tracks uploaded.');
  }
}
