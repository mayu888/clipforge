import { create } from 'zustand';

export type Locale = 'zh' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

// ─── Translation dictionaries ───

const zh: Record<string, string> = {
  // App
  'app.name': 'ClipForge',
  'app.subtitle': '专业视频处理工作站',

  // TitleBar
  'titlebar.checking': '正在检测 FFmpeg…',
  'titlebar.ready': 'FFmpeg 就绪',
  'titlebar.notFound': 'FFmpeg 未找到',

  // Toolbar
  'toolbar.openFile': '打开文件',
  'toolbar.export': '导出 / 渲染',
  'toolbar.mode.single': '单项',
  'toolbar.mode.stack': '操作链',
  'toolbar.mode.batch': '批量',

  // LeftDock
  'leftdock.media': '媒体池',
  'leftdock.ops': '操作库',
  'leftdock.media.empty': '拖入文件 或 点击工具栏"打开文件"',
  'leftdock.media.addFiles': '追加文件',
  'leftdock.media.drop': '拖入文件到此处',
  'leftdock.media.remove': '移除',
  'leftdock.notChainable': '不可链',

  // PreviewCanvas
  'preview.empty.title': '拖入或打开一个文件开始',
  'preview.empty.subtitle': '支持视频、音频、图片格式',
  'preview.dragDrop': '拖放文件以添加',
  'preview.remove': '删除文件',
  'preview.unsupported': '不支持预览此文件格式',
  'preview.trimDisabled': '批量模式下修剪已禁用',
  'preview.input': '原始',
  'preview.output': '输出',

  // Trim
  'trim.hint': '拖动两端把手裁剪时长 · 点击轨道跳转',
  'trim.selected': '已选区间',
  'trim.reset': '重置',

  // Process
  'process.start': '开始处理',
  'process.processing': '处理中…',
  'process.cancel': '取消处理',
  'process.done': '处理完成',
  'process.error': '处理失败',
  'process.retry': '重试',
  'process.again': '再次处理',
  'process.reveal': '在文件夹中显示',

  // Inspector
  'inspector.empty': '从左侧操作库选择一个操作',
  'inspector.noParams': '此操作无需配置参数',
  'inspector.output': '预估输出',
  'inspector.calculating': '~计算中',

  // BottomDock
  'dock.stack': '操作栈',
  'dock.batch': '批量队列',
  'dock.render': '渲染队列',
  'dock.log': '日志',
  'dock.expand': '底部面板',
  'dock.stack.empty': '从操作库拖拽操作到此处构建操作链',
  'dock.stack.clear': '清空栈',
  'dock.batch.empty': '切换到批量模式，从媒体池选择多个文件加入队列',
  'dock.batch.queued': '个文件排队',
  'dock.batch.done': '完成',
  'dock.batch.error': '错误',
  'dock.render.empty': '暂无渲染任务',
  'dock.log.waiting': '等待操作…',
  'dock.log.clear': '清除',

  // Operations groups
  'group.transcode': '转码压缩',
  'group.visual': '画面',
  'group.time': '时间速度',
  'group.audio': '音频',
  'group.composite': '多输入合成',
  'group.tools': '工具',

  // Operations
  'op.convert': '转格式',
  'op.convert.desc': '转换输出格式',
  'op.resize': '缩放压缩',
  'op.resize.desc': '缩放并压缩',
  'op.stripmeta': '去除元数据',
  'op.stripmeta.desc': '移除元数据',
  'op.gif': '转 GIF',
  'op.gif.desc': '转换为 GIF 动图',
  'op.crop': '裁剪',
  'op.crop.desc': '裁剪画面区域',
  'op.delogo': '去水印',
  'op.delogo.desc': '去除视频水印',
  'op.rotate': '旋转/翻转',
  'op.rotate.desc': '旋转或翻转画面',
  'op.pad': '加边框',
  'op.pad.desc': '添加 Letterbox 边框',
  'op.adjust': '调色',
  'op.adjust.desc': '亮度/对比度/饱和度调整',
  'op.denoise': '降噪',
  'op.denoise.desc': '视频降噪处理',
  'op.sharpen': '锐化/模糊',
  'op.sharpen.desc': '锐化或模糊处理',
  'op.thumbnail': '截帧',
  'op.thumbnail.desc': '截取单帧图片',
  'op.speed': '变速',
  'op.speed.desc': '调整播放速度',
  'op.reverse': '倒放',
  'op.reverse.desc': '反转播放',
  'op.boomerang': '回旋',
  'op.boomerang.desc': '正放+倒放循环',
  'op.loop': '循环',
  'op.loop.desc': '循环播放',
  'op.fade': '淡入淡出',
  'op.fade.desc': '视频淡入淡出效果',
  'op.extractaudio': '提取音频',
  'op.extractaudio.desc': '从视频中提取音频轨道',
  'op.mute': '静音',
  'op.mute.desc': '移除音频轨道',
  'op.volume': '音量',
  'op.volume.desc': '调整音量大小',
  'op.normalize': '响度归一化',
  'op.normalize.desc': '音频响度标准化',
  'op.concat': '拼接',
  'op.concat.desc': '拼接多个视频',
  'op.sxs': '并排对比',
  'op.sxs.desc': '两个视频并排显示',
  'sxs.clip2': '第二个视频',
  'sxs.selectClip2': '选择视频',
  'sxs.clip2Selected': '已选择',
  'overlay.logo': 'Logo 图片',
  'overlay.selectLogo': '选择 Logo 图片',
  'subtitles.file': '字幕文件',
  'subtitles.select': '选择字幕文件 (.srt / .ass / .vtt)',
  'op.pip': '画中画',
  'op.pip.desc': '画中画叠加效果',
  'op.overlay': '水印',
  'op.overlay.desc': '添加 Logo 水印',
  'op.mixaudio': '混音',
  'op.mixaudio.desc': '混合多条音频',
  'op.subtitles': '嵌入字幕',
  'op.subtitles.desc': '将字幕嵌入视频',
  'op.info': '媒体信息',
  'op.info.desc': '查看文件媒体信息',
  'op.raw': '原始命令',
  'op.raw.desc': '自定义 FFmpeg 命令',

  // Param labels
  'param.format': '输出格式',
  'param.width': '宽度',
  'param.height': '高度',
  'param.x': 'X 偏移',
  'param.y': 'Y 偏移',
  'param.w': '裁剪宽度',
  'param.h': '裁剪高度',
  'param.direction': '变换',
  'param.color': '填充色',
  'param.brightness': '亮度',
  'param.contrast': '对比度',
  'param.saturation': '饱和度',
  'param.grayscale': '灰度',
  'param.strength': '强度',
  'param.mode': '模式',
  'param.sigma': '系数',
  'param.timestamp': '时间点 (HH:MM:SS 或秒)',
  'param.multiplier': '倍率',
  'param.count': '循环次数',
  'param.fadeIn': '淡入时长 (秒)',
  'param.fadeOut': '淡出时长 (秒)',
  'param.level': '音量倍数',
  'param.target': '目标 LUFS',
  'param.layout': '方向',
  'param.position': '位置',
  'param.scale': '缩放',
  'param.vol1': '音量 A',
  'param.vol2': '音量 B',
  'param.command': '参数',
  'param.fps': '帧率',

  // Param options
  'param.off': '关闭',
  'param.full': '全灰度',
  'param.sharpen': '锐化',
  'param.blur': '模糊',
  'param.horizontal': '水平',
  'param.vertical': '垂直',
  'param.topLeft': '左上',
  'param.topRight': '右上',
  'param.bottomLeft': '左下',
  'param.bottomRight': '右下',
  'param.center': '居中',

  // Rotate directions
  'rotate.90cw': '顺时针 90°',
  'rotate.90ccw': '逆时针 90°',
  'rotate.180': '180°',
  'rotate.hflip': '水平翻转',
  'rotate.vflip': '垂直翻转',

  // Common
  'common.on': '开',
  'common.off': '关',
};

const en: Record<string, string> = {
  // App
  'app.name': 'ClipForge',
  'app.subtitle': 'Professional Video Workstation',

  // TitleBar
  'titlebar.checking': 'Checking FFmpeg…',
  'titlebar.ready': 'FFmpeg Ready',
  'titlebar.notFound': 'FFmpeg Not Found',

  // Toolbar
  'toolbar.openFile': 'Open File',
  'toolbar.export': 'Export / Render',
  'toolbar.mode.single': 'Single',
  'toolbar.mode.stack': 'Stack',
  'toolbar.mode.batch': 'Batch',

  // LeftDock
  'leftdock.media': 'Media Pool',
  'leftdock.ops': 'Operations',
  'leftdock.media.empty': 'Drop files here or click "Open File" in toolbar',
  'leftdock.media.addFiles': 'Add Files',
  'leftdock.media.drop': 'Drop files here',
  'leftdock.media.remove': 'Remove',
  'leftdock.notChainable': 'N/A',

  // PreviewCanvas
  'preview.empty.title': 'Drop or open a file to start',
  'preview.empty.subtitle': 'Supports video, audio, and image formats',
  'preview.dragDrop': 'Drop files to add',
  'preview.remove': 'Remove file',
  'preview.unsupported': 'Cannot preview this file format',
  'preview.trimDisabled': 'Trim is disabled in batch mode',
  'preview.input': 'Input',
  'preview.output': 'Output',

  // Trim
  'trim.hint': 'Drag handles to trim · click track to seek',
  'trim.selected': 'Selected',
  'trim.reset': 'Reset',

  // Process
  'process.start': 'Process',
  'process.processing': 'Processing…',
  'process.cancel': 'Cancel',
  'process.done': 'Done',
  'process.error': 'Failed',
  'process.retry': 'Retry',
  'process.again': 'Process Again',
  'process.reveal': 'Show in Folder',

  // Inspector
  'inspector.empty': 'Select an operation from the library',
  'inspector.noParams': 'No parameters required',
  'inspector.output': 'Est. Output',
  'inspector.calculating': '~calculating',

  // BottomDock
  'dock.stack': 'Stack',
  'dock.batch': 'Batch Queue',
  'dock.render': 'Render Queue',
  'dock.log': 'Console',
  'dock.expand': 'Bottom Panel',
  'dock.stack.empty': 'Drag operations here to build a chain',
  'dock.stack.clear': 'Clear Stack',
  'dock.batch.empty': 'Switch to Batch mode and select files from Media Pool',
  'dock.batch.queued': 'files queued',
  'dock.batch.done': 'Done',
  'dock.batch.error': 'Error',
  'dock.render.empty': 'No render tasks',
  'dock.log.waiting': 'Waiting for actions…',
  'dock.log.clear': 'Clear',

  // Operations groups
  'group.transcode': 'Transcode',
  'group.visual': 'Visual',
  'group.time': 'Time & Speed',
  'group.audio': 'Audio',
  'group.composite': 'Composite',
  'group.tools': 'Tools',

  // Operations
  'op.convert': 'Convert',
  'op.convert.desc': 'Convert output format',
  'op.resize': 'Resize & Compress',
  'op.resize.desc': 'Scale and compress',
  'op.stripmeta': 'Strip Metadata',
  'op.stripmeta.desc': 'Remove metadata',
  'op.gif': 'To GIF',
  'op.gif.desc': 'Convert to animated GIF',
  'op.crop': 'Crop',
  'op.crop.desc': 'Crop video region',
  'op.delogo': 'Remove Watermark',
  'op.delogo.desc': 'Remove watermark from video',
  'op.rotate': 'Rotate / Flip',
  'op.rotate.desc': 'Rotate or flip',
  'op.pad': 'Pad / Letterbox',
  'op.pad.desc': 'Add letterbox padding',
  'op.adjust': 'Adjust',
  'op.adjust.desc': 'Brightness / Contrast / Saturation',
  'op.denoise': 'Denoise',
  'op.denoise.desc': 'Video denoising',
  'op.sharpen': 'Sharpen / Blur',
  'op.sharpen.desc': 'Sharpen or blur',
  'op.thumbnail': 'Thumbnail',
  'op.thumbnail.desc': 'Extract single frame',
  'op.speed': 'Speed',
  'op.speed.desc': 'Change playback speed',
  'op.reverse': 'Reverse',
  'op.reverse.desc': 'Reverse playback',
  'op.boomerang': 'Boomerang',
  'op.boomerang.desc': 'Forward + reverse loop',
  'op.loop': 'Loop',
  'op.loop.desc': 'Loop playback',
  'op.fade': 'Fade In/Out',
  'op.fade.desc': 'Video fade effects',
  'op.extractaudio': 'Extract Audio',
  'op.extractaudio.desc': 'Extract audio track',
  'op.mute': 'Mute',
  'op.mute.desc': 'Remove audio track',
  'op.volume': 'Volume',
  'op.volume.desc': 'Adjust volume level',
  'op.normalize': 'Normalize',
  'op.normalize.desc': 'Audio loudness normalization',
  'op.concat': 'Concatenate',
  'op.concat.desc': 'Join multiple clips',
  'op.sxs': 'Side by Side',
  'op.sxs.desc': 'Side-by-side comparison',
  'sxs.clip2': 'Second Video',
  'sxs.selectClip2': 'Select Video',
  'sxs.clip2Selected': 'Selected',
  'overlay.logo': 'Logo Image',
  'overlay.selectLogo': 'Select Logo Image',
  'subtitles.file': 'Subtitle File',
  'subtitles.select': 'Select Subtitle File (.srt / .ass / .vtt)',
  'op.pip': 'Picture in Picture',
  'op.pip.desc': 'Picture-in-picture overlay',
  'op.overlay': 'Logo Overlay',
  'op.overlay.desc': 'Add logo watermark',
  'op.mixaudio': 'Mix Audio',
  'op.mixaudio.desc': 'Mix multiple audio tracks',
  'op.subtitles': 'Embed Subtitles',
  'op.subtitles.desc': 'Embed subtitles into video',
  'op.info': 'Media Info',
  'op.info.desc': 'View media information',
  'op.raw': 'Raw FFmpeg',
  'op.raw.desc': 'Custom FFmpeg command',

  // Param labels
  'param.format': 'Format',
  'param.width': 'Width',
  'param.height': 'Height',
  'param.x': 'X Offset',
  'param.y': 'Y Offset',
  'param.w': 'Crop Width',
  'param.h': 'Crop Height',
  'param.direction': 'Transform',
  'param.color': 'Fill Color',
  'param.brightness': 'Brightness',
  'param.contrast': 'Contrast',
  'param.saturation': 'Saturation',
  'param.grayscale': 'Grayscale',
  'param.strength': 'Strength',
  'param.mode': 'Mode',
  'param.sigma': 'Sigma',
  'param.timestamp': 'Timestamp (HH:MM:SS or seconds)',
  'param.multiplier': 'Speed',
  'param.count': 'Loop Count',
  'param.fadeIn': 'Fade In (s)',
  'param.fadeOut': 'Fade Out (s)',
  'param.level': 'Volume Level',
  'param.target': 'Target LUFS',
  'param.layout': 'Layout',
  'param.position': 'Position',
  'param.scale': 'Scale',
  'param.vol1': 'Volume A',
  'param.vol2': 'Volume B',
  'param.command': 'Arguments',
  'param.fps': 'FPS',

  // Param options
  'param.off': 'Off',
  'param.full': 'Full',
  'param.sharpen': 'Sharpen',
  'param.blur': 'Blur',
  'param.horizontal': 'Horizontal',
  'param.vertical': 'Vertical',
  'param.topLeft': 'Top-left',
  'param.topRight': 'Top-right',
  'param.bottomLeft': 'Bottom-left',
  'param.bottomRight': 'Bottom-right',
  'param.center': 'Center',

  // Rotate directions
  'rotate.90cw': '90° CW',
  'rotate.90ccw': '90° CCW',
  'rotate.180': '180°',
  'rotate.hflip': 'Flip Horizontal',
  'rotate.vflip': 'Flip Vertical',

  // Common
  'common.on': 'ON',
  'common.off': 'OFF',
};

const dictionaries: Record<Locale, Record<string, string>> = { zh, en };

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: 'zh',
  setLocale: (locale) => set({ locale }),
  t: (key: string) => {
    const { locale } = get();
    return dictionaries[locale][key] ?? key;
  },
}));

/** Convenience hook — returns the translation function */
export function useT() {
  return useLocaleStore((s) => s.t);
}

/** Convenience hook — returns current locale */
export function useLocale() {
  return useLocaleStore((s) => s.locale);
}
