import { dialog, shell, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const VIDEO_EXTS = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.wmv', '.m4v', '.ts', '.mpg', '.mpeg'];
const AUDIO_EXTS = ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a', '.wma', '.opus'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];

const allExts = [...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS];

const filters = [
  { name: 'Media Files', extensions: allExts.map(e => e.slice(1)) },
  { name: 'Video', extensions: VIDEO_EXTS.map(e => e.slice(1)) },
  { name: 'Audio', extensions: AUDIO_EXTS.map(e => e.slice(1)) },
  { name: 'Image', extensions: IMAGE_EXTS.map(e => e.slice(1)) },
  { name: 'All Files', extensions: ['*'] },
];

export interface MediaFile {
  id: string;
  name: string;
  path: string;
  size: number;
  ext: string;
}

export async function openFilesDialog(win: BrowserWindow): Promise<MediaFile[]> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters,
  });
  if (result.canceled || !result.filePaths.length) return [];

  return result.filePaths.map((fp, i) => {
    const stat = fs.statSync(fp);
    const ext = path.extname(fp).toLowerCase();
    return {
      id: `${Date.now()}-${i}`,
      name: path.basename(fp),
      path: fp,
      size: stat.size,
      ext,
    };
  });
}

export async function openSingleVideoDialog(win: BrowserWindow): Promise<MediaFile | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Video', extensions: VIDEO_EXTS.map(e => e.slice(1)) },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const fp = result.filePaths[0];
  const stat = fs.statSync(fp);
  return {
    id: `${Date.now()}-0`,
    name: path.basename(fp),
    path: fp,
    size: stat.size,
    ext: path.extname(fp).toLowerCase(),
  };
}

export async function openSingleSubtitleDialog(win: BrowserWindow): Promise<MediaFile | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Subtitle', extensions: ['srt', 'ass', 'ssa', 'vtt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const fp = result.filePaths[0];
  const stat = fs.statSync(fp);
  return {
    id: `${Date.now()}-0`,
    name: path.basename(fp),
    path: fp,
    size: stat.size,
    ext: path.extname(fp).toLowerCase(),
  };
}

export async function openSingleVideoOrAudioDialog(win: BrowserWindow): Promise<MediaFile | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Video / Audio', extensions: [...VIDEO_EXTS, ...AUDIO_EXTS].map(e => e.slice(1)) },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const fp = result.filePaths[0];
  const stat = fs.statSync(fp);
  return {
    id: `${Date.now()}-0`,
    name: path.basename(fp),
    path: fp,
    size: stat.size,
    ext: path.extname(fp).toLowerCase(),
  };
}

export async function openSingleImageDialog(win: BrowserWindow): Promise<MediaFile | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Image', extensions: IMAGE_EXTS.map(e => e.slice(1)) },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const fp = result.filePaths[0];
  const stat = fs.statSync(fp);
  return {
    id: `${Date.now()}-0`,
    name: path.basename(fp),
    path: fp,
    size: stat.size,
    ext: path.extname(fp).toLowerCase(),
  };
}

export async function saveAsDialog(win: BrowserWindow, defaultName: string): Promise<string | null> {
  const ext = path.extname(defaultName).slice(1) || 'mp4';
  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [
      { name: 'Output', extensions: [ext] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
}

export function revealInFolder(filePath: string): void {
  shell.showItemInFolder(filePath);
}

/**
 * Generate an output path next to the input file:
 *   /path/to/clip.mov  + opId "convert" + ext "mp4"  →  /path/to/clip_convert.mp4
 * Adds a numeric suffix if the target already exists to avoid clobbering.
 */
export function makeOutputPath(inputPath: string, opId: string, ext: string): string {
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  let candidate = path.join(dir, `${base}_${opId}.${ext}`);
  let i = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${base}_${opId}_${i}.${ext}`);
    i++;
  }
  return candidate;
}

/**
 * Create MediaFile objects from absolute file paths (used by drag-and-drop).
 */
export function filesFromPaths(paths: string[]): MediaFile[] {
  return paths.map((fp, i) => {
    const stat = fs.statSync(fp);
    const ext = path.extname(fp).toLowerCase();
    return {
      id: `${Date.now()}-${i}`,
      name: path.basename(fp),
      path: fp,
      size: stat.size,
      ext,
    };
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}
