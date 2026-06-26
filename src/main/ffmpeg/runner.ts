import { spawn } from 'node:child_process';
import { getFfmpegPath } from './binary';

export interface RunOptions {
  totalDurationSec?: number;
  onProgress?: (pct: number, speed?: string, timeMs?: number) => void;
  onLog?: (line: string) => void;
}

export function runFFmpeg(
  args: string[],
  opts: RunOptions = {},
): { promise: Promise<void>; cancel: () => void } {
  const ffmpegPath = getFfmpegPath();

  // Use -progress for structured output, -nostats to suppress default progress
  const fullArgs = ['-y', '-progress', 'pipe:1', '-nostats', ...args];

  const child = spawn(ffmpegPath, fullArgs, {
    windowsHide: true,
  });

  let killed = false;

  const promise = new Promise<void>((resolve, reject) => {
    let stderrBuf = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      // Parse -progress output: key=value lines
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('out_time_ms=')) {
          const timeUs = parseInt(trimmed.split('=')[1], 10);
          const timeMs = timeUs / 1000;
          const pct = opts.totalDurationSec
            ? Math.min(100, Math.round((timeMs / (opts.totalDurationSec * 1000)) * 100))
            : 0;
          opts.onProgress?.(pct, undefined, timeMs);
        } else if (trimmed.startsWith('speed=')) {
          const speed = trimmed.split('=')[1]?.trim();
          opts.onProgress?.(undefined as any, speed);
        }
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrBuf += text;
      // Forward meaningful lines to log
      const lines = text.split('\n').filter(l => l.trim());
      for (const line of lines) {
        opts.onLog?.(line.trim());
      }
    });

    child.on('close', (code) => {
      if (killed) {
        reject(new Error('Process cancelled'));
        return;
      }
      if (code === 0) {
        opts.onProgress?.(100);
        resolve();
      } else {
        const tail = stderrBuf.split('\n').slice(-5).join('\n');
        reject(new Error(`ffmpeg exited with code ${code}\n${tail}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });

  return {
    promise,
    cancel: () => {
      killed = true;
      child.kill('SIGKILL');
    },
  };
}
