# ClipForge

**专业本地视频与音频处理工作站**

[English](./README.en.md) | **中文**

---

ClipForge 是一款基于 Electron 和 FFmpeg 的桌面应用，提供丰富的视频/音频处理功能，所有处理均在本地完成，无需上传云端。

![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![FFmpeg](https://img.shields.io/badge/FFmpeg-powered-green)

## 功能特性

### 转码压缩
- **格式转换** — 支持 MP4、WebM、MKV、MOV、AVI、GIF 等格式
- **缩放压缩** — 调整分辨率并压缩文件大小
- **去除元数据** — 清除视频中的 EXIF 等元信息
- **转 GIF** — 将视频片段转换为 GIF 动画

### 画面处理
- **裁剪** — 自由裁剪画面区域
- **去水印** — 智能去除视频水印（基于高斯模糊融合）
- **旋转/翻转** — 90°旋转、180°旋转、水平/垂直翻转
- **添加边框** — Letterbox 效果，支持黑边/白边
- **调色** — 亮度、对比度、饱和度调整，支持灰度模式
- **降噪** — 视频降噪处理（轻/中/重三档）
- **锐化/模糊** — 画面锐化或模糊效果
- **截帧** — 从视频中提取指定时间点的帧

### 时间速度
- **变速** — 0.25x 至 4x 速度调整
- **倒放** — 反转播放视频
- **回旋** — 正放+倒放循环（Boomerang 效果）
- **循环** — 指定次数循环播放
- **淡入淡出** — 视频和音频的淡入淡出效果

### 音频处理
- **提取音频** — 从视频中提取音频轨道（MP3/WAV/AAC/FLAC/OGG）
- **静音** — 移除音频轨道
- **音量调整** — 0.5x 至 3x 音量调节
- **响度归一化** — 标准化音频响度（-14/-16/-23 LUFS）

### 多输入合成
- **拼接** — 合并多个视频文件
- **并排对比** — 水平或垂直并排显示
- **画中画** — 画中画效果，支持位置、缩放、音频选择
- **水印叠加** — 添加图片水印，支持位置和透明度
- **混合音频** — 混合两个音频轨道
- **嵌入字幕** — 将字幕文件嵌入视频

### 工具
- **媒体信息** — 查看视频/音频的详细技术信息
- **自定义 FFmpeg** — 直接输入 FFmpeg 命令参数

## 工作模式

### 单项模式
选择单个文件，应用一个操作进行处理。

### 操作链模式
将多个操作组合成链式处理，依次应用于同一文件。支持的操作会自动链接，无需手动排序。

### 批量模式
同时选择多个文件，对它们应用相同的操作，适合批量转码或批量处理场景。

## 核心特性

- **实时预览** — 处理前可预览操作效果，支持视频播放预览
- **拖拽操作** — 拖拽文件到预览区即可添加
- **时间轴裁剪** — 可视化裁剪视频时长范围
- **本地处理** — 所有处理在本地完成，保护隐私
- **多格式支持** — 支持视频、音频、图片多种格式
- **中英文界面** — 支持中文和英文界面切换

## 技术栈

- **前端框架** — React 18 + TypeScript
- **桌面框架** — Electron 42
- **构建工具** — Vite 5 + Electron Forge
- **状态管理** — Zustand
- **样式方案** — Tailwind CSS
- **视频处理** — FFmpeg（内置二进制）
- **图标库** — Lucide React

## 系统要求

- **操作系统**：Windows 10+、macOS 10.15+、Linux（支持 Debian/Ubuntu RPM/DEB）
- **处理器**：支持 x64 和 ARM64 架构
- **内存**：建议 4GB+（处理大文件时）
- **磁盘空间**：约 200MB（包含 FFmpeg 二进制）

## 安装

从 [Releases](https://github.com/yourusername/clipforge/releases) 页面下载对应平台的安装包：

- **macOS**：`.dmg` 文件
- **Windows**：`.exe` 安装包
- **Linux**：`.deb` 或 `.rpm` 包

或下载 `.zip` 压缩包直接解压运行。

## 开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/clipforge.git
cd clipforge

# 安装依赖
npm install

# 启动开发环境
npm start

# 构建安装包
npm run make

# 运行测试
npm test
```

## 项目结构

```
src/
├── main/               # 主进程代码
│   ├── ffmpeg/         # FFmpeg 相关（二进制管理、参数构建、执行器）
│   ├── fs/             # 文件操作（对话框、路径生成）
│   ├── ipc/            # IPC 通信处理
│   └── window.ts       # 窗口创建
├── preload/            # 预加载脚本
├── renderer/           # 渲染进程（React UI）
│   ├── components/     # UI 组件
│   │   ├── dock/       # 底部面板（操作栈、批量队列、日志）
│   │   ├── inspector/  # 参数检查器
│   │   ├── layout/     # 布局组件（工具栏、左右面板）
│   │   ├── media/      # 媒体池
│   │   └── preview/    # 预览画布
│   ├── lib/            # 工具库（i18n、IPC、操作定义）
│   └── store/          # Zustand 状态管理
└── assets/             # 静态资源（图标等）
```

## 许可证

本项目采用 **MIT + Commons Clause** 许可证。

- 个人使用、学习、研究：**免费**
- 商业用途：需要联系作者获取授权

联系方式：mayu827@163.com

详见 [LICENSE](./LICENSE) 文件。

## 致谢

- [FFmpeg](https://ffmpeg.org/) — 强大的多媒体处理工具
- [Electron](https://www.electronjs.org/) — 跨平台桌面应用框架
- [React](https://react.dev/) — UI 框架
- [Tailwind CSS](https://tailwindcss.com/) — 实用优先的 CSS 框架
