import { useEffect, useRef, useState } from 'react';
import type { MediaFile } from '../lib/ipc';

const AUDIO_EXTS = /^(mp3|wav|aac|ogg|flac|m4a|wma|opus)$/i;
const IMAGE_EXTS = /^(jpe?g|png|gif|webp|bmp|tiff)$/i;
const VIDEO_EXTS = /^(mp4|mkv|webm|avi|mov|flv|wmv|m4v|ts|mpg|mpeg)$/i;

const cache = new Map<string, string | null>();

function mediaUrl(p: string): string {
  return `media://local${p.split('/').map(encodeURIComponent).join('/')}`;
}

function drawToCanvas(source: HTMLVideoElement | HTMLImageElement): string | null {
  try {
    const W = 128, H = 80;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const sw = 'videoWidth' in source ? source.videoWidth : (source as HTMLImageElement).naturalWidth;
    const sh = 'videoHeight' in source ? source.videoHeight : (source as HTMLImageElement).naturalHeight;
    const scale = Math.max(W / sw, H / sh);
    const dw = sw * scale, dh = sh * scale;
    const dx = (W - dw) / 2, dy = (H - dh) / 2;
    ctx.drawImage(source, dx, dy, dw, dh);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}

export function useThumbnail(file: MediaFile): { thumb: string | null; loading: boolean } {
  const isAudio = AUDIO_EXTS.test(file.ext);
  const [thumb, setThumb] = useState<string | null>(() => cache.get(file.id) ?? null);
  const [loading, setLoading] = useState(() => !isAudio && !cache.has(file.id));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isAudio) return;
    if (cache.has(file.id)) {
      setThumb(cache.get(file.id) ?? null);
      setLoading(false);
      return;
    }

    const url = mediaUrl(file.path);

    if (IMAGE_EXTS.test(file.ext)) {
      const img = new Image();
      img.onload = () => {
        const dataUrl = drawToCanvas(img);
        cache.set(file.id, dataUrl);
        if (mountedRef.current) { setThumb(dataUrl); setLoading(false); }
      };
      img.onerror = () => {
        cache.set(file.id, null);
        if (mountedRef.current) { setThumb(null); setLoading(false); }
      };
      img.src = url;
      return;
    }

    if (VIDEO_EXTS.test(file.ext)) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      const onSeeked = () => {
        const dataUrl = drawToCanvas(video);
        cache.set(file.id, dataUrl);
        if (mountedRef.current) { setThumb(dataUrl); setLoading(false); }
        video.src = '';
      };
      const onError = () => {
        cache.set(file.id, null);
        if (mountedRef.current) { setThumb(null); setLoading(false); }
        video.src = '';
      };
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
      const onMetadata = () => { video.currentTime = 0.1; };
      video.addEventListener('loadedmetadata', onMetadata, { once: true });
      video.src = url;
      return () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        video.removeEventListener('loadedmetadata', onMetadata);
        video.src = '';
      };
    }

    // Unknown format — no thumbnail
    cache.set(file.id, null);
    setThumb(null);
    setLoading(false);
  }, [file.id, file.ext, file.path, isAudio]);

  if (isAudio) return { thumb: null, loading: false };
  return { thumb, loading };
}
