import { computeSizes, type PreviewOp, type Size } from './previewOps';

export interface Viewport { width: number; height: number; }

/**
 * Render the current video frame through the geometry op chain into ctx.
 * The drawing-buffer is assumed to already be sized to `viewport` * dpr by the
 * caller; we draw in CSS-pixel space via setTransform(dpr,...).
 *
 * Strategy: render the *final* transformed frame into an offscreen buffer at
 * the chain's final pixel size, then letterbox-fit that buffer into the
 * viewport. Each op is applied to the running offscreen buffer in order, so
 * crop/pad/rotate compose exactly like ffmpeg's left-to-right filter chain.
 */
export function drawPreview(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  ops: PreviewOp[],
  viewport: Viewport,
): void {
  const srcW = video.videoWidth;
  const srcH = video.videoHeight;
  const dpr = window.devicePixelRatio || 1;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, viewport.width, viewport.height);

  // Not ready yet — nothing to draw.
  if (!srcW || !srcH) return;

  // Build the transformed frame in an offscreen canvas.
  const { final } = computeSizes(srcW, srcH, ops);
  let buffer = makeCanvas(srcW, srcH);
  let bctx = buffer.getContext('2d')!;
  bctx.drawImage(video, 0, 0, srcW, srcH);

  for (const op of ops) {
    buffer = applyOp(buffer, op);
  }

  // Letterbox-fit the final buffer into the viewport.
  const scale = Math.min(viewport.width / final.w, viewport.height / final.h);
  const dw = final.w * scale;
  const dh = final.h * scale;
  const dx = (viewport.width - dw) / 2;
  const dy = (viewport.height - dh) / 2;
  ctx.drawImage(buffer, dx, dy, dw, dh);
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Apply a single op to a source canvas, returning a new canvas. */
function applyOp(src: HTMLCanvasElement, op: PreviewOp): HTMLCanvasElement {
  if (op.kind === 'rotate') return applyRotate(src, op.direction);
  if (op.kind === 'crop') return applyCrop(src, op);
  return applyPad(src, op);
}

function applyRotate(
  src: HTMLCanvasElement,
  dir: '90cw' | '90ccw' | '180' | 'hflip' | 'vflip',
): HTMLCanvasElement {
  const w = src.width;
  const h = src.height;
  const swap = dir === '90cw' || dir === '90ccw';
  const out = makeCanvas(swap ? h : w, swap ? w : h);
  const ctx = out.getContext('2d')!;

  ctx.save();
  switch (dir) {
    case '90cw':
      ctx.translate(out.width, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case '90ccw':
      ctx.translate(0, out.height);
      ctx.rotate(-Math.PI / 2);
      break;
    case '180':
      ctx.translate(out.width, out.height);
      ctx.rotate(Math.PI);
      break;
    case 'hflip':
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
      break;
    case 'vflip':
      ctx.translate(0, out.height);
      ctx.scale(1, -1);
      break;
  }
  ctx.drawImage(src, 0, 0);
  ctx.restore();
  return out;
}

function applyCrop(
  src: HTMLCanvasElement,
  op: { x: number; y: number; w: number; h: number },
): HTMLCanvasElement {
  // Clamp to source bounds so an oversized crop never throws.
  const x = clamp(op.x, 0, src.width);
  const y = clamp(op.y, 0, src.height);
  const w = clamp(op.w, 1, src.width - x);
  const h = clamp(op.h, 1, src.height - y);
  const out = makeCanvas(op.w, op.h);
  const ctx = out.getContext('2d')!;
  ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
  return out;
}

function applyPad(
  src: HTMLCanvasElement,
  op: { width: number; height: number; color: string },
): HTMLCanvasElement {
  const out = makeCanvas(op.width, op.height);
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = op.color;
  ctx.fillRect(0, 0, out.width, out.height);
  // Center the source frame (matches pad=(ow-iw)/2:(oh-ih)/2).
  const dx = Math.floor((out.width - src.width) / 2);
  const dy = Math.floor((out.height - src.height) / 2);
  ctx.drawImage(src, dx, dy);
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// Re-export Size so consumers can import from one module if desired.
export type { Size };
