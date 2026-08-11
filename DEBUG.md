# DEBUG.md — 自动主题颜色选择失效

> 版本:v2.11.1
> 日期:2026-08-11
> 状态:已修复

## 问题描述

设置中选择「自动」主题后,App 未跟随系统深色/浅色模式,在 Android 设备上始终显示浅色主题。

## 根因分析

### 现象

- 浏览器(PWA)中「自动」主题工作正常
- Android WebView 中「自动」主题恒为浅色,即使系统已切到深色模式

### 排查路径

1. **前端代码审查** — `src/store/themeStore.ts`
   - `systemPrefersDark()` 通过 `window.matchMedia("(prefers-color-scheme: dark)")` 检测系统主题
   - 在浏览器中此 API 工作正常,返回 `true` / `false`

2. **Android WebView 行为验证**
   - Android WebView 默认**不**将系统 `prefers-color-scheme` 媒体查询透传给 Web 内容
   - `window.matchMedia("(prefers-color-scheme: dark)").matches` 在 WebView 中**恒返回 `false`**
   - 这导致 `getEffectiveTheme("auto")` 恒返回 `"light"`

3. **结论**:根因在于 Android WebView 与浏览器在 `prefers-color-scheme` 支持上的差异,前端仅依赖 `matchMedia` 无法在 WebView 中正确检测系统主题。

## 修复方案

### 原生桥方案(Android)

在 `MainActivity.java` 中注入 JS 桥 `AppBridge`,通过 Android 系统 API 直接读取主题:

```java
@JavascriptInterface
public String getSystemTheme() {
    int uiMode = activity.getResources().getConfiguration().uiMode
            & Configuration.UI_MODE_NIGHT_MASK;
    return (uiMode == Configuration.UI_MODE_NIGHT_YES) ? "dark" : "light";
}
```

### 前端优先级链

`systemPrefersDark()` 改为三级回退:

1. **原生桥** `window.appNative.getSystemTheme()` — Android WebView 环境,直接读 `Configuration.uiMode`
2. **matchMedia** `window.matchMedia("(prefers-color-scheme: dark)")` — 浏览器/PWA 环境
3. **兜底** `true`(深色) — 与原应用默认行为一致

### 系统主题变化实时响应

- `AndroidManifest.xml` 给 Activity 增加 `android:configChanges="uiMode"`,避免系统主题切换时 Activity 重启
- `MainActivity.onConfigurationChanged()` 检测 `uiMode` 变化,通过 `evaluateJavascript` 调用前端 `window.__onNativeSystemThemeChange` 回调
- `initTheme()` 挂载该回调,在 `auto` 模式下重新应用主题

### Zustand persist 时序修复

- 问题:`initTheme()` 在 `useEffect` 中调用,此时 localStorage 可能尚未水合,`mode` 为默认值 `"auto"`
- 修复:在 persist 配置中增加 `onRehydrateStorage`,水合完成后重新调用 `applyThemeToDom(state.mode)`

## 涉及文件

| 文件 | 改动 |
|------|------|
| `apk-build/src/com/progcalc/app/MainActivity.java` | `ExitBridge` → `AppBridge`,新增 `getSystemTheme()`、`dispatchSystemThemeChanged()`、`onConfigurationChanged()` |
| `apk-build/AndroidManifest.xml` | `configChanges` 增加 `uiMode`;版本号 2.11 → 2.11.1 |
| `src/store/themeStore.ts` | `systemPrefersDark()` 三级回退;`initTheme()` 挂载原生回调;`onRehydrateStorage` 修复时序 |
| `src/vite-env.d.ts` | `AppNativeBridge` 增加 `getSystemTheme` 类型;`Window` 增加 `__onNativeSystemThemeChange` 类型 |

## 验证

- [x] TypeScript 类型检查通过(`npx tsc -b --noEmit`)
- [x] Vite 生产构建通过(`npm run build`)
- [x] APK 编译签名通过(`bash apk-build/build.sh`)
- [x] 编译产物验证:`AppBridge.class` 已生成,`ExitBridge.class` 已移除
- [x] APK 版本号正确:`versionCode=23 versionName=2.11.1`

## 手动测试步骤

1. 安装 v2.11.1 APK,进入设置 → 主题选择「自动」
2. 系统设置为深色模式 → App 应显示深色主题
3. 系统切换为浅色模式 → App 应实时切换为浅色主题(无需重启 App)
4. 手动选择「深色」/「浅色」→ 应忽略系统设置,固定为所选主题
5. 杀掉 App 重新打开 → 主题选择应持久化,「自动」模式应正确跟随当前系统主题
