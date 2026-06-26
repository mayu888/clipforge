import { Play, X, FolderOpen, Loader2 } from 'lucide-react';
import { useProcessStore } from '../../store/processStore';
import { useMediaStore } from '../../store/mediaStore';
import { useOpStore } from '../../store/opStore';
import { useModeStore } from '../../store/modeStore';
import { useStackStore } from '../../store/stackStore';
import { runProcess, cancelProcess } from '../../lib/processHelper';
import { api } from '../../lib/ipc';
import { useT } from '../../lib/i18n';

/**
 * Inspector footer: process trigger, live progress bar with cancel, and
 * result actions (download/reveal). Shared logic for Single & Stack modes.
 */
export default function ProcessPanel() {
  const { phase, progress, speed, outputPath, error } = useProcessStore();
  const reset = useProcessStore((s) => s.reset);
  const { selectedFileId } = useMediaStore();
  const { selectedOpId } = useOpStore();
  const { mode } = useModeStore();
  const { stack } = useStackStore();
  const t = useT();

  const canProcess =
    !!selectedFileId &&
    (mode === 'stack' ? stack.length > 0 : !!selectedOpId);

  // ─── Processing: progress bar + cancel ───
  if (phase === 'processing') {
    return (
      <div className="px-3 py-3 border-t border-border shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xxs text-accent font-medium">
            <Loader2 size={12} className="animate-spin" />
            {t('process.processing')}
          </span>
          <span className="text-xxs text-text-2 font-mono">
            {progress}%{speed ? ` · ${speed}` : ''}
          </span>
        </div>
        <div className="h-2 bg-panel-2 rounded-full overflow-hidden border border-border">
          <div className="h-full bg-accent transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        <button
          onClick={cancelProcess}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-danger/15 border border-danger/40 rounded-btn text-xs font-medium text-danger hover:bg-danger/25 transition-colors"
        >
          <X size={13} /> {t('process.cancel')}
        </button>
      </div>
    );
  }

  // ─── Done: download / reveal ───
  if (phase === 'done' && outputPath) {
    return (
      <div className="px-3 py-3 border-t border-border shrink-0 space-y-2">
        <p className="text-xxs text-success font-medium">{t('process.done')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => api.revealInFolder(outputPath)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-elevated border border-border rounded-btn text-xs font-medium text-text hover:bg-panel-2 transition-colors"
          >
            <FolderOpen size={13} /> {t('process.reveal')}
          </button>
          <button
            onClick={reset}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent rounded-btn text-xs font-bold text-white hover:bg-accent-dim transition-colors"
          >
            <Play size={13} /> {t('process.again')}
          </button>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (phase === 'error') {
    return (
      <div className="px-3 py-3 border-t border-border shrink-0 space-y-2">
        <p className="text-xxs text-danger font-medium">{t('process.error')}</p>
        <p className="text-xxs text-text-2 line-clamp-3 break-all">{error}</p>
        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-elevated border border-border rounded-btn text-xs font-medium text-text hover:bg-panel-2 transition-colors"
        >
          {t('process.retry')}
        </button>
      </div>
    );
  }

  // ─── Idle: process button ───
  return (
    <div className="px-3 py-3 border-t border-border shrink-0">
      <button
        disabled={!canProcess}
        onClick={() => runProcess()}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-btn text-xs font-bold transition-colors ${
          canProcess
            ? 'bg-accent text-white hover:bg-accent-dim'
            : 'bg-panel-2 text-muted cursor-not-allowed'
        }`}
      >
        <Play size={14} /> {t('process.start')}
      </button>
    </div>
  );
}
