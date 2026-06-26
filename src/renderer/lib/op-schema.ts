import {
  Repeat, Minimize2, Eraser, Film,
  Crop, RotateCw, Expand, SlidersHorizontal, Sparkles, Eye, Image,
  Gauge, Rewind, Repeat2, Repeat1, CircleDashed,
  Music, VolumeX, Volume2, AudioWaveform,
  Link, Columns, PictureInPicture2, Stamp, Headphones, Subtitles,
  Info, Terminal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ParamField {
  key: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'toggle' | 'file';
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  default?: string | number | boolean;
}

export interface OperationDef {
  id: string;
  name: string;
  icon: LucideIcon;
  group: string;
  description: string;
  chainable: boolean;
  batchSupported: boolean;
  params: ParamField[];
}

export const OPERATIONS: OperationDef[] = [
  // ─── 转码压缩 ───
  { id: 'convert', name: 'Convert 转格式', icon: Repeat, group: '转码压缩', description: '转换输出格式', chainable: false, batchSupported: true, params: [
    { key: 'format', label: '输出格式', type: 'select', default: 'mp4', options: [
      { label: 'MP4 (H.264)', value: 'mp4' }, { label: 'WebM (VP9)', value: 'webm' },
      { label: 'MKV', value: 'mkv' }, { label: 'MOV', value: 'mov' },
      { label: 'AVI', value: 'avi' }, { label: 'GIF', value: 'gif' },
    ]},
  ]},
  { id: 'resize', name: 'Resize & Compress', icon: Minimize2, group: '转码压缩', description: '缩放并压缩', chainable: true, batchSupported: true, params: [
    { key: 'width', label: '宽度', type: 'number', default: 1280, min: 16, max: 7680, step: 2 },
    { key: 'height', label: '高度', type: 'number', default: 720, min: 16, max: 4320, step: 2 },
  ]},
  { id: 'stripmeta', name: 'Strip Metadata', icon: Eraser, group: '转码压缩', description: '移除元数据', chainable: false, batchSupported: true, params: [] },
  { id: 'gif', name: 'To GIF', icon: Film, group: '转码压缩', description: '转换为 GIF', chainable: false, batchSupported: true, params: [
    { key: 'fps', label: 'FPS', type: 'select', default: '10', options: [
      { label: '10 fps', value: '10' }, { label: '15 fps', value: '15' }, { label: '24 fps', value: '24' },
    ]},
    { key: 'width', label: '宽度', type: 'number', default: 480, min: 16, max: 1280 },
  ]},

  // ─── 画面 ───
  { id: 'crop', name: 'Crop 裁剪', icon: Crop, group: '画面', description: '裁剪画面区域', chainable: true, batchSupported: false, params: [
    { key: 'x', label: 'X 偏移', type: 'number', default: 0, min: 0 },
    { key: 'y', label: 'Y 偏移', type: 'number', default: 0, min: 0 },
    { key: 'w', label: '宽度', type: 'number', default: 0, min: 0 },
    { key: 'h', label: '高度', type: 'number', default: 0, min: 0 },
  ]},
  { id: 'delogo', name: 'Remove Watermark', icon: Eraser, group: '画面', description: '去除水印', chainable: true, batchSupported: false, params: [
    { key: 'x', label: 'X 偏移', type: 'number', default: 0, min: 0 },
    { key: 'y', label: 'Y 偏移', type: 'number', default: 0, min: 0 },
    { key: 'w', label: '宽度', type: 'number', default: 0, min: 0 },
    { key: 'h', label: '高度', type: 'number', default: 0, min: 0 },
  ]},
  { id: 'rotate', name: 'Rotate / Flip', icon: RotateCw, group: '画面', description: '旋转或翻转', chainable: true, batchSupported: true, params: [
    { key: 'direction', label: '变换', type: 'select', default: 'none', options: [
      { label: '不旋转（原始）', value: 'none' },
      { label: '顺时针 90°', value: '90cw' }, { label: '逆时针 90°', value: '90ccw' },
      { label: '180°', value: '180' }, { label: '水平翻转', value: 'hflip' }, { label: '垂直翻转', value: 'vflip' },
    ]},
  ]},
  { id: 'pad', name: 'Pad / Letterbox', icon: Expand, group: '画面', description: '添加边框', chainable: true, batchSupported: true, params: [
    { key: 'width', label: '宽度', type: 'number', default: 0, min: 0 },
    { key: 'height', label: '高度', type: 'number', default: 0, min: 0 },
    { key: 'color', label: '填充色', type: 'select', default: 'black', options: [
      { label: 'Black', value: 'black' }, { label: 'White', value: 'white' },
    ]},
  ]},
  { id: 'adjust', name: 'Adjust 调色', icon: SlidersHorizontal, group: '画面', description: '亮度/对比度/饱和度', chainable: true, batchSupported: true, params: [
    { key: 'brightness', label: '亮度', type: 'number', default: 0, min: -2, max: 2, step: 0.1 },
    { key: 'contrast', label: '对比度', type: 'number', default: 1, min: 0, max: 3, step: 0.1 },
    { key: 'saturation', label: '饱和度', type: 'number', default: 1, min: 0, max: 3, step: 0.1 },
    { key: 'grayscale', label: '灰度', type: 'select', default: 'off', options: [
      { label: '关闭', value: 'off' }, { label: '全灰度', value: 'full' },
    ]},
  ]},
  { id: 'denoise', name: 'Denoise 降噪', icon: Sparkles, group: '画面', description: '视频降噪', chainable: true, batchSupported: true, params: [
    { key: 'strength', label: '强度', type: 'select', default: 'medium', options: [
      { label: 'Light', value: 'light' }, { label: 'Medium', value: 'medium' }, { label: 'Heavy', value: 'heavy' },
    ]},
  ]},
  { id: 'sharpen', name: 'Sharpen / Blur', icon: Eye, group: '画面', description: '锐化或模糊', chainable: true, batchSupported: true, params: [
    { key: 'mode', label: '模式', type: 'select', default: 'sharpen', options: [
      { label: '锐化', value: 'sharpen' }, { label: '模糊', value: 'blur' },
    ]},
    { key: 'sigma', label: '强度', type: 'number', default: 1, min: 0.1, max: 10, step: 0.1 },
  ]},
  { id: 'thumbnail', name: 'Thumbnail 截帧', icon: Image, group: '画面', description: '截取单帧图片', chainable: false, batchSupported: true, params: [
    { key: 'timestamp', label: '时间点', type: 'text', default: '00:00:01', placeholder: '00:00:01 或 5' },
  ]},

  // ─── 时间速度 ───
  { id: 'speed', name: 'Speed 变速', icon: Gauge, group: '时间速度', description: '调整播放速度', chainable: true, batchSupported: true, params: [
    { key: 'multiplier', label: '倍率', type: 'select', default: '2', options: [
      { label: '0.25×', value: '0.25' }, { label: '0.5×', value: '0.5' },
      { label: '1.5×', value: '1.5' }, { label: '2×', value: '2' }, { label: '4×', value: '4' },
    ]},
  ]},
  { id: 'reverse', name: 'Reverse 倒放', icon: Rewind, group: '时间速度', description: '反转播放', chainable: false, batchSupported: false, params: [] },
  { id: 'boomerang', name: 'Boomerang 回旋', icon: Repeat2, group: '时间速度', description: '正放+倒放循环', chainable: false, batchSupported: false, params: [] },
  { id: 'loop', name: 'Loop 循环', icon: Repeat1, group: '时间速度', description: '循环播放', chainable: false, batchSupported: true, params: [
    { key: 'count', label: '循环次数', type: 'number', default: 3, min: 1, max: 100 },
  ]},
  { id: 'fade', name: 'Fade In/Out', icon: CircleDashed, group: '时间速度', description: '淡入淡出', chainable: true, batchSupported: true, params: [
    { key: 'fadeIn', label: '淡入 (秒)', type: 'number', default: 1, min: 0, max: 60, step: 0.5 },
    { key: 'fadeOut', label: '淡出 (秒)', type: 'number', default: 1, min: 0, max: 60, step: 0.5 },
  ]},

  // ─── 音频 ───
  { id: 'extractaudio', name: 'Extract Audio', icon: Music, group: '音频', description: '提取音频轨道', chainable: false, batchSupported: true, params: [
    { key: 'format', label: '格式', type: 'select', default: 'mp3', options: [
      { label: 'MP3', value: 'mp3' }, { label: 'WAV', value: 'wav' },
      { label: 'AAC', value: 'aac' }, { label: 'FLAC', value: 'flac' }, { label: 'OGG', value: 'ogg' },
    ]},
  ]},
  { id: 'mute', name: 'Mute 静音', icon: VolumeX, group: '音频', description: '移除音频轨道', chainable: false, batchSupported: true, params: [] },
  { id: 'volume', name: 'Volume 音量', icon: Volume2, group: '音频', description: '调整音量', chainable: true, batchSupported: true, params: [
    { key: 'level', label: '音量倍数', type: 'select', default: '1.5', options: [
      { label: '0.5×', value: '0.5' }, { label: '1.5×', value: '1.5' },
      { label: '2×', value: '2' }, { label: '3×', value: '3' },
    ]},
  ]},
  { id: 'normalize', name: 'Normalize', icon: AudioWaveform, group: '音频', description: '响度归一化', chainable: false, batchSupported: true, params: [
    { key: 'target', label: '目标 LUFS', type: 'select', default: '-16', options: [
      { label: '-14 LUFS', value: '-14' }, { label: '-16 LUFS', value: '-16' },
      { label: '-23 LUFS', value: '-23' },
    ]},
  ]},

  // ─── 多输入合成 ───
  { id: 'concat', name: 'Concatenate', icon: Link, group: '多输入合成', description: '拼接多个视频', chainable: false, batchSupported: false, params: [] },
  { id: 'sxs', name: 'Side by Side', icon: Columns, group: '多输入合成', description: '并排对比', chainable: false, batchSupported: false, params: [
    { key: 'layout', label: '方向', type: 'select', default: 'horizontal', options: [
      { label: '水平', value: 'horizontal' }, { label: '垂直', value: 'vertical' },
    ]},
  ]},
  { id: 'pip', name: 'Picture in Picture', icon: PictureInPicture2, group: '多输入合成', description: '画中画', chainable: false, batchSupported: false, params: [
    { key: 'position', label: '位置', type: 'select', default: 'bottom-right', options: [
      { label: '左上', value: 'top-left' }, { label: '右上', value: 'top-right' },
      { label: '左下', value: 'bottom-left' }, { label: '右下', value: 'bottom-right' },
    ]},
    { key: 'scale', label: '缩放', type: 'select', default: '0.25', options: [
      { label: '25%', value: '0.25' }, { label: '33%', value: '0.33' }, { label: '50%', value: '0.5' },
    ]},
    { key: 'audio', label: '声音来源', type: 'select', default: 'main', options: [
      { label: '主视频', value: 'main' }, { label: '画中画视频', value: 'pip' }, { label: '两者混合', value: 'mix' }, { label: '无声音', value: 'none' },
    ]},
  ]},
  { id: 'overlay', name: 'Logo Overlay', icon: Stamp, group: '多输入合成', description: '添加水印', chainable: false, batchSupported: false, params: [
    { key: 'position', label: '位置', type: 'select', default: 'bottom-right', options: [
      { label: '左上', value: '10:10' }, { label: '右上', value: 'top-right' },
      { label: '左下', value: 'bottom-left' }, { label: '右下', value: 'bottom-right' }, { label: '居中', value: 'center' },
    ]},
    { key: 'logoWidth', label: 'Logo 宽度', type: 'number', default: 120, min: 20, max: 800, step: 10 },
    { key: 'opacity', label: '透明度', type: 'number', default: 1, min: 0, max: 1, step: 0.05 },
  ]},
  { id: 'mixaudio', name: 'Mix Audio', icon: Headphones, group: '多输入合成', description: '混合音频', chainable: false, batchSupported: false, params: [
    { key: 'vol1', label: '音量 A', type: 'number', default: 1, min: 0, max: 3, step: 0.1 },
    { key: 'vol2', label: '音量 B', type: 'number', default: 1, min: 0, max: 3, step: 0.1 },
  ]},
  { id: 'subtitles', name: 'Embed Subtitles', icon: Subtitles, group: '多输入合成', description: '嵌入字幕', chainable: false, batchSupported: false, params: [] },

  // ─── 工具 ───
  { id: 'info', name: 'Media Info', icon: Info, group: '工具', description: '查看媒体信息', chainable: false, batchSupported: false, params: [] },
  { id: 'raw', name: 'Raw FFmpeg', icon: Terminal, group: '工具', description: '自定义 FFmpeg 命令', chainable: false, batchSupported: false, params: [
    { key: 'command', label: '参数', type: 'text', default: '', placeholder: '-vf "..." -c:v libx264 ...' },
  ]},
];

export const GROUP_ORDER = ['转码压缩', '画面', '时间速度', '音频', '多输入合成', '工具'];

/** Operations that can be chained in Stack mode */
export const CHAINABLE_IDS = new Set(
  OPERATIONS.filter(o => o.chainable).map(o => o.id)
);
