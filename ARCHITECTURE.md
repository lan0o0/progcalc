# 架构说明 · ARCHITECTURE

本文档描述「程序员计算器」的整体架构、模块职责与数据流。

## 1. 总体架构

```
┌──────────────────────────────────────────────────────────┐
│                      App.tsx                             │
│  ┌──────────────────┐                                    │
│  │ AgreementGate    │ ← 首次启动门控(localStorage)       │
│  └──────────────────┘                                    │
│            │ 同意                                         │
│            ▼                                              │
│  ┌──────────────────────────────────────────────────┐    │
│  │     HashRouter → Home (单页 / 单路由)            │    │
│  │  ┌──────────┬─────────────┬──────────────────┐  │    │
│  │  │ Display  │ Tab 切换     │ NumericKeypad    │  │    │
│  │  │ (显示)   │ base/enc/bit│ (数字+算术键盘)   │  │    │
│  │  └──────────┴─────────────┴──────────────────┘  │    │
│  │  ┌─────────────────────────────────────────────┐ │    │
│  │  │ SettingsDrawer(右抽屉)                       │ │    │
│  │  │   ├─ 符号性 / 位长 / 编码                    │ │    │
│  │  │   └─ AboutSection(用户协议/隐私政策/清单)   │ │    │
│  │  └─────────────────────────────────────────────┘ │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                  │ 读写
                  ▼
       ┌──────────────────────┐
       │  calculatorStore     │  ← Zustand 单一 store
       │  (value: bigint)     │
       └──────────────────────┘
                  │ 调用
                  ▼
       ┌──────────────────────┐
       │ utils/conversion.ts  │  ← 真值↔位模式 / 编码 / 位长适配
       │ utils/bitwise.ts     │  ← 位运算实现
       └──────────────────────┘
```

## 2. 关键设计决策

### 2.1 value 统一为无符号 bigint

`store.value` 始终是无符号 BigInt,范围由 `bitWidth` 决定。
符号性(`isSigned`)与编码方式(`encoding`)只在「解释成真值」时参与,不改变内部存储。
这样进制切换、位图翻转、位运算都是位模式上的操作,语义清晰。

### 2.2 真值 ↔ 位模式分离

- `valueToTrue(value, isSigned, encoding, bitWidth)`:把内部位模式解释成带符号十进制真值
- `trueToValue(trueValue, encoding, bitWidth)`:把真值编出位模式

算术运算(+、-、×、÷、%)在「真值空间」执行,再通过 `fitTrueValue` 适配位长后回写为位模式。

### 2.3 自动位长适配 (AUTO)

`autoFitBitWidth` 在 `[8, 16, 32, 64]` 中选最小能完整表示真值的位长,
支持扩展(signed 时做符号扩展)与收缩(高位清零后自动降位)。

### 2.4 算术运算的两段式状态机

```
pressArith(op): tv ← 当前真值;arithAcc ← tv;arithOp ← op;nextClears ← true
[用户输入第二操作数,内部走 appendDigit / nextClears 分支]
pressEquals(): resultTv ← arithAcc <op> tv;写回 value
```

连续按运算符时(`arithOp && !nextClears`),先结算上一轮再开启新一轮,
符合 macOS 计算器的链式输入行为。

### 2.5 单文件 IIFE 输出

`vite.config.ts` 强制:
- `base: './'`:相对路径,file:// 协议下可解析
- `rollupOptions.output.format: 'iife'`:避免 `type="module"`(WebView 不允许)
- `viteSingleFile()`:所有 JS/CSS 内联到 `index.html`,WebView 只需加载一个文件

### 2.6 合规门控

`App.tsx` 在挂载后读取 `localStorage.getItem("progcalc.agreement.accepted")`:
- 未同意 → 渲染 `<AgreementGate />` 覆盖整屏,阻止主程序渲染
- 同意 → 写入标记,渲染 `<Router><Home/></Router>`

法律文本集中维护在 `src/legal/content.ts`,三处复用:
- AgreementGate(首次启动弹窗)
- AboutSection(设置 → 关于我们)
- LegalModal(通用文档查看器)

## 3. 模块职责

| 模块 | 职责 |
|------|------|
| `App.tsx` | 协议门控 + 路由 |
| `pages/Home.tsx` | 主页面布局:Display / Tab / NumericKeypad / SettingsDrawer |
| `components/Display.tsx` | 显示屏,二分查找自适应字号 |
| `components/NumericKeypad.tsx` | 4×6 键盘:数字 / A-F / AC / ⌫ / + - × ÷ % = |
| `components/BitMatrix.tsx` | 位图(8 / 16 / 32 / 64 位) |
| `components/BitOpPad.tsx` | 位运算面板(7 种位运算 + 第二操作数输入) |
| `components/BaseInputRow.tsx` | 单行进制输入(DEC / BIN / HEX) |
| `components/EncodingCard.tsx` | 单种编码(原码 / 反码 / 补码)卡片 |
| `components/SettingsDrawer.tsx` | 右侧抽屉:符号性 / 位长 / 编码 / 关于我们 |
| `components/AgreementGate.tsx` | 首次启动协议弹窗 |
| `components/AboutSection.tsx` | 关于我们区块(版本信息 + 三份文档入口) |
| `components/LegalModal.tsx` | 通用法律文档查看器 |
| `legal/content.ts` | 用户协议 / 隐私政策 / 个人信息收集清单文本 |
| `store/calculatorStore.ts` | Zustand store:状态 + 动作 |
| `utils/conversion.ts` | 进制 / 编码 / 位长适配工具 |
| `utils/bitwise.ts` | 位运算实现 |
| `types/index.ts` | 类型定义(Base / Encoding / BitOp / BitWidth / MASK) |

## 4. 数据流(以「200 + 300 =」为例)

1. 用户在 DEC 进制下输入 `200`
   - `appendDigit("2")` → `appendDigit("0")` → `appendDigit("0")`
   - 每次:解析新真值 → `fitTrueValueForDec` → 写回 value(8 位)
2. 用户按 `+`
   - `pressArith("ADD")`:arithAcc ← 200n,arithOp ← "ADD",nextClears ← true
   - 显示副标题:`200 +`
3. 用户输入 `300`
   - `nextClears` 为 true → 起始 base 为 "0" → 真值 300 → 写回 value(9 位 → 自动升到 16 位)
4. 用户按 `=`
   - `pressEquals()`:arithOp="ADD" → resultTv = 200 + 300 = 500
   - `fitTrueValue(500, signed=true, twos, AUTO)` → 16 位
   - 写回 value,清空 arithAcc/arithOp,显示副标题 `200 + 300 =`

## 5. 构建产物

```
dist/
└── index.html        ← 单文件,内联全部 JS/CSS(约 304 KB,gzip 90 KB)
```

可直接被 Android WebView 通过 `file://` 协议加载。
