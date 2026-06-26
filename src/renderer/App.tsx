import { useState, useCallback } from 'react';
import TitleBar from './components/layout/TitleBar';
import Toolbar from './components/layout/Toolbar';
import LeftDock from './components/layout/LeftDock';
import Splitter from './components/layout/Splitter';
import PreviewCanvas from './components/preview/PreviewCanvas';
import Inspector from './components/inspector/Inspector';
import BottomDock from './components/dock/BottomDock';
import { useProcessEvents } from './lib/processHelper';
import { dc } from './lib/devClass';

export default function App() {
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(300);

  // Wire main→renderer process events (progress/log/status) into stores.
  useProcessEvents();

  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth(w => Math.max(200, Math.min(360, w + delta)));
  }, []);

  const handleRightResize = useCallback((delta: number) => {
    setRightWidth(w => Math.max(260, Math.min(400, w - delta)));
  }, []);

  return (
    <div className={`${dc('App')} h-full w-full flex flex-col bg-app-bg`}>
      {/* ① Title bar */}
      <TitleBar />

      {/* ② Toolbar */}
      <Toolbar />

      {/* ③④⑤ Main body: Left Dock | Preview | Inspector */}
      <div className={`${dc('MainLayout')} flex-1 flex min-h-0 gap-[4px] p-[4px] pt-0`}>
        {/* Left dock */}
        <div style={{ width: leftWidth }} className={`${dc('LeftDockSlot')} shrink-0 min-h-0`}>
          <LeftDock />
        </div>

        <Splitter direction="vertical" onResize={handleLeftResize} />

        {/* Center preview */}
        <div className={`${dc('PreviewSlot')} flex-1 min-w-0 min-h-0`}>
          <PreviewCanvas />
        </div>

        <Splitter direction="vertical" onResize={handleRightResize} />

        {/* Right inspector */}
        <div style={{ width: rightWidth }} className={`${dc('InspectorSlot')} shrink-0 min-h-0`}>
          <Inspector />
        </div>
      </div>

      {/* ⑥ Bottom dock */}
      <BottomDock />
    </div>
  );
}
