import { useEffect } from 'react';
import { api, type ProcessRequest } from './ipc';
import { useMediaStore } from '../store/mediaStore';
import { useOpStore } from '../store/opStore';
import { useModeStore } from '../store/modeStore';
import { useStackStore } from '../store/stackStore';
import { useTrimStore } from '../store/trimStore';
import { useProcessStore } from '../store/processStore';
import { useRenderStore } from '../store/renderStore';
import { useLogStore } from '../store/logStore';
import { OPERATIONS } from './op-schema';

/**
 * Determine the output file extension for a given operation + params.
 * Most ops keep the input extension; format-changing ops override it.
 */
function outputExtFor(opId: string, params: Record<string, any>, inputExt: string): string {
  const clean = inputExt.replace(/^\./, '').toLowerCase();
  switch (opId) {
    case 'convert':
      return (params.format as string) || 'mp4';
    case 'gif':
      return 'gif';
    case 'extractaudio':
      return (params.format as string) || 'mp3';
    case 'thumbnail':
      return 'png';
    default:
      return clean || 'mp4';
  }
}

/** Build params merged with schema defaults so omitted fields still work. */
function paramsWithDefaults(opId: string, params: Record<string, any>): Record<string, any> {
  const def = OPERATIONS.find((o) => o.id === opId);
  const merged: Record<string, any> = {};
  if (def) {
    for (const p of def.params) {
      if (p.default !== undefined) merged[p.key] = p.default;
    }
  }
  return { ...merged, ...params };
}

/**
 * Assemble a ProcessRequest from the current store state and kick off ffmpeg.
 * Returns the jobId, or null if preconditions aren't met.
 */
export async function runProcess(): Promise<string | null> {
  const { files, selectedFileId } = useMediaStore.getState();
  const { selectedOpId, params } = useOpStore.getState();
  const { mode } = useModeStore.getState();
  const { stack } = useStackStore.getState();
  const proc = useProcessStore.getState();
  const log = useLogStore.getState();
  const render = useRenderStore.getState();

  const file = files.find((f) => f.id === selectedFileId);
  if (!file) {
    log.addLog('请先选择一个文件', 'warn');
    return null;
  }

  // Determine operation(s) and output extension
  let outExt: string;
  const req: Partial<ProcessRequest> = {
    inputPath: file.path,
    outputFormat: '',
  };

  if (mode === 'stack') {
    if (stack.length === 0) {
      log.addLog('操作栈为空，请先添加操作', 'warn');
      return null;
    }
    req.stack = stack.map((item) => ({
      type: item.opId,
      params: paramsWithDefaults(item.opId, item.params),
    }));
    // Stack keeps input ext (filters only)
    outExt = file.ext.replace(/^\./, '').toLowerCase() || 'mp4';
  } else {
    if (!selectedOpId) {
      log.addLog('请先选择一个操作', 'warn');
      return null;
    }
    const merged = paramsWithDefaults(selectedOpId, params);
    req.op = { type: selectedOpId, params: merged };
    outExt = outputExtFor(selectedOpId, merged, file.ext);

    // Pass second input file for multi-input operations (sxs, pip, overlay, etc.)
    const opsNeedingClip2 = ['sxs', 'pip', 'concat', 'mixaudio'];
    if (opsNeedingClip2.includes(selectedOpId)) {
      if (!merged.clip2Path) {
        log.addLog('请先选择第二个输入文件', 'warn');
        return null;
      }
      req.extraInputs = { clip2: merged.clip2Path };
    }
    if (selectedOpId === 'overlay') {
      if (!merged.logoPath) {
        log.addLog('请先选择 Logo 图片', 'warn');
        return null;
      }
      req.extraInputs = { logo: merged.logoPath };
    }
    if (selectedOpId === 'subtitles') {
      if (!merged.subsPath) {
        log.addLog('请先选择字幕文件', 'warn');
        return null;
      }
      req.extraInputs = { subs: merged.subsPath };
    }
  }

  req.outputFormat = outExt;
  req.outputPath = await api.outputPath(file.path, mode === 'stack' ? 'stack' : (selectedOpId || 'out'), outExt);

  // Provide total duration so the main process can compute progress %.
  const duration = useMediaStore.getState().durations[file.id];
  if (duration) req.totalDurationSec = duration;

  // Apply trim if the user narrowed the range (skip for image-output ops).
  const trim = useTrimStore.getState().ranges[file.id];
  const isImageOut = outExt === 'png' || outExt === 'jpg' || outExt === 'jpeg' || outExt === 'webp';
  if (trim && duration && !isImageOut) {
    const narrowed = trim.start > 0.05 || trim.end < duration - 0.05;
    if (narrowed) {
      req.trim = { start: trim.start, end: trim.end };
      // Progress is measured against the trimmed span.
      req.totalDurationSec = Math.max(0.1, trim.end - trim.start);
    }
  }

  // Track in render queue
  const opLabel = mode === 'stack' ? 'Stack' : (selectedOpId || '');
  render.addTask({
    id: 'pending',
    fileName: `${file.name} → ${opLabel}`,
    status: 'processing',
    progress: 0,
  });

  log.addLog(`开始处理: ${file.name}`, 'info');

  const { jobId } = await api.processStart(req as ProcessRequest);
  proc.startJob(jobId);

  // Re-key the render task to the real jobId
  render.updateTask('pending', { id: jobId });

  return jobId;
}

/** Cancel the currently running job. */
export function cancelProcess(): void {
  const { jobId } = useProcessStore.getState();
  if (jobId) {
    api.processCancel(jobId);
    useLogStore.getState().addLog('已请求取消处理', 'warn');
  }
}

/**
 * Hook that wires main→renderer process events into the stores.
 * Mount once at the app root.
 */
export function useProcessEvents(): void {
  useEffect(() => {
    const offProgress = api.onProgress(({ jobId, pct, speed }) => {
      const proc = useProcessStore.getState();
      if (proc.jobId !== jobId) return;
      proc.setProgress(pct, speed);
      useRenderStore.getState().updateTask(jobId, {
        progress: typeof pct === 'number' && !isNaN(pct) ? pct : undefined as any,
        speed,
      });
    });

    const offLog = api.onLog(({ line }) => {
      const level = /error|invalid|failed|no such/i.test(line) ? 'error' : 'info';
      useLogStore.getState().addLog(line, level as any);
    });

    const offStatus = api.onJobStatus(({ jobId, status, outputPath, error }) => {
      const proc = useProcessStore.getState();
      if (proc.jobId !== jobId) return;
      const render = useRenderStore.getState();
      const log = useLogStore.getState();

      if (status === 'done' && outputPath) {
        proc.finishJob(outputPath);
        render.updateTask(jobId, { status: 'done', progress: 100, outputPath });
        log.addLog(`处理完成: ${outputPath}`, 'success');
      } else if (status === 'cancelled') {
        proc.cancelJob();
        render.updateTask(jobId, { status: 'cancelled' });
        log.addLog('处理已取消', 'warn');
      } else {
        proc.failJob(error || '未知错误');
        render.updateTask(jobId, { status: 'error', error });
        log.addLog(`处理失败: ${error}`, 'error');
      }
    });

    return () => {
      offProgress();
      offLog();
      offStatus();
    };
  }, []);
}
