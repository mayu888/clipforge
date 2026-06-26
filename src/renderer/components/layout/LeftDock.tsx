import { useState } from 'react';
import { Film, Wand2, ChevronDown } from 'lucide-react';
import { useOpStore } from '../../store/opStore';
import { useModeStore } from '../../store/modeStore';
import { useStackStore } from '../../store/stackStore';
import { useT } from '../../lib/i18n';
import { OPERATIONS, GROUP_ORDER } from '../../lib/op-schema';
import { dc } from '../../lib/devClass';
import MediaPanel from '../media/MediaPanel';

const GROUP_KEYS: Record<string, string> = {
  '转码压缩': 'group.transcode',
  '画面': 'group.visual',
  '时间速度': 'group.time',
  '音频': 'group.audio',
  '多输入合成': 'group.composite',
  '工具': 'group.tools',
};

export default function LeftDock() {
  const [tab, setTab] = useState<'media' | 'ops'>('ops');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const t = useT();

  const toggleGroup = (g: string) => setCollapsed(c => ({ ...c, [g]: !c[g] }));

  return (
    <div className={`${dc('LeftDock')} h-full bg-panel flex flex-col`}>
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setTab('media')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
            tab === 'media' ? 'text-text border-b-2 border-accent' : 'text-muted hover:text-text-2'
          }`}
        >
          <Film size={13} /> {t('leftdock.media')}
        </button>
        <button
          onClick={() => setTab('ops')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
            tab === 'ops' ? 'text-text border-b-2 border-accent' : 'text-muted hover:text-text-2'
          }`}
        >
          <Wand2 size={13} /> {t('leftdock.ops')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'media' ? (
          <MediaPanel />
        ) : (
          <OperationsList collapsed={collapsed} toggleGroup={toggleGroup} />
        )}
      </div>
    </div>
  );
}

function OperationsList({ collapsed, toggleGroup }: { collapsed: Record<string, boolean>; toggleGroup: (g: string) => void }) {
  const { selectedOpId, selectOp } = useOpStore();
  const { mode } = useModeStore();
  const { addToStack } = useStackStore();
  const t = useT();

  return (
    <div className="py-1">
      {GROUP_ORDER.map((group) => {
        const ops = OPERATIONS.filter((o) => o.group === group && o.id !== 'delogo');
        const isCollapsed = collapsed[group];
        const groupLabel = t(GROUP_KEYS[group] || group);

        return (
          <div key={group}>
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xxs font-semibold text-muted uppercase tracking-wider hover:text-text-2 transition-colors"
            >
              {groupLabel}
              <ChevronDown size={12} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>

            {!isCollapsed && ops.map((op) => {
              const isDisabled = (mode === 'stack' && !op.chainable) || (mode === 'batch' && !op.batchSupported);
              const isActive = selectedOpId === op.id;

              return (
                <button
                  key={op.id}
                  disabled={isDisabled}
                  onClick={() => {
                    selectOp(op.id);
                    if (mode === 'stack' && op.chainable) addToStack(op.id, {});
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-select/20 text-select border-l-2 border-select'
                      : isDisabled
                        ? 'text-muted/40 cursor-not-allowed'
                        : 'text-text-2 hover:bg-elevated hover:text-text'
                  }`}
                  title={t(`op.${op.id}.desc`)}
                >
                  <op.icon size={14} className="shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{t(`op.${op.id}`)}</span>
                  {mode === 'stack' && !op.chainable && (
                    <span className="ml-auto text-[9px] text-muted/50">{t('leftdock.notChainable')}</span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
