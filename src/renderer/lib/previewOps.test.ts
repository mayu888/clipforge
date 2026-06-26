import { describe, it, expect } from 'vitest';
import { buildPreviewOps, computeSizes } from './previewOps';

describe('buildPreviewOps', () => {
  it('single mode: selected rotate → one rotate op with its param', () => {
    const ops = buildPreviewOps('single', 'rotate', { direction: '90ccw' }, []);
    expect(ops).toEqual([{ kind: 'rotate', direction: '90ccw' }]);
  });

  it('single mode: rotate with no param defaults to none → empty chain', () => {
    const ops = buildPreviewOps('single', 'rotate', {}, []);
    expect(ops).toEqual([]);
  });

  it('single mode: rotate explicitly set to none → empty chain', () => {
    const ops = buildPreviewOps('single', 'rotate', { direction: 'none' }, []);
    expect(ops).toEqual([]);
  });

  it('single mode: crop with explicit size produces a crop op', () => {
    const ops = buildPreviewOps('single', 'crop', { x: 0, y: 0, w: 100, h: 80 }, []);
    expect(ops).toEqual([{ kind: 'crop', x: 0, y: 0, w: 100, h: 80 }]);
  });

  it('single mode: crop with no size (default 0) → empty chain', () => {
    const ops = buildPreviewOps('single', 'crop', {}, []);
    expect(ops).toEqual([]);
  });

  it('single mode: pad with explicit size produces a pad op', () => {
    const ops = buildPreviewOps('single', 'pad', { width: 1920, height: 1080, color: 'black' }, []);
    expect(ops).toEqual([{ kind: 'pad', width: 1920, height: 1080, color: 'black' }]);
  });

  it('single mode: pad with no size (default 0) → empty chain', () => {
    const ops = buildPreviewOps('single', 'pad', {}, []);
    expect(ops).toEqual([]);
  });

  it('single mode: non-geometry op → empty chain', () => {
    const ops = buildPreviewOps('single', 'speed', { multiplier: '2' }, []);
    expect(ops).toEqual([]);
  });

  it('single mode: no selection → empty chain', () => {
    expect(buildPreviewOps('single', null, {}, [])).toEqual([]);
  });

  it('stack mode: keeps only active geometry ops, in order', () => {
    const stack = [
      { opId: 'rotate', params: { direction: '180' } },
      { opId: 'speed', params: { multiplier: '2' } },
      { opId: 'crop', params: { x: 10, y: 20, w: 300, h: 200 } },
      { opId: 'pad', params: { width: 1920, height: 1080, color: 'black' } },
    ];
    const ops = buildPreviewOps('stack', null, {}, stack);
    expect(ops).toEqual([
      { kind: 'rotate', direction: '180' },
      { kind: 'crop', x: 10, y: 20, w: 300, h: 200 },
      { kind: 'pad', width: 1920, height: 1080, color: 'black' },
    ]);
  });

  it('stack mode: skips ops left in their original/none state', () => {
    const stack = [
      { opId: 'rotate', params: {} },                       // none → skipped
      { opId: 'crop', params: { x: 5, y: 5, w: 200, h: 150 } },
      { opId: 'pad', params: {} },                          // size 0 → skipped
    ];
    const ops = buildPreviewOps('stack', null, {}, stack);
    expect(ops).toEqual([{ kind: 'crop', x: 5, y: 5, w: 200, h: 150 }]);
  });


  it('stack mode: empty stack → empty chain', () => {
    expect(buildPreviewOps('stack', null, {}, [])).toEqual([]);
  });
});

describe('computeSizes', () => {
  it('empty chain → final equals source', () => {
    expect(computeSizes(1920, 1080, [])).toEqual({ final: { w: 1920, h: 1080 }, steps: [] });
  });

  it('rotate 90cw swaps dimensions', () => {
    const r = computeSizes(1920, 1080, [{ kind: 'rotate', direction: '90cw' }]);
    expect(r.final).toEqual({ w: 1080, h: 1920 });
  });

  it('rotate 90ccw swaps dimensions', () => {
    const r = computeSizes(1920, 1080, [{ kind: 'rotate', direction: '90ccw' }]);
    expect(r.final).toEqual({ w: 1080, h: 1920 });
  });

  it('rotate 180 / hflip / vflip keep dimensions', () => {
    expect(computeSizes(1920, 1080, [{ kind: 'rotate', direction: '180' }]).final).toEqual({ w: 1920, h: 1080 });
    expect(computeSizes(1920, 1080, [{ kind: 'rotate', direction: 'hflip' }]).final).toEqual({ w: 1920, h: 1080 });
    expect(computeSizes(1920, 1080, [{ kind: 'rotate', direction: 'vflip' }]).final).toEqual({ w: 1920, h: 1080 });
  });

  it('crop sets size to crop w/h', () => {
    const r = computeSizes(1920, 1080, [{ kind: 'crop', x: 10, y: 20, w: 300, h: 200 }]);
    expect(r.final).toEqual({ w: 300, h: 200 });
  });

  it('pad sets size to pad width/height', () => {
    const r = computeSizes(640, 360, [{ kind: 'pad', width: 1920, height: 1080, color: 'black' }]);
    expect(r.final).toEqual({ w: 1920, h: 1080 });
  });

  it('chained: rotate 90cw then crop is based on rotated frame', () => {
    // 1920x1080 → rotate 90cw → 1080x1920 → crop 500x800
    const r = computeSizes(1920, 1080, [
      { kind: 'rotate', direction: '90cw' },
      { kind: 'crop', x: 0, y: 0, w: 500, h: 800 },
    ]);
    expect(r.steps).toEqual([{ w: 1080, h: 1920 }, { w: 500, h: 800 }]);
    expect(r.final).toEqual({ w: 500, h: 800 });
  });
});
