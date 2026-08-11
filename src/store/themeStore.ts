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
    }
  )
);

/** 读取系统深浅色偏好(仅客户端) */
function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true; // 兜底:无法检测时默认深色(与原应用一致)
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
  let unsubMedia: (() => void) | null = null;
  try {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (useThemeStore.getState().mode === "auto") {
        applyThemeToDom("auto");
      }
    };
    mql.addEventListener("change", onChange);
    unsubMedia = () => mql.removeEventListener("change", onChange);
  } catch {
    /* 不支持时忽略 */
  }

  return () => {
    unsubStore();
    if (unsubMedia) unsubMedia();
  };
}
