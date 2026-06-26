import { useCallback, useRef, useEffect, useState } from 'react';
import { dc } from '../../lib/devClass';

interface SplitterProps {
  direction: 'vertical' | 'horizontal';
  onResize: (delta: number) => void;
  className?: string;
}

export default function Splitter({ direction, onResize, className = '' }: SplitterProps) {
  const lastPos = useRef(0);
  const dragging = useRef(false);
  const [active, setActive] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    setActive(true);
    lastPos.current = direction === 'vertical' ? e.clientX : e.clientY;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const pos = direction === 'vertical' ? ev.clientX : ev.clientY;
      const delta = pos - lastPos.current;
      lastPos.current = pos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      dragging.current = false;
      setActive(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`${dc('Splitter')} ${
        direction === 'vertical'
          ? 'w-[4px] cursor-col-resize hover:bg-select/30'
          : 'h-[4px] cursor-row-resize hover:bg-select/30'
      } ${active ? 'bg-select/50' : 'bg-transparent'} transition-colors shrink-0 ${className}`}
    />
  );
}
