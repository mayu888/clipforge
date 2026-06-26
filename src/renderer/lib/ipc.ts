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

declare global {
  interface Window {
    api: Api;
  }
}

export const api: Api = window.api;
