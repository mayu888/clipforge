import { useMediaStore } from '../../store/mediaStore';
import { useModeStore } from '../../store/modeStore';
import { useProcessStore } from '../../store/processStore';
import { useTrimStore } from '../../store/trimStore';
import { useT } from '../../lib/i18n';
import { Upload, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import TrimTrack from './TrimTrack';
import { dc } from '../../lib/devClass';
import { useOpStore } from '../../store/opStore';
import { useStackStore } from '../../store/stackStore';
import { buildPreviewOps } from '../../lib/previewOps';
import { drawPreview } from '../../lib/previewRenderer';
import { api } from '../../lib/ipc';
// import RegionOverlay from './RegionOverlay'; // delogo 功能暂时隐藏

/** Build a media:// URL for a local absolute path. */
function mediaUrl(p: string): string {
  // 规范化路径：Windows 反斜杠 → 正斜杠
  const normalized = p.replace(/\\/g, '/');
  return `media://local${normalized.split('/').map(encodeURIComponent).join('/')}`;
}

export default function PreviewCanvas() {
  const { selectedFileId, files, setDuration, durations, addFiles, removeFile } = useMediaStore();
  const { mode } = useModeStore();
  const { phase, progress, speed, outputPath, reset: resetProcess } = useProcessStore();
  const { ranges, setRange, clearRange } = useTrimStore();
  const { selectedOpId, params } = useOpStore(); // updateParam 暂时不需要（delogo 隐藏）
  const { stack } = useStackStore();
  const t = useT();
  const [showOutput, setShowOutput] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [outputDuration, setOutputDuration] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const selectedFile = files.find(f => f.id === selectedFileId);

  // Click to open files from the empty preview area.
  const handleOpenClick = useCallback(async () => {
    const result = await api.openFiles();
    if (result.length) addFiles(result);
  }, [addFiles]);

  // Drag-and-drop handlers.
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  }, [dragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear when leaving the outermost container.
    if (e.currentTarget === e.target) setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    // In Electron, dataTransfer.files has a `path` property for native file drops.
    const droppedFiles = Array.from(e.dataTransfer.files);
    const paths = droppedFiles.map(f => (f as any).path).filter(Boolean);
    if (!paths.length) return;
    const mediaFiles = await api.addDroppedFiles(paths);
    addFiles(mediaFiles);
  }, [addFiles]);

  // Remove current file and clear any output.
  const handleRemoveFile = useCallback(() => {
    if (selectedFileId) {
      removeFile(selectedFileId);
      resetProcess();
    }
  }, [selectedFileId, removeFile, resetProcess]);

  // When a job is done, show the output by default (with a toggle back to input).
  // Computed before the early return so all hooks below run unconditionally.
  const hasOutput = phase === 'done' && !!outputPath;
  const viewingOutput = hasOutput && showOutput;

  // Geometry op chain for the current selection/stack (rotate/crop/pad only).
  // Empty when previewing output, since output is already the finished frame.
  const previewOps = viewingOutput
    ? []
    : buildPreviewOps(mode, selectedOpId, params, stack);
  const hasPreview = previewOps.length > 0;

  // Draw the preview canvas: continuously while playing, once otherwise.
  useEffect(() => {
    if (!hasPreview) return;
    const canvas = previewCanvasRef.current;
    const container = previewContainerRef.current;
    const video = videoRef.current;
    if (!canvas || !container || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const render = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      drawPreview(ctx, video, previewOps, { width: rect.width, height: rect.height });
    };

    render(); // immediate draw (covers paused + param/seek changes)

    if (playing) {
      const loop = () => { render(); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(raf);
    // Re-run when the chain changes, playhead moves while paused, or play state flips.
  }, [hasPreview, playing, playhead, JSON.stringify(previewOps)]);

  if (!selectedFile) {
    return (
      <div
        className={`${dc('PreviewCanvasEmpty')} h-full bg-[#111113] flex flex-col items-center justify-center`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          onClick={handleOpenClick}
          className={`border-2 border-dashed rounded-panel p-10 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/60 hover:bg-white/5'
          }`}
        >
          <Upload size={36} className="mx-auto text-muted mb-3" strokeWidth={1.2} />
          <p className="text-sm text-muted font-medium">{t('preview.empty.title')}</p>
          <p className="text-xxs text-muted/60 mt-1">{t('preview.empty.subtitle')}</p>
        </div>
      </div>
    );
  }

  const path = viewingOutput ? outputPath! : selectedFile.path;
  const ext = viewingOutput ? (outputPath!.split('.').pop() || '') : selectedFile.ext;

  const isVideo = /\.?(mp4|mkv|webm|avi|mov|flv|wmv|m4v|ts|mpg|mpeg)$/i.test(ext);
  const isAudio = /\.?(mp3|wav|aac|ogg|flac|m4a|wma|opus)$/i.test(ext);
  const isImage = /\.?(jpe?g|png|gif|webp|bmp|tiff)$/i.test(ext);
  const src = mediaUrl(path);

  // Trim state for the current input file.
  const duration = durations[selectedFile.id] || 0;
  const range = ranges[selectedFile.id] || { start: 0, end: duration };
  const trimStart = range.start;
  const trimEnd = range.end > 0 ? range.end : duration;

  // Trim only applies to time-based media (video/audio), in non-batch modes.
  const showTrim = (isVideo || isAudio) && !viewingOutput;
  // Show playback controls (no trim handles) when viewing output video.
  const showOutputPlayback = isVideo && viewingOutput;
  const trimDuration = viewingOutput ? outputDuration : duration;

  return (
    <div
      className={`${dc('PreviewCanvas')} h-full bg-[#111113] flex flex-col relative`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay indicator */}
      {dragOver && (
        <div className="absolute inset-0 z-30 bg-accent/10 border-2 border-accent rounded-lg flex items-center justify-center pointer-events-none">
          <p className="text-sm text-accent font-medium">{t('preview.dragDrop')}</p>
        </div>
      )}
      {/* Output/input toggle */}
      {hasOutput && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center bg-panel/90 border border-border rounded-btn p-0.5 backdrop-blur">
          <button
            onClick={() => setShowOutput(false)}
            className={`px-3 py-1 rounded text-xxs font-semibold transition-colors ${!showOutput ? 'bg-elevated text-text' : 'text-muted hover:text-text'}`}
          >
            {t('preview.input')}
          </button>
          <button
            onClick={() => setShowOutput(true)}
            className={`px-3 py-1 rounded text-xxs font-semibold transition-colors ${showOutput ? 'bg-success/20 text-success' : 'text-muted hover:text-text'}`}
          >
            {t('preview.output')}
          </button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        {isVideo && (
          <div ref={previewContainerRef} className="relative max-w-full max-h-full w-full h-full flex items-center justify-center">
          <video
            key={src}
            ref={videoRef}
            src={src}
            className={`max-w-full max-h-full rounded cursor-pointer ${hasPreview ? 'opacity-0 absolute pointer-events-none' : ''}`}
            onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
            onPlay={() => setPlaying(true)}
            onPause={(e) => { setPlaying(false); setPlayhead((e.target as HTMLVideoElement).currentTime); }}
            onEnded={() => setPlaying(false)}
            onSeeked={(e) => setPlayhead((e.target as HTMLVideoElement).currentTime)}
            onLoadedMetadata={(e) => {
              const d = (e.target as HTMLVideoElement).duration;
              if (!d || !isFinite(d)) return;
              if (viewingOutput) {
                setOutputDuration(d);
              } else {
                setDuration(selectedFile.id, d);
                // Initialize trim range to the full clip if unset.
                if (!ranges[selectedFile.id]) setRange(selectedFile.id, { start: 0, end: d });
              }
            }}
          />
            {hasPreview && (
              <canvas
                ref={previewCanvasRef}
                onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
                className="max-w-full max-h-full rounded cursor-pointer"
              />
            )}
            {/* delogo 功能暂时隐藏 */}
            {/* {selectedOpId === 'delogo' && !viewingOutput && (
              <RegionOverlay
                videoRef={videoRef}
                containerRef={previewContainerRef}
                params={{ x: params.x, y: params.y, w: params.w, h: params.h }}
                onChange={(x, y, w, h) => {
                  updateParam('x', x);
                  updateParam('y', y);
                  updateParam('w', w);
                  updateParam('h', h);
                }}
              />
            )} */}
          </div>
        )}
        {isAudio && (
          <div className="text-center">
            <div className="w-32 h-32 rounded-panel bg-panel-2 flex items-center justify-center mb-4 mx-auto">
              <span className="text-4xl text-accent">♪</span>
            </div>
            <p className="text-sm text-text font-medium">{viewingOutput ? outputPath!.split('/').pop() : selectedFile.name}</p>
            <audio
              key={src}
              src={src}
              controls
              className="mt-4 w-80"
              onLoadedMetadata={(e) => {
                if (!viewingOutput) {
                  const d = (e.target as HTMLAudioElement).duration;
                  if (d && isFinite(d)) setDuration(selectedFile.id, d);
                }
              }}
            />
          </div>
        )}
        {isImage && <img key={src} src={src} alt="" className="max-w-full max-h-full rounded" />}
        {!isVideo && !isAudio && !isImage && (
          <div className="text-center text-muted">
            <p className="text-sm">{t('preview.unsupported')}</p>
            <p className="text-xxs mt-1">{viewingOutput ? outputPath!.split('/').pop() : selectedFile.name}</p>
          </div>
        )}
      </div>

      {/* Processing overlay */}
      {phase === 'processing' && (
        <div className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
          <Loader2 size={40} className="text-accent animate-spin mb-4" />
          <p className="text-sm text-text font-medium mb-3">{t('process.processing')}</p>
          <div className="w-64 h-2 bg-panel-2 rounded-full overflow-hidden border border-border">
            <div className="h-full bg-accent transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xxs text-text-2 font-mono mt-2">{progress}%{speed ? ` · ${speed}` : ''}</p>
        </div>
      )}

      {/* Done flash badge */}
      {phase === 'done' && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-success/15 border border-success/40 rounded-btn">
          <CheckCircle2 size={13} className="text-success" />
          <span className="text-xxs text-success font-medium">{t('process.done')}</span>
        </div>
      )}

      {/* Remove file button */}
      <button
        onClick={handleRemoveFile}
        className={`absolute top-3 right-3 z-10 p-1.5 rounded-btn bg-panel/80 border border-border text-muted hover:text-error hover:border-error/50 backdrop-blur transition-colors ${phase === 'done' ? 'top-10' : ''}`}
        title={t('preview.remove')}
      >
        <Trash2 size={14} />
      </button>

      {/* Trim track (input) or playback-only track (output) */}
      {showTrim && (
        <TrimTrack
          duration={duration}
          start={trimStart}
          end={trimEnd}
          disabled={mode === 'batch'}
          playing={playing}
          playhead={playhead}
          videoRef={videoRef}
          togglePlay={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
          onChange={(s, e) => setRange(selectedFile.id, { start: s, end: e })}
          onSeek={(sec) => {
            const el = videoRef.current;
            if (el) el.currentTime = sec;
          }}
          onReset={() => clearRange(selectedFile.id)}
        />
      )}
      {showOutputPlayback && (
        <TrimTrack
          duration={trimDuration}
          start={0}
          end={trimDuration}
          disabled
          playing={playing}
          playhead={playhead}
          videoRef={videoRef}
          togglePlay={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
          onChange={() => {}}
          onSeek={(sec) => {
            const el = videoRef.current;
            if (el) el.currentTime = sec;
          }}
        />
      )}
      {mode === 'batch' && showTrim && (
        <span className="text-xxs text-warn font-medium pb-2 block text-center">{t('preview.trimDisabled')}</span>
      )}
    </div>
  );
}
