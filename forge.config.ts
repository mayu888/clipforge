import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'node:path';

const config: ForgeConfig = {
  packagerConfig: {
    // asar archive with binaries excluded (must remain as individual files)
    asar: {
      unpackDir: 'src/main/ffmpeg',
    },
    // App icon (auto-matches .icns for macOS, .ico for Windows, .png for Linux)
    icon: path.resolve(__dirname, 'assets/icon'),
    // Copy ffmpeg binaries to resources/ for production
    extraResource: ['src/main/ffmpeg'],
    // Linux executable name (lowercase, matches package.json name)
    executableName: 'clipforge',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'ClipForge',
      setupIcon: path.resolve(__dirname, 'assets/icon.ico'),
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      format: 'ULFO',
      icon: path.resolve(__dirname, 'assets/icon.icns'),
    }),
    new MakerRpm({
      options: {
        name: 'clipforge',
        productName: 'ClipForge',
      },
    }),
    new MakerDeb({
      options: {
        name: 'clipforge',
        productName: 'ClipForge',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
