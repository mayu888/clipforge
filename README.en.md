# ClipForge

**Professional Local Video & Audio Processing Workstation**

ClipForge is a desktop application built with Electron and FFmpeg, providing rich video/audio processing capabilities. All processing is done locally — no cloud uploads required.

![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![FFmpeg](https://img.shields.io/badge/FFmpeg-powered-green)

## Features

### Transcode & Compress
- **Format Conversion** — Support MP4, WebM, MKV, MOV, AVI, GIF and more
- **Resize & Compress** — Adjust resolution and reduce file size
- **Strip Metadata** — Remove EXIF and other metadata from videos
- **To GIF** — Convert video clips to animated GIF

### Visual
- **Crop** — Free-form crop of video area
- **Remove Watermark** — Smart watermark removal (Gaussian blur blending)
- **Rotate / Flip** — 90° rotation, 180° rotation, horizontal/vertical flip
- **Pad / Letterbox** — Add black/white borders
- **Adjust** — Brightness, contrast, saturation adjustment with grayscale mode
- **Denoise** — Video noise reduction (Light/Medium/Heavy)
- **Sharpen / Blur** — Sharpen or blur effects
- **Thumbnail** — Extract frame at specified timestamp

### Time & Speed
- **Speed** — 0.25x to 4x speed adjustment
- **Reverse** — Reverse video playback
- **Boomerang** — Forward + reverse loop effect
- **Loop** — Loop playback for specified count
- **Fade In/Out** — Fade effects for video and audio

### Audio
- **Extract Audio** — Extract audio track (MP3/WAV/AAC/FLAC/OGG)
- **Mute** — Remove audio track
- **Volume** — 0.5x to 3x volume adjustment
- **Normalize** — Normalize audio loudness (-14/-16/-23 LUFS)

### Composite
- **Concatenate** — Merge multiple video files
- **Side by Side** — Horizontal or vertical split view
- **Picture in Picture** — PiP effect with position, scale, and audio selection
- **Logo Overlay** — Add image watermark with position and opacity control
- **Mix Audio** — Mix two audio tracks
- **Embed Subtitles** — Embed subtitle files into video

### Tools
- **Media Info** — View detailed technical information of media files
- **Raw FFmpeg** — Direct FFmpeg command input

## Working Modes

### Single Mode
Select one file and apply a single operation.

### Stack Mode
Chain multiple operations together and apply them sequentially to the same file. Compatible operations auto-link without manual ordering.

### Batch Mode
Select multiple files and apply the same operation to all of them — ideal for batch transcoding or bulk processing.

## Core Features

- **Live Preview** — Preview operation effects before processing, with video playback preview
- **Drag & Drop** — Drag files to preview area to add them
- **Timeline Trim** — Visual timeline for trimming video duration
- **Local Processing** — All processing done locally, protecting privacy
- **Multi-Format** — Support video, audio, and image formats
- **Bilingual UI** — Chinese and English interface

## Tech Stack

- **Frontend** — React 18 + TypeScript
- **Desktop** — Electron 42
- **Build** — Vite 5 + Electron Forge
- **State Management** — Zustand
- **Styling** — Tailwind CSS
- **Video Processing** — FFmpeg (bundled binary)
- **Icons** — Lucide React

## System Requirements

- **OS**: Windows 10+, macOS 10.15+, Linux (Debian/Ubuntu RPM/DEB support)
- **CPU**: x64 and ARM64 architectures supported
- **RAM**: 4GB+ recommended (for large files)
- **Disk**: ~200MB (including FFmpeg binary)

## Installation

Download the installer for your platform from [Releases](https://github.com/yourusername/clipforge/releases):

- **macOS**: `.dmg` file
- **Windows**: `.exe` installer
- **Linux**: `.deb` or `.rpm` package

Or download the `.zip` archive and extract to run directly.

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/clipforge.git
cd clipforge

# Install dependencies
npm install

# Start development environment
npm start

# Build installer package
npm run make

# Run tests
npm test
```

## Project Structure

```
src/
── main/               # Main process code
│   ├── ffmpeg/         # FFmpeg related (binary management, args builder, runner)
│   ├── fs/             # File operations (dialogs, path generation)
│   ├── ipc/            # IPC communication handlers
│   └── window.ts       # Window creation
├── preload/            # Preload scripts
├── renderer/           # Renderer process (React UI)
│   ├── components/     # UI components
│   │   ├── dock/       # Bottom panel (stack, batch queue, logs)
│   │   ├── inspector/  # Parameter inspector
│   │   ├── layout/     # Layout components (toolbar, side panels)
│   │   ├── media/      # Media pool
│   │   └── preview/    # Preview canvas
│   ├── lib/            # Utilities (i18n, IPC, operation definitions)
│   └── store/          # Zustand state management
└── assets/             # Static assets (icons, etc.)
```

## License

This project is licensed under the **MIT + Commons Clause** license.

- Personal use, learning, research: **Free**
- Commercial use: Contact the author for authorization

Contact: mayu827@163.com

See [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [FFmpeg](https://ffmpeg.org/) — Powerful multimedia processing tool
- [Electron](https://www.electronjs.org/) — Cross-platform desktop framework
- [React](https://react.dev/) — UI framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
