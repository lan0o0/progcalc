/// <reference types="vite/client" />

interface AppNativeBridge {
  /** 退出应用(仅 Android 原生桥提供) */
  exit: () => void;
  /** 返回当前系统主题:"dark" 或 "light"(仅 Android 原生桥提供) */
  getSystemTheme: () => "dark" | "light";
  /** 查询用户是否已同意协议(原生 SharedPreferences 持久化) */
  isAgreementAccepted: () => boolean;
  /** 用户同意协议后通知原生:初始化广告 SDK + 加载浮窗广告 */
  onAgreementAccepted: () => void;
}

interface Window {
  /** Android 原生桥:由 MainActivity 注入,浏览器环境下为 undefined */
  appNative?: AppNativeBridge;
  /** 原生系统主题变化时回调,由 MainActivity.dispatchSystemThemeChanged() 调用 */
  __onNativeSystemThemeChange?: () => void;
}
