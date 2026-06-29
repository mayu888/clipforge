import { app, protocol } from 'electron';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { createMainWindow } from './main/window';
import { registerIpcHandlers } from './main/ipc/handlers';
import { checkFfmpegReady } from './main/ffmpeg/binary';

if (started) {
  app.quit();
}

// Register privileged scheme BEFORE app is ready so it supports streaming
// (range requests) — required for <video>/<audio> seeking.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true, bypassCSP: true },
  },
]);

const MIME: Record<string, string> = {
  mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime',
  webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo',
  ogg: 'video/ogg', ogv: 'video/ogg',
  mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', flac: 'audio/flac',
  m4a: 'audio/mp4', opus: 'audio/opus',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
};

function mimeFor(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return MIME[ext] || 'application/octet-stream';
}

app.whenReady().then(() => {
  // Serve local files via media://local/<absolute-path>. Manually honour HTTP
  // Range requests so <video>/<audio> can seek and reload reliably (a 200-only
  // handler breaks seeking and can leave a broken cached response).
  protocol.handle('media', async (request) => {
    const url = new URL(request.url);
    let filePath = decodeURIComponent(url.pathname);

    // Windows: url.pathname returns "/C:/..." → strip leading slash
    if (process.platform === 'win32' && /^\/[A-Za-z]:/.test(filePath)) {
      filePath = filePath.slice(1);
    }

    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch (err) {
      console.error('[media] stat failed:', filePath, err);
      return new Response('Not found', { status: 404 });
    }

    const total = stat.size;
    const mime = mimeFor(filePath);
    const range = request.headers.get('Range');

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match && match[1] ? parseInt(match[1], 10) : 0;
      const end = match && match[2] ? parseInt(match[2], 10) : total - 1;
      const safeEnd = Math.min(end, total - 1);
      const chunkSize = safeEnd - start + 1;

      const stream = fs.createReadStream(filePath, { start, end: safeEnd });
      return new Response(stream as any, {
        status: 206,
        headers: {
          'Content-Type': mime,
          'Content-Length': String(chunkSize),
          'Content-Range': `bytes ${start}-${safeEnd}/${total}`,
          'Accept-Ranges': 'bytes',
        },
      });
    }

    const stream = fs.createReadStream(filePath);
    return new Response(stream as any, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(total),
        'Accept-Ranges': 'bytes',
      },
    });
  });

  // Register IPC handlers before creating window
  registerIpcHandlers();

  // Check ffmpeg on startup
  const ffmpegStatus = checkFfmpegReady();
  console.log('[ClipForge] FFmpeg status:', ffmpegStatus);

  // Create the main window
  createMainWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  const { BrowserWindow } = require('electron');
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
