import { useCallback, useRef, useEffect, type RefObject } from 'react';
import { Play, Pause } from 'lucide-react';
import { useT } from '../../lib/i18n';
import { dc } from '../../lib/devClass';

interface TrimTrackProps {
  duration: number;
  start: number;
  end: number;
  disabled?: boolean;
  playing?: boolean;
  playhead?: number;
  videoRef?: RefObject<HTMLVideoElement | null>;
  togglePlay?: () => void;
  onChange: (start: number, end: number) => void;
  onSeek?: (seconds: number) => void;
  onReset?: () => void;
}

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const HANDLE_W = 10;
const HANDLE_H = 22;
const HIT_PAD = 6;

export default function TrimTrack({
  duration, start, end, disabled,
  playing = false, playhead = 0, videoRef, togglePlay,
  onChange, onSeek, onReset,
}: TrimTrackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useT();

  // Refs for values accessed in rAF / draw — avoids effect restart on prop changes.
  const startRef = useRef(start);  startRef.current = start;
  const endRef   = useRef(end);    endRef.current = end;
  const playRef  = useRef(playhead); playRef.current = playhead;
  const durRef   = useRef(duration); durRef.current = duration;
  const onChangeRef  = useRef(onChange);  onChangeRef.current = onChange;
  const onSeekRef    = useRef(onSeek);    onSeekRef.current = onSeek;
  const playingRef   = useRef(playing);   playingRef.current = playing;

  // Canvas drawing-buffer size in CSS pixels.
  const cw = useRef(0);
  const ch = useRef(0);

  // rAF loop handle for playback.
  const rafLoop   = useRef(0);

  // Live time readout — updated directly from the rAF loop to avoid re-renders.
  const timeTextRef = useRef<HTMLSpanElement>(null);

  // One-shot draw request (used when paused and props change).
  const rafDraw = useRef(0);

  const requestDraw = useCallback(() => {
    cancelAnimationFrame(rafDraw.current);
    rafDraw.current = requestAnimationFrame(() => {
      if (cw.current > 0) draw();
    });
  }, []);

  // ─── Coordinate helpers ───────────────────────────────────────
  const xToTime = useCallback((clientX: number): number => {
    const el = canvasRef.current;
    const d = durRef.current;
    if (!el || d <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * d;
  }, []);

  const timeToX = useCallback((time: number): number => {
    const d = durRef.current;
    return d > 0 ? (time / d) * cw.current : 0;
  }, []);

  // ─── Canvas draw ──────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || cw.current <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = cw.current;
    const h = ch.current;
    const s = startRef.current;
    const e = endRef.current;
    const p = playRef.current;
    const d = durRef.current;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Track background
    ctx.fillStyle = '#2c2c30';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 3);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#3a3a40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, w - 1, h - 1, 3);
    ctx.stroke();

    if (d <= 0) return;

    const sx = (s / d) * w;
    const ex = (e / d) * w;

    // Selected region
    ctx.fillStyle = 'rgba(240, 136, 62, 0.25)';
    ctx.fillRect(sx, 0, ex - sx, h);

    // Selected region border lines
    ctx.strokeStyle = '#f0883e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, 0); ctx.lineTo(sx, h);
    ctx.moveTo(ex, 0); ctx.lineTo(ex, h);
    ctx.stroke();

    // Playhead — sub-pixel positioning for smooth motion
    const px = (p / d) * w;
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - 1, 0, 2, h);
    ctx.restore();

    // Start handle
    drawHandle(ctx, sx, h);
    // End handle
    drawHandle(ctx, ex, h);
  }, []);

  function drawHandle(ctx: CanvasRenderingContext2D, x: number, h: number) {
    const hx = x - HANDLE_W / 2;
    const hy = (h - HANDLE_H) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#f0883e';
    ctx.beginPath();
    ctx.roundRect(hx, hy, HANDLE_W, HANDLE_H, 2);
    ctx.fill();
    ctx.restore();

    // Grip lines
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 2, hy + 6);
      ctx.lineTo(x + i * 2, hy + HANDLE_H - 6);
      ctx.stroke();
    }
  }

  // ─── Resize observer ──────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const sync = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cw.current = rect.width;
      ch.current = rect.height;
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      draw();
    };

    const ro = new ResizeObserver(sync);
    ro.observe(container);
    sync();
    return () => ro.disconnect();
  }, [draw]);

  // ─── Redraw when props change while paused ────────────────────
  useEffect(() => {
    if (!playing) requestDraw();
  }, [start, end, playhead, duration, playing, requestDraw]);

  // ─── rAF playback loop ────────────────────────────────────────
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafLoop.current);
      return;
    }
    const tick = () => {
      const video = videoRef?.current;
      if (video) playRef.current = video.currentTime;
      draw();
      if (timeTextRef.current) timeTextRef.current.textContent = fmt(playRef.current);
      rafLoop.current = requestAnimationFrame(tick);
    };
    rafLoop.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafLoop.current);
  }, [playing, draw, videoRef]);

  // ─── Seek when playhead changes externally (paused) ───────────
  useEffect(() => {
    if (!playing) {
      playRef.current = playhead;
      requestDraw();
    }
  }, [playhead, playing, requestDraw]);

  // ─── Mouse interaction ────────────────────────────────────────
  const getZone = useCallback((clientX: number): 'start' | 'end' | 'track' => {
    const canvas = canvasRef.current;
    if (!canvas) return 'track';
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const sx = timeToX(startRef.current);
    const ex = timeToX(endRef.current);
    if (Math.abs(x - sx) <= HANDLE_W / 2 + HIT_PAD) return 'start';
    if (Math.abs(x - ex) <= HANDLE_W / 2 + HIT_PAD) return 'end';
    return 'track';
  }, [timeToX]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const zone = getZone(e.clientX);

    if (zone === 'track' || disabled) {
      onSeekRef.current?.(xToTime(e.clientX));
      return;
    }

    // Drag handle
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMove = (ev: MouseEvent) => {
      const time = xToTime(ev.clientX);
      if (zone === 'start') {
        const ns = Math.max(0, Math.min(time, endRef.current - 0.1));
        onChangeRef.current(ns, endRef.current);
        onSeekRef.current?.(ns);
      } else {
        const ne = Math.min(durRef.current, Math.max(time, startRef.current + 0.1));
        onChangeRef.current(startRef.current, ne);
        onSeekRef.current?.(ne);
      }
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [disabled, getZone, xToTime]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const zone = getZone(e.clientX);
    canvasRef.current!.style.cursor =
      (!disabled && zone !== 'track') ? 'col-resize' : 'pointer';
  }, [disabled, getZone]);

  const isTrimmed = duration > 0 && (start > 0.05 || end < duration - 0.05);

  return (
    <div className={`${dc('TrimTrack')} px-4 py-2 border-t border-border shrink-0`}>
      <div className="flex items-center gap-3">
        {togglePlay && (
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-accent hover:bg-accent-dim transition-colors shrink-0"
          >
            {playing
              ? <Pause size={13} className="text-white" fill="white" />
              : <Play  size={13} className="text-white ml-0.5" fill="white" />}
          </button>
        )}

        <div ref={containerRef} className="flex-1 h-6">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            className={`w-full h-full block ${disabled ? 'opacity-40' : ''}`}
          />
        </div>

        <span ref={timeTextRef} className="text-xxs text-text-2 font-mono w-16 tabular-nums text-right">{fmt(playhead)}</span>
      </div>

      <div className="flex items-center justify-between mt-1 h-4">
        <span className="text-[10px] text-muted">
          {isTrimmed
            ? `${t('trim.selected')}: ${fmt(end - start)}`
            : t('trim.hint')}
        </span>
        {isTrimmed && onReset && (
          <button onClick={onReset} className="text-[10px] text-muted hover:text-accent-h transition-colors">
            {t('trim.reset')}
          </button>
        )}
      </div>
    </div>
  );
}
