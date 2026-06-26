import { OPERATIONS } from './op-schema';

export type PreviewOp =
  | { kind: 'rotate'; direction: '90cw' | '90ccw' | '180' | 'hflip' | 'vflip' }
  | { kind: 'crop'; x: number; y: number; w: number; h: number }
  | { kind: 'pad'; width: number; height: number; color: string };

export interface StackItemLike { opId: string; params: Record<string, any>; }

const GEOMETRY_OPS = new Set(['rotate', 'crop', 'pad']);

/** Merge op-schema defaults under the provided params (matches export behavior). */
function withDefaults(opId: string, params: Record<string, any>): Record<string, any> {
  const def = OPERATIONS.find((o) => o.id === opId);
  const merged: Record<string, any> = {};
  if (def) {
    for (const p of def.params) {
      if (p.default !== undefined) merged[p.key] = p.default;
    }
  }
  return { ...merged, ...params };
}

/** Convert one (opId, params) into a PreviewOp, or null if not a geometry op
 *  or if the op is still in its original/no-op state (rotate=none, crop/pad
 *  with no positive size). A null result means "draw the frame unchanged". */
function toPreviewOp(opId: string, rawParams: Record<string, any>): PreviewOp | null {
  if (!GEOMETRY_OPS.has(opId)) return null;
  const p = withDefaults(opId, rawParams);
  switch (opId) {
    case 'rotate':
      if (!p.direction || p.direction === 'none') return null;
      return { kind: 'rotate', direction: p.direction };
    case 'crop': {
      const w = Number(p.w);
      const h = Number(p.h);
      if (!(w > 0) || !(h > 0)) return null;
      return { kind: 'crop', x: Number(p.x) || 0, y: Number(p.y) || 0, w, h };
    }
    case 'pad': {
      const width = Number(p.width);
      const height = Number(p.height);
      if (!(width > 0) || !(height > 0)) return null;
      return { kind: 'pad', width, height, color: p.color };
    }
    default:
      return null;
  }
}

export function buildPreviewOps(
  mode: string,
  selectedOpId: string | null,
  params: Record<string, any>,
  stack: StackItemLike[],
): PreviewOp[] {
  if (mode === 'stack') {
    return stack
      .map((item) => toPreviewOp(item.opId, item.params))
      .filter((op): op is PreviewOp => op !== null);
  }
  if (!selectedOpId) return [];
  const op = toPreviewOp(selectedOpId, params);
  return op ? [op] : [];
}

export interface Size { w: number; h: number; }

export function computeSizes(
  srcW: number,
  srcH: number,
  ops: PreviewOp[],
): { final: Size; steps: Size[] } {
  let cur: Size = { w: srcW, h: srcH };
  const steps: Size[] = [];
  for (const op of ops) {
    if (op.kind === 'rotate') {
      if (op.direction === '90cw' || op.direction === '90ccw') {
        cur = { w: cur.h, h: cur.w };
      }
      // 180 / hflip / vflip leave size unchanged
    } else if (op.kind === 'crop') {
      cur = { w: op.w, h: op.h };
    } else if (op.kind === 'pad') {
      cur = { w: op.width, h: op.height };
    }
    steps.push({ ...cur });
  }
  return { final: { ...cur }, steps };
}
