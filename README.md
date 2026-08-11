# 程序员计算器 · Programmer Calculator

一个专为程序员设计的进制 / 机器码 / 位运算计算器,支持加、减、**乘、除**、取模及位运算,核心计算完全本地运行。

> 开发者:郑州格一网络科技有限公司
> 联系邮箱:lan0o0@qq.com

## 功能特性

- **进制转换**:DEC / BIN / HEX 实时双向同步
- **机器码展示**:原码 / 反码 / 补码三种编码
- **位图视图**:可点击翻转任意位,8 / 16 / 32 / 64 位长可切换
- **位运算**:AND / OR / XOR / NOT / SHL / SHR / NEG
- **算术运算**:`+` `-` `×` `÷` `%`,自动扩展 / 收缩位长,除零保护
- **符号性**:有符号 / 无符号可切换,与编码方式联动
- **合规内置**:首次启动用户协议 & 隐私政策弹窗,设置中可随时查看
- **核心计算离线**:进制转换 / 位运算 / 机器码展示等核心功能完全本地运行,不联网、不收集计算数据
- **广告变现**:集成 UMUnionSdk(开屏广告 + 浮窗广告)以维持免费运营,广告 SDK 会收集设备信息(详见隐私政策),用户可在系统设置中关闭相关权限

## 本地开发

环境要求:Node.js ≥ 18(推荐 20+),npm。

```bash
# 1. 安装依赖(已配置淘宝镜像源)
npm install --registry=https://registry.npmmirror.com

# 2. 启动开发服务器(热更新)
npm run dev
# 浏览器打开 http://localhost:5173/

# 3. 类型检查 + 生产构建(产物输出到 dist/index.html)
npm run build

# 4. 本地预览构建产物
npm run preview

# 5. 仅类型检查
npm run check
```

## 打包为 Android APK

本项目使用 Capacitor 7 作为 WebView 壳。

```bash
npm run build
npx cap sync android
# 在 Android Studio 中打开 android/ 目录打包 APK
```

构建产物 `dist/index.html` 已被 `vite-plugin-singlefile` 内联所有 JS/CSS,适合直接被 WebView 加载。

### 安装与覆盖升级

- APK 使用固定 keystore(`android/progcalc.keystore`)签名,版本号随每次发布递增。
- 已安装旧版本(同一签名)可直接用新 APK 覆盖安装,无需卸载。
- 若安装时提示「应用未安装」或「签名不一致」,通常是因为设备上已存在**不同签名**的同名应用(如 debug 版或第三方来源版本),请先卸载旧版本再安装本 APK。
- Android 系统不允许降级安装(versionCode 降低),如需安装更低版本请先卸载当前版本。

## 项目结构

```
src/
├── App.tsx                     # 根组件,首次启动协议门控
├── main.tsx                    # 入口
├── components/
│   ├── AgreementGate.tsx       # 首次启动协议弹窗
│   ├── LegalModal.tsx          # 法律文本查看器(通用)
│   ├── AboutSection.tsx        # 设置中的「关于我们」区块
│   ├── Display.tsx             # 显示屏(自适应字号)
│   ├── NumericKeypad.tsx       # 数字 + 算术运算键盘
│   ├── BitMatrix.tsx           # 位图
│   ├── BitOpPad.tsx            # 位运算操作面板
│   ├── BaseInputRow.tsx        # 进制输入行
│   ├── EncodingCard.tsx        # 机器码卡片
│   └── SettingsDrawer.tsx      # 设置抽屉
├── legal/
│   └── content.ts              # 用户协议 / 隐私政策 / 个人信息收集清单
├── store/calculatorStore.ts    # Zustand 状态(含算术/位运算逻辑)
├── store/themeStore.ts         # 主题管理(auto/light/dark,原生桥 + matchMedia)
├── utils/                      # 转换与位运算工具
└── types/index.ts              # 类型定义
```

详细架构见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 合规说明

- 首次启动弹出协议摘要,提供「用户协议」「隐私政策」「个人信息收集清单」入口,用户同意后方可进入。
- 同意状态仅以布尔值存储于 `localStorage`(键名 `progcalc.agreement.accepted`),可通过清除应用数据删除。
- 设置 → 关于我们 中可随时查看上述三份文档。

完整文档见:
- [用户协议](./src/legal/content.ts) `USER_AGREEMENT`
- [隐私政策](./src/legal/content.ts) `PRIVACY_POLICY`
- [个人信息收集清单](./src/legal/content.ts) `PERSONAL_INFO_LIST`

## 广告集成排错记录

集成友盟 UMUnionSdk 开屏广告过程中遇到的三个关键问题及解决方案,供后续维护参考。

### 问题 1:`ad action:discard`(code 2003)

**现象**:广告请求被 SDK 直接丢弃,日志 `splash: ad load failed: {"code":2003,"msg":"ad action:discard"}`。

**根因**:在 `onCreate` 中同步调用 `loadSplashAd`,此时 Activity 尚未完成 attach/measure/layout,`container` 无尺寸,SDK 检测后丢弃广告。

**解决**:广告加载延迟到 `onWindowFocusChanged(true)` + `webView.post()` 下一帧执行,确保 container 已有尺寸。

相关代码:[MainActivity.java](./apk-build/src/com/progcalc/app/MainActivity.java) `onWindowFocusChanged` + `LoadSplashAdRunnable`

### 问题 2:`show error 2010: expose invalid`(广告一闪而过)

**现象**:广告展示仅 165ms 就被移除,日志 `splash: show error 2010: expose invalid. report fail`。

**根因**(双重问题):
1. 5 秒展示定时器原在 `onExposed()` 中启动,但曝光失败时 `onExposed()` 永不触发,定时器从未启动
2. `onError(2010)` 立即调用 `onSkip()` → `goHome()`,广告 View 被提前移除

**解决**:
- 5 秒定时器改在 `SplashEventListener` 构造函数启动(不等 `onExposed`,因为曝光可能失败)
- `onError(2010)` 视为非致命错误(广告 View 已展示 `visible=true`,仅曝光上报失败),不立即 skip,等 5 秒定时器到期

相关代码:[UMAdSDK.java](./apk-build/src/com/progcalc/app/UMAdSDK.java) `SplashEventListener`

### 问题 3:`RuntimeException: pls call show(ViewGroup container)`

**现象**:广告加载成功后展示时抛异常,日志 `java.lang.RuntimeException: pls call show(ViewGroup container)`。

**根因**:`UMSplashAD.show()` 重载只接受 `ViewGroup container`,传 `Activity` 会直接抛异常。

**解决**:
- `loadSplashAd` 增加 `ViewGroup container` 参数
- `SplashShowRunnable` 改为 `display.show(container)`
- `MainActivity` 传入 `splashAdContainer`(onCreate 中已创建并 attach)

相关代码:[UMAdSDK.java](./apk-build/src/com/progcalc/app/UMAdSDK.java) `SplashShowRunnable`

### 展示时长控制策略

为确保开屏广告展示满 5 秒(即使 SDK 提前回调 `onDismissed` 或曝光失败),采用以下策略:

```
SplashEventListener 构造函数
  └─ 启动 5 秒定时器(不等 onExposed,因为曝光可能失败)

onError(2010)  →  非致命,不 skip,等 5 秒定时器
onError(其他)  →  立即 skip(广告真正无法展示)
onDismissed    →  不立即 goHome,等 5 秒定时器
onExposed      →  仅记录,定时器已在构造函数启动

5 秒定时器到期
  └─ removeAdViews(activity)  // 清理 DecorView 上的 SDK 广告 View
  └─ callback.onDismissed()   // 触发 goHome
```

### 最终验证日志(v2.11.13)

```
19:10:08.760  splash: ad load success, registering listener
19:10:08.760  splash: listener created, start 5s min display timer
19:10:08.760  splash: show via show(container), size=1216x2577        ← show(container) 修复
19:10:09.010  splash: show error 2010: expose invalid, check network  ← 2010 仍出现
19:10:09.010  splash: error 2010 non-fatal, ad visible, keep 5s timer  ← 非致命,保持展示
19:10:13.761  splash: 5s min display reached, displayed=5001ms, goHome ← ✅ 展示 5 秒
19:10:13.770  splash: removed ad view: com.umeng.union.widget.UMNativeLayout  ← 清理广告 View
```

详细排查过程见 [DEBUG.md](./DEBUG.md)。

## 更新日志

### v2.11.13 — 2026-08-11

- 🐛 **关键修复**:`UMSplashAD.show(Activity)` 抛出 `RuntimeException: pls call show(ViewGroup container)`
- **根因**:友盟 SDK `UMSplashAD.show()` 重载只接受 `ViewGroup container`,传 `Activity` 会直接抛异常,导致广告加载成功后无法展示
- **方案**:
  - [UMAdSDK.java](./apk-build/src/com/progcalc/app/UMAdSDK.java) `loadSplashAd` 增加 `ViewGroup container` 参数,`SplashShowRunnable` 改为 `display.show(container)`
  - [MainActivity.java](./apk-build/src/com/progcalc/app/MainActivity.java) `LoadSplashAdRunnable` 传入 `splashAdContainer`(onCreate 中已创建并 attach)
  - `show()` 前打印 container 尺寸,便于排查 `2003 discard`
- ✅ 验证日志:`show via show(container), size=1216x2577` → 广告正常展示 5 秒后 `goHome`

### v2.11.12 — 2026-08-11

- 🐛 **关键修复**:开屏广告 `show error 2010: expose invalid` 导致广告一闪而过(展示仅 165ms)
- **根因**:5 秒展示定时器原在 `onExposed()` 中启动,但曝光失败时 `onExposed()` 永不触发,定时器从未启动;同时 `onError(2010)` 立即 `onSkip()` → `goHome()`,广告被提前移除
- **方案**:
  - 5 秒定时器改在 `SplashEventListener` 构造函数启动(不等 `onExposed`)
  - `onError(2010)` 视为非致命错误(广告 View 已展示,仅曝光上报失败),不立即 skip,等 5 秒定时器到期
  - 提取 `removeAdViews()` 共享方法,`onMinDisplayTimeout` 和 `GoHomeRunnable` 清理 DecorView 上的 SDK 广告 View
  - `onSuccess` 取消 10 秒加载超时,展示阶段由 5 秒定时器控制
- ✅ 验证日志:`error 2010 non-fatal, ad visible, keep 5s timer` → `5s min display reached, displayed=5001ms, goHome`

### v2.11.11 — 2026-08-11

- 🐛 修复开屏广告 `ad action:discard`(code 2003):container 未完成 attach/measure/layout 时加载广告会被 SDK 丢弃
- **方案**:广告加载从 `onCreate` 延迟到 `onWindowFocusChanged(true)` + `webView.post()` 下一帧执行,确保 container 已有尺寸

### v2.11.4 — 2026-08-11

- 🛡️ **友盟合规三步落地**(满足监管新规,避免未授权采集风险):
  - ① SDK 已升级:common 9.9.6 + asms 1.8.7.2 + union 3.7.1
  - ② 隐私政策 / 个人信息收集清单 已如实披露友盟 SDK 名称、收集信息类型、隐私政策链接
  - ③ **延迟初始化**:用户同意《隐私权政策》后才调用 `UMConfigure.submitPolicyGrantResult` + `UMUnionSdk.init`
- 🔧 **重构广告初始化为两阶段**([UMAdSDK.java](./apk-build/src/com/progcalc/app/UMAdSDK.java)):
  - `preInit()` 可在用户同意前调用,仅做准备不采集数据
  - `init()` 必须在用户同意后调用,触发真正初始化
  - 首次启动跳过开屏广告,二次启动(已同意)展示开屏广告
- 💾 **协议状态原生持久化**([AgreementState.java](./apk-build/src/com/progcalc/app/AgreementState.java)):
  - 用 SharedPreferences 存储同意状态,下次启动直接初始化 SDK + 展示开屏广告
  - 前端通过 `appNative.isAgreementAccepted()` 与原生双向同步
- 🌉 **原生-JS 桥扩展**([MainActivity.java](./apk-build/src/com/progcalc/app/MainActivity.java)):
  - 新增 `isAgreementAccepted()` / `onAgreementAccepted()` 两个 `@JavascriptInterface` 方法
  - 用户在前端点「同意并继续」→ 通知原生 → UI 线程初始化 SDK + 加载浮窗广告
- 📦 **构建脚本完善**([build.sh](./apk-build/build.sh)):
  - 自动解压 libs/*.aar,提取 classes.jar 加入 javac/d8 classpath
  - 自动打包 SDK 的 native .so 文件到 APK(libumeng-spy.so 多 ABI)
- 📄 用户协议 / 隐私政策 / 个人信息收集清单 公网页面版本号对齐 v2.11.4
- ⚠️ **待办**:[UMAdSDK.java](./apk-build/src/com/progcalc/app/UMAdSDK.java#L34-L41) 中 `UM_APP_KEY` / `SPLASH_SLOT_ID` / `FLOATING_SLOT_ID` 仍为占位符,需替换为友盟后台真实值才能展示广告

### v2.11.3 — 2026-08-11

- 📢 **接入广告 SDK(UMUnionSdk)**:维持应用免费运营
  - 开屏广告:应用启动时展示,5 秒超时/失败/跳过自动进入主程序
  - 浮窗广告:主界面加载完成后展示,可手动关闭
- 🛡️ **合规文档全面同步更新**(避免监管风险):
  - 隐私政策:新增「第三方广告 SDK 说明」「权限使用说明」「您的权利」等章节,如实披露 UMUnionSdk 收集的设备信息类型、用途、回传方式
  - 个人信息收集清单:新增「第三方广告 SDK 收集情况」章节,列出 OAID/Android ID/IMEI、IP、位置、设备型号等具体收集项
  - 用户协议摘要:更新为如实描述广告接入情况
- 🔌 **广告集成层设计**:UMAdSDK.java 通过反射调用 SDK API,SDK 未接入时所有方法安全降级,不影响 App 正常运行
- ✅ AndroidManifest 增加广告 SDK 所需权限:ACCESS_NETWORK_STATE、READ_PHONE_STATE、ACCESS_COARSE/FINE_LOCATION、AD_ID、WRITE_EXTERNAL_STORAGE(maxSdkVersion=28)
- ✅ MainActivity 重构入口流程:开屏广告回调 / LayoutReadyListener 共用幂等 `goHome()` 入口,避免重复加载
- ⚠️ **重要**:接入正式 SDK 时需把 aar 放到 `apk-build/libs/`,并在 build.sh 的 javac classpath 中加入该 aar 的 classes.jar

### v2.11.2 — 2026-08-11

- 🎨 App 内协议查看器(LegalModal)头部去掉版本号与更新时间,仅保留标题(版本信息以公网页面展示为准,避免双处维护)
- 📄 公网协议页(用户协议 / 隐私政策 / 个人信息收集清单)版本号改为与 App 版本号一致(v2.11.2),并新增「生效时间」字段
- ✅ 生效时间与更新时间保持一致(2026-08-11)
- ✅ `content.ts` 的 `LegalDocument` 接口新增 `effectiveAt` 字段;`APP_INFO.version` 同步到 2.11.2

### v2.11.1 — 2026-08-11

- 🐛 修复「自动」主题在 Android WebView 中始终为浅色的问题
- **根因**:Android WebView 默认不将系统 `prefers-color-scheme` 透传给 Web 内容,导致 `window.matchMedia("(prefers-color-scheme: dark)")` 恒返回 `false`
- **方案**:在 `MainActivity` 注入原生 JS 桥 `AppBridge`,通过 `appNative.getSystemTheme()` 直接读取 Android `Configuration.uiMode` 返回系统主题;前端 `systemPrefersDark()` 优先调用原生桥,回退 `matchMedia`
- ✅ 系统主题切换实时响应:`AndroidManifest` 增加 `configChanges="uiMode"`,`onConfigurationChanged` 通过 `evaluateJavascript` 通知前端 `window.__onNativeSystemThemeChange` 回调
- ✅ 修复 Zustand persist 时序:`onRehydrateStorage` 在 localStorage 水合后重新应用主题,避免初始闪烁
- ✅ `ExitBridge` 升级为 `AppBridge`,同时承担退出与主题查询职责
- ✅ 修复「自动」模式下系统主题切换时 LegalModal iframe 不跟随更新:系统主题变化时 dispatch `progcalc:systemtheme` CustomEvent,LegalModal 监听后重载 iframe(手动切换深色/浅色按钮通过 store 订阅已正常工作)
- 📝 新增 [DEBUG.md](./DEBUG.md) 记录本次排查过程

### v2.11.0 — 2026-08-07

- ✅ 新增主题颜色选择:设置中可选 自动 / 深色 / 浅色,支持跟随系统,持久化到 localStorage
- ✅ 全站配色改为 CSS 变量驱动,深色/浅色两套 token,主题切换平滑过渡
- ✅ 用户协议 / 隐私政策 / 个人信息收集清单(公网 HTML)随 App 主题联动:iframe 通过 ?theme= 参数传递,公网页读取后切换深色/浅色样式
- ✅ 关于我们:开发者与更新日期拆为两行展示

### v2.10.0 — 2026-08-07

- ✅ 协议展示改造为合规方案1:App 内通过 WebView 加载公网独立成文的协议页(GitHub Pages 托管),可被监管验证、更新无需发版
- ✅ 新增 3 个独立 HTML 协议页:用户协议、隐私政策、个人信息收集清单(移动端适配、可复制、独立成文)
- ✅ LegalModal 改为 iframe 加载公网 URL,带加载态、8 秒超时兜底、失败重试
- ✅ 后期更换自有域名时,只需修改 `content.ts` 中 `LEGAL_BASE_URL` 一个常量

### v2.9.0 — 2026-08-07

- ✅ 登录界面增加 App 介绍:专为程序员、计算机学生和嵌入式工程师打造,支持补码自动计算、多进制实时转换、位运算可视化
- ✅ App 内版本号改为与 GitHub Release 一致的真实版本号(v2.9.0)
- ✅ 主体信息修正:公司名更正为「郑州格一网络科技有限公司」

### v2.8.0 — 2026-08-07

- ✅ 重做首次启动协议门:标题「欢迎使用本 App」、两协议入口(《用户协议》《隐私政策》)、双按钮(同意并继续 / 不同意并退出),「不同意」可真正退出应用
- ✅ 主体信息变更:开发者改为「郑州格一网络有限公司」,联系邮箱 lan0o0@qq.com,移除仓库 GitHub 链接
- ✅ 修复覆盖安装失败:提升 versionCode(18→19)、版本号 2.7→2.8,并固定复用同一签名 keystore,保证同签名可直接覆盖升级
- ✅ 合规文本同步更新开发者与联系方式

### v1.0.0 — 2026-08-07

- ✅ 修复本地构建:为 Vite 显式配置 `@` alias,修复 `vite build` 无法解析 `@/*` 的问题
- ✅ 新增算术乘法 `×` 与除法 `÷` 运算(整除,除零保护)
- ✅ 调整数字键盘最后一行:`0` 与 `=` 按键面积缩小为单格,`×`、`÷` 按键插入到 `0` 与 `=` 之间
- ✅ 新增首次启动协议门控:展示用户协议 / 隐私政策 / 个人信息收集清单,同意后方可进入主程序
- ✅ 设置中新增「关于我们」区块,可随时查看用户协议、隐私政策、个人信息收集清单
- ✅ 编写合规文本:覆盖应用功能、SDK 使用情况(React / Vite / Capacitor 等)、权限声明、未成年人保护等条款

## 技术栈

- React 18 + TypeScript 5.8
- Vite 6 + vite-plugin-singlefile(单文件输出)
- TailwindCSS 3(macOS 计算器风格深色主题)
- Zustand 5(状态管理)
- react-router-dom 7(HashRouter)
- Capacitor 7(Android 打包)
- lucide-react(图标)

## License

源代码版权归 `郑州格一网络科技有限公司` 所有,详见 [用户协议](./src/legal/content.ts)。
