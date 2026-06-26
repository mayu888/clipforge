import { FolderOpen, Download, Globe } from 'lucide-react';
import { useModeStore } from '../../store/modeStore';
import { useMediaStore } from '../../store/mediaStore';
import { useOpStore } from '../../store/opStore';
import { useStackStore } from '../../store/stackStore';
import { useProcessStore } from '../../store/processStore';
import { useLocaleStore, useT } from '../../lib/i18n';
import { runProcess } from '../../lib/processHelper';
import { api } from '../../lib/ipc';
import { dc } from '../../lib/devClass';

export default function Toolbar() {
  const { mode, setMode } = useModeStore();
  const { addFiles, selectedFileId } = useMediaStore();
  const { selectedOpId } = useOpStore();
  const { stack } = useStackStore();
  const { phase } = useProcessStore();
  const { locale, setLocale } = useLocaleStore();
  const t = useT();

  const handleOpenFiles = async () => {
    const files = await api.openFiles();
    if (files.length > 0) addFiles(files);
  };

  const canExport =
    phase !== 'processing' &&
    !!selectedFileId &&
    (mode === 'stack' ? stack.length > 0 : !!selectedOpId);

  const modes: { key: 'single' | 'stack' | 'batch'; labelKey: string }[] = [
    { key: 'single', labelKey: 'toolbar.mode.single' },
    { key: 'stack', labelKey: 'toolbar.mode.stack' },
  ];

  return (
    <div className={`${dc('Toolbar')} h-[44px] bg-panel border-b border-border flex items-center justify-between px-3 shrink-0`}>
      {/* Left: File actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenFiles}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-elevated border border-border-s rounded-btn text-xs font-medium text-text hover:bg-panel-2 transition-colors"
        >
          <FolderOpen size={14} />
          {t('toolbar.openFile')}
        </button>
      </div>

      {/* Center: Mode switch */}
      <div className="flex items-center bg-panel-2 rounded-btn p-0.5 border border-border">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-4 py-1 rounded-btn text-xs font-semibold transition-all ${
              mode === m.key ? 'bg-accent text-white' : 'text-text-2 hover:text-text'
            }`}
          >
            {t(m.labelKey)}
          </button>
        ))}
      </div>

      {/* Right: Language + Export */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-btn text-xs text-text-2 hover:text-text hover:bg-elevated transition-colors no-drag"
          title={locale === 'zh' ? 'Switch to English' : '切换为中文'}
        >
          <Globe size={13} />
          <span className="font-medium">{locale === 'zh' ? 'EN' : '中'}</span>
        </button>
        <button
          disabled={!canExport}
          onClick={() => runProcess()}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-btn text-xs font-bold transition-colors ${
            canExport ? 'bg-accent text-white hover:bg-accent-dim' : 'bg-panel-2 text-muted cursor-not-allowed'
          }`}
        >
          <Download size={14} />
          {t('toolbar.export')}
        </button>
      </div>
    </div>
  );
}
