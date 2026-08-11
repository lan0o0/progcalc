import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "auto" | "light" | "dark";
export type EffectiveTheme = "light" | "dark";

const THEME_KEY = "progcalc.theme";

interface ThemeStore {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: "auto",
      setMode: (m) => set({ mode: m }),
    }),
    {
      name: THEME_KEY,
      // hydrate 完成后重新应用主题,修复初始用默认 "auto" 在 localStorage 读取前
      // 可能短暂应用错误主题的时序问题
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeToDom(state.mode);
      },
    }
  )
);

/**
 * 读取系统深浅色偏好。
 * 优先级:
 *   1. 原生桥 appNative.getSystemTheme() —— Android WebView 默认不透传
 *      prefers-color-scheme 给 Web 内容,必须由原生读取 Configuration.uiMode
 *   2. window.matchMedia —— 浏览器/PWA 环境
 *   3. 兜底 true(深色) —— 与原应用一致
 */
function systemPrefersDark(): boolean {
  // 1. 原生桥:同步返回,Android 端读取系统实际配置
  try {
    const native = window.appNative;
    if (native && typeof native.getSystemTheme === "function") {
      const t = native.getSystemTheme();
      if (t === "dark" || t === "light") return t === "dark";
    }
  } catch {
    /* 原生桥不可用,继续回退 */
  }
  // 2. matchMedia:浏览器/PWA
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true; // 3. 兜底深色
  }
}

/** 根据 mode 计算实际生效的主题 */
export function getEffectiveTheme(mode: ThemeMode): EffectiveTheme {
  if (mode === "auto") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

/** 把主题应用到 <html> 的 data-theme 属性 */
export function applyThemeToDom(mode: ThemeMode): EffectiveTheme {
  const effective = getEffectiveTheme(mode);
  const root = document.documentElement;
  if (effective === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme"); // 深色为默认(:root 无 data-theme)
  }
  // 同步 meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", effective === "light" ? "#F2F2F7" : "#1C1C1E");
  }
  return effective;
}

/**
 * 在应用根组件调用一次:应用当前主题 + 监听系统主题变化(auto 模式下实时响应)。
 * 返回清理函数。
 */
export function initTheme(): () => void {
  // 1. 应用当前持久化的主题
  const mode = useThemeStore.getState().mode;
  applyThemeToDom(mode);

  // 2. 监听 store 变化(用户切换主题时)
  const unsubStore = useThemeStore.subscribe((state) => {
    applyThemeToDom(state.mode);
  });

  // 3. 监听系统主题变化(auto 模式下实时切换)
  //    a) 原生桥(Android):onConfigurationChanged 触发时,原生通过
  //       evaluateJavascript 调用 window.__onNativeSystemThemeChange
  //    b) matchMedia(浏览器/PWA):监听 prefers-color-scheme 变化
  const onSystemThemeChanged = () => {
    if (useThemeStore.getState().mode === "auto") {
      applyThemeToDom("auto");
    }
  };
  // 挂载原生回调,供 Android 端 dispatchSystemThemeChanged() 调用
  window.__onNativeSystemThemeChange = onSystemThemeChanged;

  let unsubMedia: (() => void) | null = null;
  try {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", onSystemThemeChanged);
    unsubMedia = () => mql.removeEventListener("change", onSystemThemeChanged);
  } catch {
    /* 不支持时忽略,原生桥仍可工作 */
  }

  return () => {
    unsubStore();
    if (unsubMedia) unsubMedia();
    delete window.__onNativeSystemThemeChange;
  };
}
