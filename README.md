# 程序员计算器 · Programmer Calculator

一个专为程序员设计的离线进制 / 机器码 / 位运算计算器,支持加、减、**乘、除**、取模及位运算,完全本地运行,不联网、不收集个人信息。

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
- **完全离线**:无网络请求、无第三方统计/广告 SDK

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

## 更新日志

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
