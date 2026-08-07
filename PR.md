# PR · 本地编译环境 + 乘除运算 + 合规门控与关于我们

## 标题

feat: 本地构建修复、新增乘除运算、合规协议门控与关于我们

## 类型

- fix(build): 修复 `vite build` 无法解析 `@/*` 路径
- feat(calc): 新增乘法 `×` 与除法 `÷` 运算,调整最后一行键盘布局
- feat(legal): 首次启动协议门控 + 设置中关于我们区块
- docs: 更新 README,新增 ARCHITECTURE.md / PR.md

## 设计决策

### 1. Vite alias 显式配置

**问题**:`vite-tsconfig-paths@5.1.4` 在 `vite build`(rollup)模式下无法解析 `@/*`,
仅 dev(esbuild)模式正常。`npm run build` 报 `Rollup failed to resolve import "@/pages/Home"`。

**方案**:在 `vite.config.ts` 增加 `resolve.alias`,将 `@` 显式指向 `src` 目录,
不依赖插件隐式扫描。`tsconfigPaths()` 保留(对 dev 模式仍有用),双保险。

### 2. 乘除运算:真值空间计算 + 整除语义

**问题**:原 store 仅支持 ADD / SUB / MOD,需新增 MUL / DIV,且 DIV 要处理除零。

**方案**:
- 扩展 `arithOp` 类型为 `"ADD" | "SUB" | "MUL" | "DIV" | "MOD" | null`
- 乘法:`resultTv = arithAcc * tv`(BigInt 原生支持)
- 除法:BigInt 的 `/` 是向 0 截断的整除(与 C / JS `Math.trunc` 一致),与程序员计算器语义吻合
- 除零保护:与原有 MOD 一致,清空算术状态并显示「除数不能为 0」,保留当前值
- 显示符号:用 `×`、`÷`(Unicode),与 macOS 计算器视觉一致
- 图标:lucide-react 的 `X`、`Divide`

### 3. 键盘布局:0 与 = 缩小,× ÷ 插入中间

**变更前**(最后一行,4 列网格):

```
[ 0 (col-span-2) ][ = (col-span-2) ]
```

**变更后**:

```
[ 0 ][ × ][ ÷ ][ = ]
```

- 移除 `colSpan` 让 0 与 = 各占 1 列
- × 和 ÷ 插入到 0 与 = 之间,符合用户对「数字 → 运算符 → 等于」的输入顺序直觉

### 4. 合规门控:独立模块 + localStorage 标记

**约束**:
- 首次启动必须弹出协议
- 同意后才进入程序
- 设置中可随时查看
- 不重复弹窗

**方案**:
- `src/legal/content.ts`:集中维护三份文档(用户协议 / 隐私政策 / 个人信息收集清单)
- `src/components/AgreementGate.tsx`:首次启动全屏弹窗,内含摘要 + 三份文档入口
- `src/components/LegalModal.tsx`:通用法律文档查看器(头部 + 滚动正文)
- `src/components/AboutSection.tsx`:设置抽屉中的「关于我们」区块
- `App.tsx`:`useEffect` 中读 `localStorage.getItem("progcalc.agreement.accepted")`,
  未同意则渲染 `<AgreementGate>`,同意后写入 `true` 并切到主程序
- 同意标记仅一个布尔,不含任何个人信息,可清除应用数据删除

### 5. 法律文本内容依据

文本严格依据本应用实际功能编写:
- 完全离线,不联网、不注册、不登录
- 不接入广告 / 统计 / 推送 / 登录类 SDK
- 唯一使用的「第三方组件」是开发框架(React / Vite / Capacitor / TailwindCSS / zustand / lucide-react / react-router-dom),
  均为打包与渲染基础设施,不在运行时主动收集用户信息
- 不申请任何敏感系统权限
- 明确列出 SDK 清单与许可证,便于审核

## 变更摘要

| 文件 | 变更 |
|------|------|
| `vite.config.ts` | + `resolve.alias`,显式 `@` → `src` |
| `src/store/calculatorStore.ts` | `arithOp` 类型扩展 `MUL` / `DIV`;`pressArith` / `pressEquals` 实现乘除与除零保护 |
| `src/components/NumericKeypad.tsx` | 最后一行 4 键(0 × ÷ =),移除 colSpan;import `X` `Divide` 图标 |
| `src/App.tsx` | 加入 `AgreementGate` 首次启动门控 |
| `src/components/AgreementGate.tsx` | 新增:协议摘要 + 文档入口 + 同意按钮 |
| `src/components/LegalModal.tsx` | 新增:通用法律文档查看器 |
| `src/components/AboutSection.tsx` | 新增:设置中「关于我们」区块 |
| `src/components/SettingsDrawer.tsx` | 末尾加入 `<AboutSection />` |
| `src/legal/content.ts` | 新增:三份合规文本 + 应用信息 |
| `README.md` | 重写:功能、开发、结构、合规、更新日志 |
| `ARCHITECTURE.md` | 新增:总体架构与模块职责 |
| `PR.md` | 新增:本 PR 说明 |

## 测试计划

- [x] `npm run build` 通过(1660 模块,1.98s,产物 304 KB / gzip 90 KB)
- [ ] `npm run dev` 启动后浏览器访问 http://localhost:5173/,验证:
  - [ ] 首次启动弹出协议门,点击三份文档可正常打开
  - [ ] 点击「同意并继续」后进入主程序,刷新不再弹
  - [ ] 清除 localStorage 后刷新,弹窗再次出现
  - [ ] 设置 → 关于我们:三个文档入口可打开
  - [ ] 键盘最后一行布局为 `0 × ÷ =`(各占 1 列)
  - [ ] 计算 `6 × 7 =` 显示 `42`
  - [ ] 计算 `20 ÷ 3 =` 显示 `6`(整除)
  - [ ] 计算 `5 ÷ 0 =` 显示「除数不能为 0」并保留 5
  - [ ] 链式输入 `2 × 3 × 4 =` 显示 `24`
- [ ] 边界测试:
  - [ ] 0 作为第一操作数:`0 × 5 =` → `0`
  - [ ] 0 作为第二操作数:`5 × 0 =` → `0`
  - [ ] 大数溢出:`9999999999 × 9999999999 =` 自动升位
  - [ ] 负数乘除:`-6 × 7 =` → `-42`(需 SIGNED 模式)
