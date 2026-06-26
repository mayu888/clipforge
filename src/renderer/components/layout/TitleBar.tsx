import { Minus, Square, X } from 'lucide-react';
import { api } from '../../lib/ipc';
import { useT } from '../../lib/i18n';
import { dc } from '../../lib/devClass';

const isMac = /Mac/i.test(navigator.userAgent);

function Brand() {
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">C</span>
      </div>
      <span className="text-xs font-semibold text-text tracking-wide">{t('app.name')}</span>
    </div>
  );
}

export default function TitleBar() {
  // macOS: traffic lights get their own dedicated drag row, branding centered below
  if (isMac) {
    return (
      <div className={`${dc('TitleBar')} bg-panel border-b border-border select-none shrink-0`}>
        {/* Row 1: macOS traffic lights only (drag region) */}
        <div className="h-[30px] drag-region" />
        {/* Row 2: centered branding */}
        <div className="h-[34px] flex items-center justify-center border-t border-border/40 drag-region">
          <Brand />
        </div>
      </div>
    );
  }

  // Windows/Linux: single row, branding centered, custom window controls on the right
  return (
    <div className={`${dc('TitleBar')} h-[40px] bg-panel border-b border-border flex items-center px-3 drag-region select-none shrink-0`}>
      {/* spacer to balance the window controls width, keeping brand centered */}
      <div className="w-[108px]" />
      <div className="flex-1 flex items-center justify-center">
        <Brand />
      </div>
      <div className="flex items-center gap-0.5 no-drag">
        <button onClick={() => api.windowMinimize()} className="w-9 h-7 flex items-center justify-center rounded hover:bg-elevated transition-colors">
          <Minus size={14} className="text-text-2" />
        </button>
        <button onClick={() => api.windowMaximize()} className="w-9 h-7 flex items-center justify-center rounded hover:bg-elevated transition-colors">
          <Square size={12} className="text-text-2" />
        </button>
        <button onClick={() => api.windowClose()} className="w-9 h-7 flex items-center justify-center rounded hover:bg-danger/80 transition-colors group">
          <X size={14} className="text-text-2 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}
