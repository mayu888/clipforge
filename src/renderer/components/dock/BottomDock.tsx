import { useState, useCallback, useRef } from 'react';
import { Layers, Play, TerminalSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useModeStore } from '../../store/modeStore';
import { useStackStore } from '../../store/stackStore';
import { useRenderStore } from '../../store/renderStore';
import { useLogStore } from '../../store/logStore';
import { useT } from '../../lib/i18n';
import { OPERATIONS } from '../../lib/op-schema';
import { dc } from '../../lib/devClass';

type BottomTab = 'stack' | 'batch' | 'render' | 'log';

export default function BottomDock() {
  const { mode } = useModeStore();
  const [activeTab, setActiveTab] = useState<BottomTab>(mode === 'stack' ? 'stack' : 'log');
  const [collapsed, setCollapsed] = useState(false);
  const [height, setHeight] = useState(220);
  const dragging = useRef(false);
  const lastY = useRef(0);
  const t = useT();

  const prevMode = useRef(mode);
  if (prevMode.current !== mode) {
    prevMode.current = mode;
    if (mode === 'stack') setActiveTab('stack');
  }

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastY.current = e.clientY;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = lastY.current - ev.clientY;
      lastY.current = ev.clientY;
      setHeight(h => Math.max(140, Math.min(460, h + delta)));
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  if (collapsed) {
    return (
      <div className={`${dc('BottomDockCollapsed')} bg-panel border-t border-border shrink-0`}>
        <button onClick={() => setCollapsed(false)} className="flex items-center gap-1.5 px-3 py-1 text-xxs text-muted hover:text-text transition-colors">
          <ChevronUp size={12} /> {t('dock.expand')}
        </button>
      </div>
    );
  }

  const tabs: { key: BottomTab; labelKey: string; icon: any }[] = [
    { key: 'stack', labelKey: 'dock.stack', icon: Layers },
    { key: 'render', labelKey: 'dock.render', icon: Play },
    { key: 'log', labelKey: 'dock.log', icon: TerminalSquare },
  ];

  return (
    <div className={`${dc('BottomDock')} bg-panel border-t border-border shrink-0 flex flex-col`} style={{ height }}>
      <div onMouseDown={handleDragStart} className="h-[4px] cursor-row-resize hover:bg-select/30 transition-colors shrink-0" />
      <div className="flex items-center justify-between px-2 border-b border-border shrink-0">
        <div className="flex">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setActiveTab(tb.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tb.key ? 'text-text border-accent' : 'text-muted border-transparent hover:text-text-2'
              }`}
            >
              <tb.icon size={13} /> {t(tb.labelKey)}
            </button>
          ))}
        </div>
        <button onClick={() => setCollapsed(true)} className="p-1 text-muted hover:text-text transition-colors">
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'stack' && <StackTab />}
        {activeTab === 'render' && <RenderTab />}
        {activeTab === 'log' && <LogTab />}
      </div>
    </div>
  );
}

function StackTab() {
  const { stack, removeFromStack, clearStack } = useStackStore();
  const t = useT();

  if (stack.length === 0) {
    return <div className="h-full flex items-center justify-center"><p className="text-xs text-muted">{t('dock.stack.empty')}</p></div>;
  }

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      <div className="bg-panel-2 border border-border rounded p-2 font-mono text-xxs text-success overflow-x-auto">
        <span className="text-text-2">ffmpeg -i input.mp4</span>
        {stack.map(item => { const op = OPERATIONS.find(o => o.id === item.opId); return op ? ` → ${t(`op.${op.id}`)}` : ''; }).join('')}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {stack.map((item, i) => {
          const op = OPERATIONS.find(o => o.id === item.opId);
          if (!op) return null;
          return (
            <div key={item.id} className="flex items-center gap-2 px-2 py-1 bg-panel-2 rounded border border-border">
              <span className="text-xxs text-text-2 font-mono w-4">{i + 1}</span>
              <op.icon size={13} className="text-accent shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-text flex-1">{t(`op.${op.id}`)}</span>
              <button onClick={() => removeFromStack(item.id)} className="text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
            </div>
          );
        })}
      </div>
      <button onClick={clearStack} className="self-end px-3 py-1 text-xxs text-muted hover:text-danger border border-border rounded-btn transition-colors">
        {t('dock.stack.clear')}
      </button>
    </div>
  );
}

function RenderTab() {
  const { tasks } = useRenderStore();
  const t = useT();

  if (tasks.length === 0) {
    return <div className="h-full flex items-center justify-center"><p className="text-xs text-muted">{t('dock.render.empty')}</p></div>;
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/50">
          <span className="text-xs text-text flex-1 truncate">{task.fileName}</span>
          <span className="text-xxs text-muted font-mono">{task.progress}%</span>
          {task.speed && <span className="text-xxs text-text-2">{task.speed}x</span>}
        </div>
      ))}
    </div>
  );
}

function LogTab() {
  const { logs, clearLogs } = useLogStore();
  const t = useT();

  const levelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-success';
      case 'error': return 'text-danger';
      case 'warn': return 'text-warn';
      default: return 'text-text-2';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className={`flex-1 overflow-y-auto p-2 font-mono text-xxs bg-[#111113] rounded m-2 mt-0 ${import.meta.env.DEV ? 'select-text' : 'select-none'}`}>
        {logs.length === 0 ? (
          <p className="text-muted">{t('dock.log.waiting')}</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={levelColor(log.level)}>
              <span className="text-muted/50">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>
      <div className="px-2 pb-2">
        <button onClick={clearLogs} className="px-2.5 py-1 text-xxs text-muted hover:text-text border border-border rounded-btn transition-colors">
          {t('dock.log.clear')}
        </button>
      </div>
    </div>
  );
}
