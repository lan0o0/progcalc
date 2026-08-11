/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // macOS 计算器配色(通过 CSS 变量驱动,支持深色/浅色主题切换)
        // 变量值定义在 index.css 的 :root(深色) 与 [data-theme="light"](浅色)
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        screen: "rgb(var(--c-screen) / <alpha-value>)",
        keyDark: "rgb(var(--c-keyDark) / <alpha-value>)",
        keyDarkHover: "rgb(var(--c-keyDarkHover) / <alpha-value>)",
        keyFunc: "rgb(var(--c-keyFunc) / <alpha-value>)",
        keyFuncHover: "rgb(var(--c-keyFuncHover) / <alpha-value>)",
        keyOp: "rgb(var(--c-keyOp) / <alpha-value>)",
        keyOpHover: "rgb(var(--c-keyOpHover) / <alpha-value>)",
        keyOpActive: "rgb(var(--c-keyOpActive) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        inkDim: "rgb(var(--c-inkDim) / <alpha-value>)",
        bitOn: "rgb(var(--c-bitOn) / <alpha-value>)",
        bitOff: "rgb(var(--c-bitOff) / <alpha-value>)",
        bitSign: "rgb(var(--c-bitSign) / <alpha-value>)",
        divider: "rgb(var(--c-divider) / <alpha-value>)",
      },
      fontFamily: {
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        panel:
          "0 24px 60px -12px rgba(0,0,0,0.65), 0 8px 24px -8px rgba(0,0,0,0.5)",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
