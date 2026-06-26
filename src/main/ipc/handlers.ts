import { ipcMain, BrowserWindow } from 'electron';
import { checkFfmpegReady, getFfmpegPath } from '../ffmpeg/binary';
import { runFFmpeg } from '../ffmpeg/runner';
import { composeArgs, type ProcessRequest } from '../ffmpeg/build-args';
import { openFilesDialog, openSingleVideoDialog, openSingleVideoOrAudioDialog, openSingleSubtitleDialog, openSingleImageDialog, saveAsDialog, revealInFolder, makeOutputPath, filesFromPaths } from '../fs/files';

// Track running processes for cancellation
const runningJobs = new Map<string, { cancel: () => void }>();
let jobIdCounter = 0;

export function registerIpcHandlers(): void {
  // ─── FFmpeg status ───
  ipcMain.handle('ffmpeg:ready', () => {
    const result = checkFfmpegReady();
    if (result.ok) {
      try {
        return { ok: true, version: result.version, path: getFfmpegPath() };
      } catch {
        return { ok: true, version: result.version };
      }
    }
    return { ok: false, error: result.error };
  });

  // ─── File operations ───
  ipcMain.handle('file:open', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return [];
    return openFilesDialog(win);
  });

  ipcMain.handle('file:openSingleVideo', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    return openSingleVideoDialog(win);
  });

  ipcMain.handle('file:openSingleVideoOrAudio', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    return openSingleVideoOrAudioDialog(win);
  });

  ipcMain.handle('file:openSingleSubtitle', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    return openSingleSubtitleDialog(win);
  });

  ipcMain.handle('file:openSingleImage', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    return openSingleImageDialog(win);
  });

  ipcMain.handle('file:save', async (event, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    return saveAsDialog(win, defaultName);
  });

  ipcMain.on('file:reveal', (_event, filePath: string) => {
    revealInFolder(filePath);
  });

  // Create MediaFile objects from dragged file paths (renderer has no fs access).
  ipcMain.handle('file:fromPaths', (_event, paths: string[]) => {
    return filesFromPaths(paths);
  });

  // Compute an output path next to the input (no dialog) for quick processing.
  ipcMain.handle('file:outputPath', (_event, inputPath: string, opId: string, ext: string) => {
    return makeOutputPath(inputPath, opId, ext);
  });

  // ─── Process ───
  // Accepts a high-level ProcessRequest (operation + params); the main process
  // builds the ffmpeg args via composeArgs so the renderer never reimplements
  // the operation→args mapping.
  ipcMain.handle('process:start', async (event, req: ProcessRequest & { totalDurationSec?: number }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');

    const jobId = `job-${++jobIdCounter}`;
    const args = composeArgs(req);

    win.webContents.send('process:log', { jobId, line: `ffmpeg ${args.join(' ')}` });

    const { promise, cancel } = runFFmpeg(args, {
      totalDurationSec: req.totalDurationSec,
      onProgress: (pct, speed) => {
        win.webContents.send('process:progress', { jobId, pct, speed });
      },
      onLog: (line) => {
        win.webContents.send('process:log', { jobId, line });
      },
    });

    runningJobs.set(jobId, { cancel });

    // Run asynchronously; resolve immediately with jobId so the renderer can
    // track progress via events and cancel mid-flight.
    promise
      .then(() => {
        runningJobs.delete(jobId);
        win.webContents.send('process:status', { jobId, status: 'done', outputPath: req.outputPath });
      })
      .catch((err: any) => {
        runningJobs.delete(jobId);
        const cancelled = /cancelled/i.test(err?.message ?? '');
        win.webContents.send('process:status', {
          jobId,
          status: cancelled ? 'cancelled' : 'error',
          error: err.message,
        });
      });

    return { jobId };
  });

  ipcMain.handle('process:cancel', (_event, jobId: string) => {
    const job = runningJobs.get(jobId);
    if (job) {
      job.cancel();
      runningJobs.delete(jobId);
    }
  });

  // ─── Window controls ───
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
}
