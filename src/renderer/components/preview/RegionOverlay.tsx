import { useRef, useEffect, useCallback, useState, type RefObject } from 'react';

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  containerRef: RefObject<HTMLDivElement>;
  params: { x: number; y: number; w: number; h: number };
  onChange: (x: number, y: number, w: number, h: number) => void;
}

interface Rect { x: number; y: number; w: number; h: number; }

/**
 * Computes scale/offset that maps the video's original pixels onto the
 * container's CSS-pixel space (letterbox-fit, same logic as drawPreview).
 */
function getVideoMapping(
  container: HTMLDivElement,
  videoW: number,
  videoH: number,
) {
  const rect = container.getBoundingClientRect();
  const scale = Math.min(rect.width / videoW, rect.height / videoH);
  const dw = videoW * scale;
  const dh = videoH * scale;
  const ox = (rect.width - dw) / 2;
  const oy = (rect.height - dh) / 2;
  return { scale, dw, dh, ox, oy, containerW: rect.width, containerH: rect.height };
}

/** Convert a container-local point to video-pixel coordinates. */
function screenToVideo(
  localX: number,
  localY: number,
  container: HTMLDivElement,
  videoW: number,
  videoH: number,
) {
  const { scale, ox, oy } = getVideoMapping(container, videoW, videoH);
  return {
    x: Math.max(0, Math.min(Math.round((localX - ox) / scale), videoW)),
    y: Math.max(0, Math.min(Math.round((localY - oy) / scale), videoH)),
  };
}

/** Convert video-pixel coordinates to container-local CSS-pixel coordinates. */
function videoToScreen(
  vx: number,
  vy: number,
  vw: number,
  vh: number,
  container: HTMLDivElement,
  videoW: number,
  videoH: number,
) {
  const { scale, ox, oy } = getVideoMapping(container, videoW, videoH);
  return { x: ox + vx * scale, y: oy + vy * scale, w: vw * scale, h: vh * scale };
}

export default function RegionOverlay({ videoRef, containerRef, params, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const liveRectRef = useRef<Rect | null>(null);
  const [liveRect, setLiveRect] = useState<Rect | null>(null);

  const videoW = videoRef.current?.videoWidth || 0;
  const videoH = videoRef.current?.videoHeight || 0;

  /** Draw the overlay: dim everything, clear the selection rectangle, draw border + label. */
  const draw = useCallback((sel: Rect | null) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !videoW || !videoH) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const { dw, dh, ox, oy } = getVideoMapping(container, videoW, videoH);

    // Clip to the video display area so the overlay doesn't spill into letterbox bars.
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, dw, dh);
    ctx.clip();

    // Dim the whole video area.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(ox, oy, dw, dh);

    if (sel && sel.w > 0 && sel.h > 0) {
      const s = videoToScreen(sel.x, sel.y, sel.w, sel.h, container, videoW, videoH);

      // Clear the selection rectangle (punch a hole in the dim layer).
      ctx.clearRect(s.x, s.y, s.w, s.h);

      // Dashed border.
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.setLineDash([]);

      // Size label.
      const label = `${sel.w} × ${sel.h}`;
      ctx.font = '600 11px ui-monospace, monospace';
      const tm = ctx.measureText(label);
      const lx = s.x + 4;
      const ly = s.y - 6 > 14 ? s.y - 6 : s.y + s.h + 14;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(lx - 2, ly - 11, tm.width + 4, 13);
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(label, lx, ly);
    } else {
      // No selection yet — show hint text.
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '500 12px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('拖拽选择水印区域', ox + dw / 2, oy + dh / 2);
      ctx.textAlign = 'start';
    }

    ctx.restore();
  }, [containerRef, videoW, videoH]);

  // Redraw when params change externally (Inspector input) or liveRect updates.
  useEffect(() => {
    const hasValid = params.w > 0 && params.h > 0;
    draw(hasValid ? { x: params.x, y: params.y, w: params.w, h: params.h } : null);
  }, [params.x, params.y, params.w, params.h, draw]);

  // Redraw on container resize.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => draw(liveRect));
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef, draw, liveRect]);

  const getLocalPos = (e: MouseEvent | React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return { lx: 0, ly: 0 };
    const rect = container.getBoundingClientRect();
    return { lx: e.clientX - rect.left, ly: e.clientY - rect.top };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!videoW || !videoH) return;
    e.preventDefault();
    e.stopPropagation();
    const { lx, ly } = getLocalPos(e);
    const pos = screenToVideo(lx, ly, containerRef.current!, videoW, videoH);
    dragging.current = true;
    dragStart.current = pos;
    setLiveRect({ x: pos.x, y: pos.y, w: 0, h: 0 });

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const { lx: mx, ly: my } = getLocalPos(ev);
      const cur = screenToVideo(mx, my, containerRef.current!, videoW, videoH);
      const rawX = Math.min(dragStart.current.x, cur.x);
      const rawY = Math.min(dragStart.current.y, cur.y);
      const rawW = Math.abs(cur.x - dragStart.current.x);
      const rawH = Math.abs(cur.y - dragStart.current.y);
      // ffmpeg delogo 要求 x>=1, y>=1, y+h<videoH (上/左/下边缘至少留 1px)
      const x = Math.max(1, rawX);
      const y = Math.max(1, rawY);
      const w = Math.min(rawW, videoW - x - 1);
      const h = Math.min(rawH, videoH - y - 1);
      const next = { x, y, w, h };
      liveRectRef.current = next;
      setLiveRect(next);
      draw(next);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (!dragging.current) return;
      dragging.current = false;
      const finalRect = liveRectRef.current;
      if (finalRect && finalRect.w > 2 && finalRect.h > 2) {
        onChange(finalRect.x, finalRect.y, finalRect.w, finalRect.h);
      }
    };

    document.body.style.cursor = 'crosshair';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [videoW, videoH, containerRef, draw, onChange]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      className="absolute inset-0 cursor-crosshair"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
