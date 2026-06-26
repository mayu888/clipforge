import { contextBridge, ipcRenderer } from 'electron';

export interface MediaFile {
  id: string;
  name: string;
  path: string;
  size: number;
  ext: string;
}

export interface OpEntry {
  type: string;
  params: Record<string, any>;
}

export interface ProcessRequest {
  inputPath: string;
  outputPath: string;
  trim?: { start: number; end: number };
  outputFormat: string;
  op?: OpEntry;
  stack?: OpEntry[];
  extraInputs?: { logo?: string; audio?: string; clip2?: string; subs?: string };
  totalDurationSec?: number;
}

export type JobStatus = 'done' | 'error' | 'cancelled';

export interface Api {
  ffmpegReady(): Promise<{ ok: boolean; version?: string; path?: string; error?: string }>;
  openFiles(): Promise<MediaFile[]>;
  openSingleVideo(): Promise<MediaFile | null>;
  openSingleVideoOrAudio(): Promise<MediaFile | null>;
  openSingleSubtitle(): Promise<MediaFile | null>;
  openSingleImage(): Promise<MediaFile | null>;
  saveAs(defaultName: string): Promise<string | null>;
  revealInFolder(filePath: string): void;
  addDroppedFiles(paths: string[]): Promise<MediaFile[]>;
  outputPath(inputPath: string, opId: string, ext: string): Promise<string>;
  processStart(req: ProcessRequest): Promise<{ jobId: string }>;
  processCancel(jobId: string): void;
  onProgress(cb: (e: { jobId: string; pct: number; speed?: string }) => void): () => void;
  onLog(cb: (e: { jobId: string; line: string }) => void): () => void;
  onJobStatus(cb: (e: { jobId: string; status: JobStatus; outputPath?: string; error?: string }) => void): () => void;
  windowMinimize(): void;
  windowMaximize(): void;
  windowClose(): void;
}

const api: Api = {
  ffmpegReady: () => ipcRenderer.invoke('ffmpeg:ready'),
  openFiles: () => ipcRenderer.invoke('file:open'),
  openSingleVideo: () => ipcRenderer.invoke('file:openSingleVideo'),
  openSingleVideoOrAudio: () => ipcRenderer.invoke('file:openSingleVideoOrAudio'),
  openSingleSubtitle: () => ipcRenderer.invoke('file:openSingleSubtitle'),
  openSingleImage: () => ipcRenderer.invoke('file:openSingleImage'),
  saveAs: (name) => ipcRenderer.invoke('file:save', name),
  revealInFolder: (path) => ipcRenderer.send('file:reveal', path),
  addDroppedFiles: (paths) => ipcRenderer.invoke('file:fromPaths', paths),
  outputPath: (inputPath, opId, ext) => ipcRenderer.invoke('file:outputPath', inputPath, opId, ext),
  processStart: (req) => ipcRenderer.invoke('process:start', req),
  processCancel: (jobId) => ipcRenderer.invoke('process:cancel', jobId),
  onProgress: (cb) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on('process:progress', handler);
    return () => ipcRenderer.removeListener('process:progress', handler);
  },
  onLog: (cb) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on('process:log', handler);
    return () => ipcRenderer.removeListener('process:log', handler);
  },
  onJobStatus: (cb) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on('process:status', handler);
    return () => ipcRenderer.removeListener('process:status', handler);
  },
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('api', api);
