import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
// 配置专为 Android WebView 打包:
// - base './':相对路径,file:// 协议下可正确解析
// - viteSingleFile:把所有 JS/CSS 内联到 index.html,WebView 只需加载一个文件
//   避免 ES Module fetch 子资源时被 CORS 或 file:// 限制拦截导致白屏
// - 去掉 VitePWA:file:// 协议下 SW 无法注册,反而会抛异常
export default defineConfig({
  base: './',
  resolve: {
    // 显式 alias:确保 rollup(vite build)也能解析 @/*,不依赖 tsconfig-paths 的隐式扫描
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    // 用 ES2015 IIFE 而不是 ES Module,file:// 协议下 WebView 不允许 module script
    target: 'es2015',
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024, // 强制所有资源内联
    modulePreload: { polyfill: false },
    // 关键:强制输出 IIFE 而不是 ES Module,这样 script 不带 type=module
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
    viteSingleFile(),
  ],
})
