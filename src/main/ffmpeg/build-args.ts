import path from 'node:path';

export type OpType =
  | 'convert' | 'resize' | 'stripmeta' | 'gif'
  | 'crop' | 'rotate' | 'pad' | 'adjust' | 'denoise' | 'sharpen' | 'thumbnail' | 'delogo'
  | 'speed' | 'reverse' | 'boomerang' | 'loop' | 'fade'
  | 'extractaudio' | 'mute' | 'volume' | 'normalize'
  | 'concat' | 'sxs' | 'pip' | 'overlay' | 'mixaudio' | 'subtitles'
  | 'info' | 'raw';

export interface OpEntry {
  type: OpType;
  params: Record<string, any>;
}

export interface ProcessRequest {
  inputPath: string;
  outputPath: string;
  trim?: { start: number; end: number };
  outputFormat: string;
  op?: OpEntry;
  stack?: OpEntry[];
  extraInputs?: { logo?: string; audio?: string; clip2?: string; subs?: string };
  totalDurationSec?: number;
}

/** Video codec by output extension */
function videoCodec(ext: string): string[] {
  switch (ext) {
    case 'mp4': case 'mov':
      // +faststart relocates the moov atom to the front so the file can be
      // streamed/previewed progressively (otherwise players can't start until
      // the whole file is read). yuv420p maximizes player compatibility.
      return ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart'];
    case 'mkv':
      return ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k'];
    case 'webm':
      return ['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus'];
    case 'avi':
      return ['-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'libmp3lame', '-q:a', '2'];
    case 'gif':
      return ['-an'];
    default:
      return ['-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart'];
  }
}

function audioCodec(ext: string): string[] {
  switch (ext) {
    case 'mp3': return ['-c:a', 'libmp3lame', '-q:a', '2'];
    case 'wav': return ['-c:a', 'pcm_s16le'];
    case 'aac': case 'm4a': return ['-c:a', 'aac', '-b:a', '192k'];
    case 'ogg': return ['-c:a', 'libvorbis', '-q:a', '5'];
    case 'flac': return ['-c:a', 'flac'];
    default: return ['-c:a', 'libmp3lame', '-q:a', '2'];
  }
}

/** Build ffmpeg argument array from a ProcessRequest */
export function composeArgs(req: ProcessRequest): string[] {
  const args: string[] = [];
  const outExt = path.extname(req.outputPath).slice(1).toLowerCase() || req.outputFormat || 'mp4';

  // Trim: input-side seek
  if (req.trim) {
    args.push('-ss', String(req.trim.start));
    if (req.trim.end > req.trim.start) {
      args.push('-t', String(req.trim.end - req.trim.start));
    }
  }

  // Main input
  args.push('-i', req.inputPath);

  // Extra inputs
  if (req.extraInputs?.clip2) {
    args.push('-i', req.extraInputs.clip2);
  }
  if (req.extraInputs?.logo) {
    args.push('-i', req.extraInputs.logo);
  }
  if (req.extraInputs?.audio) {
    args.push('-stream_loop', '-1', '-i', req.extraInputs.audio);
  }
  if (req.extraInputs?.subs) {
    // Subtitles use -i as well
    args.push('-i', req.extraInputs.subs);
  }

  // Single operation or stack
  if (req.stack && req.stack.length > 0) {
    const vfFilters: string[] = [];
    const afFilters: string[] = [];

    for (const op of req.stack) {
      const { vf, af } = opToFilters(op);
      if (vf) vfFilters.push(vf);
      if (af) afFilters.push(af);
    }

    if (vfFilters.length) args.push('-vf', vfFilters.join(','));
    if (afFilters.length) args.push('-af', afFilters.join(','));
    args.push(...videoCodec(outExt));
  } else if (req.op) {
    const opArgs = buildSingleOpArgs(req.op, outExt, req.extraInputs, req.totalDurationSec);
    args.push(...opArgs);
  } else {
    // No operation — just copy/convert
    args.push(...videoCodec(outExt));
  }

  // Output
  args.push(req.outputPath);
  return args;
}

/** Convert a single operation to video/audio filter strings */
function opToFilters(op: OpEntry): { vf?: string; af?: string } {
  const p = op.params;
  switch (op.type) {
    case 'crop': {
      const w = Number(p.w);
      const h = Number(p.h);
      // No positive size → "original" state, emit no filter.
      if (!(w > 0) || !(h > 0)) return {};
      return { vf: `crop=${w}:${h}:${Number(p.x) || 0}:${Number(p.y) || 0}` };
    }
    case 'delogo': {
      // ffmpeg delogo 滤镜要求：x >= 1, y >= 1, y+h < videoHeight
      const x = Math.max(1, Math.round(Number(p.x) || 0));
      const y = Math.max(1, Math.round(Number(p.y) || 0));
      const w = Math.max(10, Math.round(Number(p.w) || 10));
      const h = Math.max(10, Math.round(Number(p.h) || 10));

      return { vf: `delogo=x=${x}:y=${y}:w=${w}:h=${h}` };
    }
    case 'resize':
      return { vf: `scale=${p.width || 1280}:${p.height || 720}` };
    case 'rotate':
      if (p.direction === '90cw') return { vf: 'transpose=1' };
      if (p.direction === '90ccw') return { vf: 'transpose=2' };
      if (p.direction === '180') return { vf: 'transpose=1,transpose=1' };
      if (p.direction === 'hflip') return { vf: 'hflip' };
      if (p.direction === 'vflip') return { vf: 'vflip' };
      // 'none' or unset → no rotation.
      return {};
    case 'adjust': {
      const parts: string[] = [];
      if (p.brightness != null) parts.push(`brightness=${p.brightness}`);
      if (p.contrast != null) parts.push(`contrast=${p.contrast}`);
      if (p.saturation != null) parts.push(`saturation=${p.saturation}`);
      let vf = parts.length ? `eq=${parts.join(':')}` : '';
      if (p.grayscale === 'full') vf += vf ? ',format=gray' : 'format=gray';
      return { vf: vf || undefined };
    }
    case 'denoise': {
      const strength = p.strength === 'light' ? '3:3:5:5' : p.strength === 'heavy' ? '10:10:15:15' : '6:6:10:10';
      return { vf: `hqdn3d=${strength}` };
    }
    case 'sharpen': {
      if (p.mode === 'blur') return { vf: `boxblur=${p.sigma || 1}` };
      return { vf: `unsharp=5:5:${p.sigma || 1}` };
    }
    case 'speed': {
      const mult = Number(p.multiplier) || 1;
      const vf = `setpts=${(1 / mult).toFixed(4)}*PTS`;
      // atempo only accepts 0.5-2.0, chain for larger
      let af = '';
      if (mult > 2) {
        const chains = [];
        let remaining = mult;
        while (remaining > 2) { chains.push('atempo=2.0'); remaining /= 2; }
        chains.push(`atempo=${remaining.toFixed(4)}`);
        af = chains.join(',');
      } else if (mult < 0.5) {
        const chains = [];
        let remaining = mult;
        while (remaining < 0.5) { chains.push('atempo=0.5'); remaining /= 0.5; }
        chains.push(`atempo=${remaining.toFixed(4)}`);
        af = chains.join(',');
      } else {
        af = `atempo=${mult.toFixed(4)}`;
      }
      return { vf, af };
    }
    case 'fade':
      return {
        vf: `fade=t=in:st=0:d=${p.fadeIn || 1}`,
        af: `afade=t=in:st=0:d=${p.fadeIn || 1}`,
      };
    case 'pad': {
      const width = Number(p.width);
      const height = Number(p.height);
      // No positive size → "original" state, emit no filter.
      if (!(width > 0) || !(height > 0)) return {};
      return { vf: `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:${p.color || 'black'}` };
    }
    case 'volume':
      return { af: `volume=${p.level || 1}` };
    default:
      return {};
  }
}

/** Build args for a single (non-stack) operation */
function buildSingleOpArgs(op: OpEntry, outExt: string, _extra?: ProcessRequest['extraInputs'], totalDurationSec?: number): string[] {
  const p = op.params;
  const args: string[] = [];

  switch (op.type) {
    case 'convert':
      if (outExt === 'gif') {
        args.push('-vf', `fps=${p.fps || 10},scale=${p.width || 480}:-2:flags=lanczos`);
        args.push('-an');
      } else if (['mp3', 'wav', 'aac', 'ogg', 'flac'].includes(outExt)) {
        args.push('-vn', ...audioCodec(outExt));
      } else {
        args.push(...videoCodec(outExt));
      }
      break;

    case 'resize':
      args.push('-vf', `scale=${p.width || 1280}:${p.height || 720}`);
      args.push(...videoCodec(outExt));
      break;

    case 'stripmeta':
      args.push('-map_metadata', '-1');
      args.push(...videoCodec(outExt));
      break;

    case 'gif':
      args.push('-vf', `fps=${p.fps || 10},scale=${p.width || 480}:-2:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`);
      args.push('-an');
      break;

    case 'crop': {
      const vf = opToFilters(op).vf;
      if (vf) args.push('-vf', vf);
      args.push(...videoCodec(outExt));
      break;
    }

    case 'delogo': {
      // 使用 crop+高斯模糊+半透明叠加 方案，支持贴边水印且效果自然
      const x = Math.max(0, Math.round(Number(p.x) || 0));
      const y = Math.max(0, Math.round(Number(p.y) || 0));
      const w = Math.max(10, Math.round(Number(p.w) || 10));
      const h = Math.max(10, Math.round(Number(p.h) || 10));
      args.push('-filter_complex', `[0:v]split[a][b];[b]crop=${w}:${h}:${x}:${y},gblur=sigma=30,format=rgba,colorchannelmixer=aa=0.7[b2];[a][b2]overlay=${x}:${y}[out]`);
      args.push('-map', '[out]', '-map', '0:a?');
      args.push(...videoCodec(outExt));
      break;
    }

    case 'rotate': {
      const vf = opToFilters(op).vf;
      if (vf) args.push('-vf', vf);
      args.push(...videoCodec(outExt));
      break;
    }

    case 'pad': {
      const vf = opToFilters(op).vf;
      if (vf) args.push('-vf', vf);
      args.push(...videoCodec(outExt));
      break;
    }

    case 'adjust': {
      const vf = opToFilters(op).vf;
      if (vf) args.push('-vf', vf);
      args.push(...videoCodec(outExt));
      break;
    }

    case 'denoise': {
      const vf = opToFilters(op).vf;
      if (vf) args.push('-vf', vf);
      args.push(...videoCodec(outExt));
      break;
    }

    case 'sharpen': {
      const vf = opToFilters(op).vf;
      if (vf) args.push('-vf', vf);
      args.push(...videoCodec(outExt));
      break;
    }

    case 'thumbnail':
      args.push('-ss', p.timestamp || '00:00:01');
      args.push('-vframes', '1');
      if (outExt === 'jpg' || outExt === 'jpeg') args.push('-q:v', '2');
      break;

    case 'speed': {
      const filters = opToFilters(op);
      if (filters.vf) args.push('-vf', filters.vf);
      if (filters.af) args.push('-af', filters.af);
      args.push(...videoCodec(outExt));
      break;
    }

    case 'reverse':
      args.push('-vf', 'reverse', '-af', 'areverse');
      args.push(...videoCodec(outExt));
      break;

    case 'boomerang':
      args.push('-filter_complex', '[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0');
      args.push('-an');
      args.push(...videoCodec(outExt));
      break;

    case 'loop':
      // -stream_loop must be before -i; we already added -i, so use filter
      args.push('-vf', `loop=loop=${p.count || 3}:size=1:start=0`);
      args.push(...videoCodec(outExt));
      break;

    case 'fade': {
      const fadeIn = Number(p.fadeIn) || 0;
      const fadeOut = Number(p.fadeOut) || 0;
      const vfParts: string[] = [];
      const afParts: string[] = [];
      if (fadeIn > 0) {
        vfParts.push(`fade=t=in:st=0:d=${fadeIn}`);
        afParts.push(`afade=t=in:st=0:d=${fadeIn}`);
      }
      if (fadeOut > 0 && totalDurationSec && totalDurationSec > fadeOut) {
        const st = (totalDurationSec - fadeOut).toFixed(3);
        vfParts.push(`fade=t=out:st=${st}:d=${fadeOut}`);
        afParts.push(`afade=t=out:st=${st}:d=${fadeOut}`);
      }
      if (vfParts.length) args.push('-vf', vfParts.join(','));
      if (afParts.length) args.push('-af', afParts.join(','));
      args.push(...videoCodec(outExt));
      break;
    }

    case 'extractaudio':
      args.push('-vn', ...audioCodec(outExt));
      break;

    case 'mute':
      args.push('-an');
      args.push(...videoCodec(outExt));
      break;

    case 'volume':
      args.push('-af', `volume=${p.level || 1}`);
      args.push('-c:v', 'copy');
      break;

    case 'normalize':
      args.push('-af', `loudnorm=I=${p.target || '-16'}:LRA=11:TP=-1.5`);
      args.push('-c:v', 'copy');
      break;

    case 'concat':
      args.push('-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]');
      args.push('-map', '[outv]', '-map', '[outa]');
      args.push(...videoCodec(outExt));
      break;

    case 'sxs':
      args.push('-filter_complex', `[0:v][1:v]${p.layout === 'vertical' ? 'vstack' : 'hstack'}[out]`);
      args.push('-map', '[out]');
      args.push(...videoCodec(outExt));
      break;

    case 'pip': {
      const scale = p.scale || 0.25;
      const posMap: Record<string, string> = {
        'top-left': '10:10',
        'top-right': 'W-w-10:10',
        'bottom-left': '10:H-h-10',
        'bottom-right': 'W-w-10:H-h-10',
      };
      const pos = posMap[p.position || 'bottom-right'];
      const videoGraph = `[1:v]scale=iw*${scale}:-2[p];[0:v][p]overlay=${pos}[out]`;
      if (p.audio === 'mix') {
        // Map both audio tracks with '?' so missing tracks are silently skipped.
        args.push('-filter_complex', videoGraph);
        args.push('-map', '[out]', '-map', '0:a?', '-map', '1:a?');
      } else if (p.audio === 'none') {
        args.push('-filter_complex', videoGraph);
        args.push('-map', '[out]', '-an');
      } else {
        args.push('-filter_complex', videoGraph);
        const audioMap = p.audio === 'pip' ? '1:a?' : '0:a?';
        args.push('-map', '[out]', '-map', audioMap);
      }
      args.push(...videoCodec(outExt));
      break;
    }

    case 'overlay': {
      const posMap: Record<string, string> = {
        '10:10': '10:10',
        'top-right': 'W-w-10:10',
        'bottom-left': '10:H-h-10',
        'bottom-right': 'W-w-10:H-h-10',
        'center': '(W-w)/2:(H-h)/2',
      };
      const pos = posMap[p.position || 'bottom-right'] || p.position || 'W-w-10:H-h-10';
      const opacity = typeof p.opacity === 'number' ? p.opacity : 1;
      const logoWidth = p.logoWidth || 120;
      if (opacity < 1) {
        args.push('-filter_complex', `[1:v]scale=${logoWidth}:-2[lgs];[lgs]format=rgba,colorchannelmixer=aa=${opacity}[lg];[0:v][lg]overlay=${pos}:format=auto[out]`);
      } else {
        args.push('-filter_complex', `[1:v]scale=${logoWidth}:-2[lg];[0:v][lg]overlay=${pos}:format=auto[out]`);
      }
      args.push('-map', '[out]', '-map', '0:a?');
      args.push(...videoCodec(outExt));
      break;
    }

    case 'mixaudio':
      args.push('-filter_complex', `[0:a][1:a]amix=inputs=2:duration=shortest:weights=${p.vol1 || 1} ${p.vol2 || 1}[outa]`);
      args.push('-map', '0:v?', '-map', '[outa]');
      args.push(...videoCodec(outExt));
      break;

    case 'subtitles':
      // The subs file is already added as an extra input
      args.push('-c:v', 'copy', '-c:a', 'copy');
      if (outExt === 'mp4') {
        args.push('-c:s', 'mov_text');
      } else {
        args.push('-c:s', 'srt');
      }
      break;

    case 'info':
      // Info doesn't produce output — handled separately
      break;

    case 'raw':
      // Parse raw command string into args
      if (p.command) {
        const rawArgs = (p.command as string).split(/\s+/).filter(Boolean);
        args.push(...rawArgs);
      }
      break;
  }

  return args;
}
