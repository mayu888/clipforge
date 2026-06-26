import { useOpStore } from '../../store/opStore';
import { useT } from '../../lib/i18n';
import { OPERATIONS } from '../../lib/op-schema';
import ProcessPanel from './ProcessPanel';
import { dc } from '../../lib/devClass';
import { api } from '../../lib/ipc';
import { FileVideo, Image as ImageIcon, Subtitles as SubtitlesIcon, X } from 'lucide-react';

const PARAM_KEYS: Record<string, string> = {
  format: 'param.format', width: 'param.width', height: 'param.height',
  x: 'param.x', y: 'param.y', w: 'param.w', h: 'param.h',
  direction: 'param.direction', color: 'param.color',
  brightness: 'param.brightness', contrast: 'param.contrast', saturation: 'param.saturation',
  grayscale: 'param.grayscale', strength: 'param.strength', mode: 'param.mode',
  sigma: 'param.sigma', timestamp: 'param.timestamp', multiplier: 'param.multiplier',
  count: 'param.count', fadeIn: 'param.fadeIn', fadeOut: 'param.fadeOut',
  level: 'param.level', target: 'param.target', layout: 'param.layout',
  position: 'param.position', scale: 'param.scale', vol1: 'param.vol1', vol2: 'param.vol2',
  command: 'param.command', fps: 'param.fps',
  logoWidth: 'param.logoWidth', opacity: 'param.opacity',
};

const CLIP2_OPS = new Set(['sxs', 'pip', 'concat', 'mixaudio']);
const LOGO_OPS = new Set(['overlay']);
const SUBS_OPS = new Set(['subtitles']);

export default function Inspector() {
  const { selectedOpId, params, updateParam } = useOpStore();
  const t = useT();
  const op = OPERATIONS.find(o => o.id === selectedOpId);

  if (!op) {
    return (
      <div className={`${dc('InspectorEmpty')} h-full bg-panel flex flex-col items-center justify-center p-4`}>
        <p className="text-xs text-muted text-center">{t('inspector.empty')}</p>
      </div>
    );
  }

  return (
    <div className={`${dc('Inspector')} h-full bg-panel flex flex-col`}>
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <op.icon size={15} className="text-accent" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-text">{t(`op.${op.id}`)}</span>
        </div>
        <p className="text-xxs text-muted mt-0.5">{t(`op.${op.id}.desc`)}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {op.params.length === 0 && !CLIP2_OPS.has(op.id) && !LOGO_OPS.has(op.id) && !SUBS_OPS.has(op.id) ? (
          <p className="text-xs text-muted text-center py-4">{t('inspector.noParams')}</p>
        ) : (
          <div className="space-y-3">
            {op.params.map((p) => (
              <div key={p.key}>
                <label className="text-xxs font-medium text-text-2 mb-1 block uppercase tracking-wider">
                  {t(PARAM_KEYS[p.key] || p.key)}
                </label>
                {p.type === 'select' && (
                  <select
                    value={String(params[p.key] ?? p.default ?? '')}
                    onChange={(e) => updateParam(p.key, e.target.value)}
                    className="w-full bg-panel-2 border border-border rounded-input px-2.5 py-1.5 text-xs text-text focus:border-select transition-colors"
                  >
                    {p.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
                {p.type === 'number' && (
                  <input
                    type="number"
                    value={params[p.key] ?? p.default ?? ''}
                    onChange={(e) => updateParam(p.key, parseFloat(e.target.value) || 0)}
                    min={p.min} max={p.max} step={p.step}
                    className="w-full bg-panel-2 border border-border rounded-input px-2.5 py-1.5 text-xs text-text font-mono focus:border-select transition-colors"
                  />
                )}
                {p.type === 'text' && (
                  <input
                    type="text"
                    value={params[p.key] ?? p.default ?? ''}
                    onChange={(e) => updateParam(p.key, e.target.value)}
                    placeholder={p.placeholder}
                    className="w-full bg-panel-2 border border-border rounded-input px-2.5 py-1.5 text-xs text-text font-mono focus:border-select transition-colors"
                  />
                )}
                {p.type === 'toggle' && (
                  <button
                    onClick={() => updateParam(p.key, !params[p.key])}
                    className={`px-3 py-1 rounded-btn text-xs font-medium border transition-colors ${
                      params[p.key] ? 'bg-accent/20 border-accent text-accent' : 'bg-panel-2 border-border text-muted hover:text-text'
                    }`}
                  >
                    {params[p.key] ? t('common.on') : t('common.off')}
                  </button>
                )}
              </div>
            ))}

            {CLIP2_OPS.has(op.id) && (
              <div>
                <label className="text-xxs font-medium text-text-2 mb-1 block uppercase tracking-wider">
                  {t('sxs.clip2')}
                </label>
                {params.clip2Path ? (
                  <div className="flex items-center gap-1.5 bg-panel-2 border border-border rounded-input px-2.5 py-1.5">
                    <FileVideo size={13} className="text-accent shrink-0" />
                    <span className="text-xs text-text truncate flex-1" title={params.clip2Path}>
                      {params.clip2Name || params.clip2Path.split(/[/\\]/).pop()}
                    </span>
                    <button
                      onClick={() => { updateParam('clip2Path', ''); updateParam('clip2Name', ''); }}
                      className="text-muted hover:text-text shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const file = selectedOpId === 'mixaudio'
                        ? await api.openSingleVideoOrAudio()
                        : await api.openSingleVideo();
                      if (file) {
                        updateParam('clip2Path', file.path);
                        updateParam('clip2Name', file.name);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-dashed border-border rounded-input text-xs text-muted hover:text-text hover:border-accent transition-colors"
                  >
                    <FileVideo size={13} />
                    {t('sxs.selectClip2')}
                  </button>
                )}
              </div>
            )}

            {LOGO_OPS.has(op.id) && (
              <div>
                <label className="text-xxs font-medium text-text-2 mb-1 block uppercase tracking-wider">
                  {t('overlay.logo')}
                </label>
                {params.logoPath ? (
                  <div className="flex items-center gap-1.5 bg-panel-2 border border-border rounded-input px-2.5 py-1.5">
                    <ImageIcon size={13} className="text-accent shrink-0" />
                    <span className="text-xs text-text truncate flex-1" title={params.logoPath}>
                      {params.logoName || params.logoPath.split(/[/\\]/).pop()}
                    </span>
                    <button
                      onClick={() => { updateParam('logoPath', ''); updateParam('logoName', ''); }}
                      className="text-muted hover:text-text shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const file = await api.openSingleImage();
                      if (file) {
                        updateParam('logoPath', file.path);
                        updateParam('logoName', file.name);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-dashed border-border rounded-input text-xs text-muted hover:text-text hover:border-accent transition-colors"
                  >
                    <ImageIcon size={13} />
                    {t('overlay.selectLogo')}
                  </button>
                )}
              </div>
            )}
            {SUBS_OPS.has(op.id) && (
              <div>
                <label className="text-xxs font-medium text-text-2 mb-1 block uppercase tracking-wider">
                  {t('subtitles.file')}
                </label>
                {params.subsPath ? (
                  <div className="flex items-center gap-1.5 bg-panel-2 border border-border rounded-input px-2.5 py-1.5">
                    <SubtitlesIcon size={13} className="text-accent shrink-0" />
                    <span className="text-xs text-text truncate flex-1" title={params.subsPath}>
                      {params.subsName || params.subsPath.split(/[/\\]/).pop()}
                    </span>
                    <button
                      onClick={() => { updateParam('subsPath', ''); updateParam('subsName', ''); }}
                      className="text-muted hover:text-text shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const file = await api.openSingleSubtitle();
                      if (file) {
                        updateParam('subsPath', file.path);
                        updateParam('subsName', file.name);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-dashed border-border rounded-input text-xs text-muted hover:text-text hover:border-accent transition-colors"
                  >
                    <SubtitlesIcon size={13} />
                    {t('subtitles.select')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ProcessPanel />
    </div>
  );
}
