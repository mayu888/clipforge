import { BrowserWindow, shell, globalShortcut } from 'electron';
import path from 'node:path';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;

export function createMainWindow(): BrowserWindow {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    // macOS: keep native frame with hidden title bar → traffic lights visible
    // Windows/Linux: fully frameless → we draw our own controls
    frame: isMac ? true : false,
    titleBarStyle: isMac ? 'hiddenInset' : undefined,
    backgroundColor: '#1a1a1c',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // DevTools shortcuts in development (no menu → no default accelerators)
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    globalShortcut.register('F12', () => mainWindow?.webContents.toggleDevTools());
    globalShortcut.register('CommandOrControl+Shift+I', () =>
      mainWindow?.webContents.toggleDevTools(),
    );

    mainWindow.on('closed', () => {
      globalShortcut.unregister('F12');
      globalShortcut.unregister('CommandOrControl+Shift+I');
    });
  }

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
