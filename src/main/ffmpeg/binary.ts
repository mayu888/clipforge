import { app } from 'electron';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const platDir = `${process.platform}-${process.arch}`;
const exe = process.platform === 'win32' ? '.exe' : '';

/**
 * Resolve ffmpeg binary path — works in both dev and packaged modes.
 * Dev:  src/main/ffmpeg/<platform>-<arch>/ffmpeg
 * Prod: resources/ffmpeg/<platform>-<arch>/ffmpeg
 */
export function getFfmpegPath(): string {
  // Packaged: extraResource copies src/main/ffmpeg → resources/ffmpeg/
  const packagedPath = path.join(process.resourcesPath, 'ffmpeg', platDir, `ffmpeg${exe}`);
  if (fs.existsSync(packagedPath)) return packagedPath;

  // Dev mode: resolve relative to app path
  const devPath = path.join(app.getAppPath(), 'src', 'main', 'ffmpeg', platDir, `ffmpeg${exe}`);
  if (fs.existsSync(devPath)) return devPath;

  // Fallback: relative to __dirname (after vite build, asar-unpacked)
  const fallbackPath = path.join(__dirname, '..', 'main', 'ffmpeg', platDir, `ffmpeg${exe}`);
  if (fs.existsSync(fallbackPath)) return fallbackPath;

  throw new Error(`ffmpeg binary not found for ${platDir}. Searched:\n  ${packagedPath}\n  ${devPath}\n  ${fallbackPath}`);
}

/**
 * Run ffmpeg -version to check if the binary works.
 */
export function checkFfmpegReady(): { ok: boolean; version?: string; error?: string } {
  try {
    const ffmpegPath = getFfmpegPath();
    const output = execFileSync(ffmpegPath, ['-version'], {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const firstLine = output.split('\n')[0];
    return { ok: true, version: firstLine };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
