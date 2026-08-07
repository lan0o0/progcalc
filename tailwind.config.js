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
        // macOS 计算器配色
        panel: "#1C1C1E", // 外层面板背景
        screen: "#000000", // 显示屏背景
        keyDark: "#333333", // 数字键
        keyDarkHover: "#4A4A4A",
        keyFunc: "#A5A5A5", // 功能键(AC/⌫ 等)
        keyFuncHover: "#BEBEBE",
        keyOp: "#FF9F0A", // 运算键橙色
        keyOpHover: "#FFB340",
        keyOpActive: "#FFC859",
        ink: "#FFFFFF", // 主文字
        inkDim: "#8E8E93", // 次要文字
        bitOn: "#FF9F0A", // 位图为 1
        bitOff: "#2C2C2E", // 位图为 0
        bitSign: "#0A84FF", // 符号位边框
        divider: "#38383A",
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
