import { create } from "zustand";
import { Base, BitOp, BitWidth, Encoding, MASK } from "@/types";
import {
  autoFitBitWidth,
  binaryToValue,
  fitsInWidth,
  hexToValue,
  parseDecimal,
  trueToValue,
  valueToTrue,
} from "@/utils/conversion";
import { applyBitOp } from "@/utils/bitwise";

interface CalculatorStore {
  // === 状态 ===
  value: bigint;
  isSigned: boolean;
  activeBase: Base;
  encoding: Encoding;
  bitWidth: BitWidth;
  autoBitWidth: boolean;
  secondOperand: string;
  pendingOp: BitOp | null;
  lastExpression: string;
  /** 算术运算累加值(真值) */
  arithAcc: bigint | null;
  /** 待执行的算术运算 */
  arithOp: "ADD" | "SUB" | "MUL" | "DIV" | "MOD" | null;
  /** 下一次数字输入是否先清空当前值 */
  nextClears: boolean;

  // === 直接设置 ===
  setValue: (v: bigint) => void;
  setSigned: (s: boolean) => void;
  setEncoding: (e: Encoding) => void;
  setActiveBase: (b: Base) => void;
  setSecondOperand: (s: string) => void;
  setPendingOp: (op: BitOp | null) => void;
  /** 手动设置位长(关闭 auto) */
  setBitWidth: (w: BitWidth) => void;
  /** 开启/关闭自动适配 */
  setAutoBitWidth: (on: boolean) => void;

  // === 从字符串输入更新 value ===
  setFromDecimal: (s: string) => void;
  setFromBinary: (s: string) => void;
  setFromHex: (s: string) => void;

  // === 位图与键盘 ===
  toggleBit: (index: number) => void;
  appendDigit: (d: string) => void;
  backspace: () => void;
  toggleSign: () => void;
  clear: () => void;

  // === 运算 ===
  applyOp: () => void;
  /** + / - / × / ÷ / % 按钮:暂存当前值,等待第二操作数 */
  pressArith: (op: "ADD" | "SUB" | "MUL" | "DIV" | "MOD") => void;
  /** = 按钮:统一执行算术或位运算 */
  pressEquals: () => void;
}

/**
 * 取当前活动进制的"规范化字符串"(无前导 0)。
 * 依赖 value 的解释方式。
 */
function canonicalString(
  value: bigint,
  base: Base,
  isSigned: boolean,
  encoding: Encoding,
  bitWidth: BitWidth
): string {
  if (base === "dec") {
    if (isSigned) {
      return valueToTrue(value, isSigned, encoding, bitWidth).toString();
    }
    return (value & MASK[bitWidth]).toString();
  }
  if (base === "bin") {
    return (value & MASK[bitWidth]).toString(2) || "0";
  }
  return (value & MASK[bitWidth]).toString(16).toUpperCase() || "0";
}

/**
 * 把真值写入 state 的核心辅助函数。
 * 若开启 auto:按真值选择能完整表示它的最小位长;
 * 否则使用当前位长(溢出时由 trueToValue 按位长回绕)。
 * 通过"真值 -> 新位长重新编码"路径,正确处理
 *   - 扩展(signed 时做符号扩展,如 0xFF[-1] 扩到 16 位得 0xFFFF)
 *   - 收缩(高位清零后自动降到更窄位长)
 */
function fitTrueValue(
  trueValue: bigint,
  isSigned: boolean,
  encoding: Encoding,
  autoBitWidth: boolean,
  currentBitWidth: BitWidth
): { value: bigint; bitWidth: BitWidth } {
  const newWidth = autoBitWidth
    ? autoFitBitWidth(trueValue, isSigned, encoding)
    : currentBitWidth;
  return {
    value: trueToValue(trueValue, encoding, newWidth),
    bitWidth: newWidth,
  };
}

/**
 * DEC 输入专用的适配:在 auto 模式下,当真值落在 64 位有符号装不下、
 * 但无符号 64 位装得下的区间(即 [2^63, 2^64-1])时,自动切换到 unsigned 64-bit,
 * 避免出现"输入 19 个 9 变成负数"的错乱。
 * 返回新的 isSigned,供调用方更新 state。
 */
function fitTrueValueForDec(
  trueValue: bigint,
  isSigned: boolean,
  encoding: Encoding,
  autoBitWidth: boolean,
  currentBitWidth: BitWidth
): { value: bigint; bitWidth: BitWidth; isSigned: boolean } {
  if (autoBitWidth && isSigned && trueValue >= 0n) {
    // 有符号 64 位装不下,但无符号 64 位装得下 → 切到 unsigned 64-bit
    if (!fitsInWidth(trueValue, true, encoding, 64) && fitsInWidth(trueValue, false, encoding, 64)) {
      return {
        value: trueToValue(trueValue, encoding, 64),
        bitWidth: 64,
        isSigned: false,
      };
    }
  }
  const fitted = fitTrueValue(trueValue, isSigned, encoding, autoBitWidth, currentBitWidth);
  return { ...fitted, isSigned };
}

/**
 * 判断 DEC 输入后的真值是否在 64 位无符号范围内(可表示的硬上限)。
 * 超过则应拒绝这次输入,避免溢出错乱。
 */
function decTrueValueFits64Unsigned(trueValue: bigint): boolean {
  return trueValue >= 0n && trueValue <= MASK[64];
}

/** 把当前 value(位模式)在指定位长/符号性/编码下解释成真值 */
function valueToTrueSafe(
  value: bigint,
  isSigned: boolean,
  encoding: Encoding,
  bitWidth: BitWidth
): bigint {
  return isSigned
    ? valueToTrue(value, isSigned, encoding, bitWidth)
    : value & MASK[bitWidth];
}

export const useCalculator = create<CalculatorStore>((set, get) => ({
  value: 0n,
  isSigned: true,
  activeBase: "dec",
  encoding: "twos",
  bitWidth: 8,
  autoBitWidth: true,
  secondOperand: "0",
  pendingOp: null,
  lastExpression: "",
  arithAcc: null,
  arithOp: null,
  nextClears: false,

  setValue: (v) => {
    const { isSigned, encoding, bitWidth, autoBitWidth } = get();
    const t = valueToTrueSafe(v, isSigned, encoding, bitWidth);
    const fitted = fitTrueValue(t, isSigned, encoding, autoBitWidth, bitWidth);
    set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "" });
  },

  setSigned: (s) => {
    // 切换符号性时,用新符号性重新解释当前 value,再适配位长
    const { value, encoding, bitWidth, autoBitWidth } = get();
    const t = valueToTrueSafe(value, s, encoding, bitWidth);
    const fitted = fitTrueValue(t, s, encoding, autoBitWidth, bitWidth);
    set({ isSigned: s, value: fitted.value, bitWidth: fitted.bitWidth });
  },

  setEncoding: (e) => set({ encoding: e }),

  setActiveBase: (b) => set({ activeBase: b }),

  setSecondOperand: (s) => set({ secondOperand: s }),

  setPendingOp: (op) => set({ pendingOp: op }),

  setBitWidth: (w) => set({ bitWidth: w, autoBitWidth: false }),

  setAutoBitWidth: (on) => {
    if (!on) {
      set({ autoBitWidth: false });
      return;
    }
    // 开启 auto:立即按当前真值适配最小位长并重新编码
    const { value, isSigned, encoding, bitWidth } = get();
    const t = valueToTrueSafe(value, isSigned, encoding, bitWidth);
    const fitted = fitTrueValue(t, isSigned, encoding, true, bitWidth);
    set({ autoBitWidth: true, value: fitted.value, bitWidth: fitted.bitWidth });
  },

  setFromDecimal: (s) => {
    const t = parseDecimal(s);
    if (t === null) return;
    const { encoding, bitWidth, autoBitWidth, isSigned } = get();
    // 十进制输入直接得到真值,按真值适配位长并编码(支持扩展/收缩)
    // 超过 64 位无符号上限时,截断到上限避免错乱
    const clamped = t < 0n ? t : t > MASK[64] ? MASK[64] : t;
    const fitted = fitTrueValueForDec(clamped, isSigned, encoding, autoBitWidth, bitWidth);
    set({ value: fitted.value, bitWidth: fitted.bitWidth, isSigned: fitted.isSigned, lastExpression: "" });
  },

  setFromBinary: (s) => {
    const { bitWidth, autoBitWidth, encoding } = get();
    // 二进制是位模式:按无符号 magnitude 适配位长(不按旧位长截断,以支持扩展)
    const mag = binaryToValue(s);
    const fitted = fitTrueValue(mag, false, encoding, autoBitWidth, bitWidth);
    set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "" });
  },

  setFromHex: (s) => {
    const { bitWidth, autoBitWidth, encoding } = get();
    const mag = hexToValue(s);
    const fitted = fitTrueValue(mag, false, encoding, autoBitWidth, bitWidth);
    set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "" });
  },

  toggleBit: (index) => {
    const { value, bitWidth, autoBitWidth, isSigned, encoding } = get();
    const bit = 1n << BigInt(index);
    const newValue = (value ^ bit) & MASK[bitWidth];
    // 翻转后按新真值适配(可能收缩到更窄位长)
    const t = valueToTrueSafe(newValue, isSigned, encoding, bitWidth);
    const fitted = fitTrueValue(t, isSigned, encoding, autoBitWidth, bitWidth);
    set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "" });
  },

  appendDigit: (d) => {
    const {
      value,
      activeBase,
      isSigned,
      encoding,
      bitWidth,
      autoBitWidth,
      nextClears,
    } = get();
    const upper = d.toUpperCase();
    // 若处于"等待第二操作数"状态,下一次输入先清空
    const base = nextClears ? "0" : canonicalString(value, activeBase, isSigned, encoding, bitWidth);
    if (activeBase === "dec") {
      const s = base;
      const neg = isSigned && s.startsWith("-");
      const absPart = neg ? s.slice(1) : s;
      const newAbs = (absPart === "0" ? "" : absPart) + upper;
      const newTrue = (neg ? "-" : "") + newAbs;
      const t = parseDecimal(newTrue);
      if (t === null) return;
      // 超过 64 位无符号上限时拒绝这次输入,避免溢出错乱
      if (!decTrueValueFits64Unsigned(t)) return;
      const fitted = fitTrueValueForDec(t, isSigned, encoding, autoBitWidth, bitWidth);
      set({ value: fitted.value, bitWidth: fitted.bitWidth, isSigned: fitted.isSigned, lastExpression: "", nextClears: false });
      return;
    }
    if (activeBase === "bin") {
      if (upper !== "0" && upper !== "1") return;
      const ns = (base === "0" ? "" : base) + upper;
      const mag = binaryToValue(ns);
      const fitted = fitTrueValue(mag, false, encoding, autoBitWidth, bitWidth);
      set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "", nextClears: false });
      return;
    }
    // hex
    if (!/^[0-9A-F]$/.test(upper)) return;
    const ns = (base === "0" ? "" : base) + upper;
    const mag = hexToValue(ns);
    const fitted = fitTrueValue(mag, false, encoding, autoBitWidth, bitWidth);
    set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "", nextClears: false });
  },

  backspace: () => {
    const { value, activeBase, isSigned, encoding, bitWidth, autoBitWidth, nextClears } =
      get();
    if (nextClears) {
      // 等待第二操作数时退格视为清零
      set({ value: 0n, nextClears: false, lastExpression: "" });
      return;
    }
    if (activeBase === "dec") {
      const s = canonicalString(value, "dec", isSigned, encoding, bitWidth);
      const neg = isSigned && s.startsWith("-");
      const absPart = neg ? s.slice(1) : s;
      const newAbs = absPart.slice(0, -1) || "0";
      const newTrue = (neg ? "-" : "") + newAbs;
      const t = parseDecimal(newTrue);
      if (t === null) return;
      const fitted = fitTrueValueForDec(t, isSigned, encoding, autoBitWidth, bitWidth);
      set({ value: fitted.value, bitWidth: fitted.bitWidth, isSigned: fitted.isSigned, lastExpression: "" });
      return;
    }
    if (activeBase === "bin") {
      const s = canonicalString(value, "bin", isSigned, encoding, bitWidth);
      const ns = s.slice(0, -1) || "0";
      const mag = binaryToValue(ns);
      const fitted = fitTrueValue(mag, false, encoding, autoBitWidth, bitWidth);
      set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "" });
      return;
    }
    const s = canonicalString(value, "hex", isSigned, encoding, bitWidth);
    const ns = s.slice(0, -1) || "0";
    const mag = hexToValue(ns);
    const fitted = fitTrueValue(mag, false, encoding, autoBitWidth, bitWidth);
    set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "" });
  },

  toggleSign: () => {
    const { value, isSigned, encoding, bitWidth, autoBitWidth, activeBase } =
      get();
    if (!isSigned) return;
    if (activeBase !== "dec") return;
    const t = valueToTrue(value, true, encoding, bitWidth);
    const fitted = fitTrueValue(-t, isSigned, encoding, autoBitWidth, bitWidth);
    set({ value: fitted.value, bitWidth: fitted.bitWidth, lastExpression: "" });
  },

  clear: () =>
    set({
      value: 0n,
      pendingOp: null,
      lastExpression: "",
      bitWidth: 8,
      autoBitWidth: true,
      arithAcc: null,
      arithOp: null,
      nextClears: false,
    }),

  pressArith: (op) => {
    const { value, isSigned, encoding, bitWidth, autoBitWidth, arithAcc, arithOp, nextClears } = get();
    const tv = valueToTrue(value, isSigned, encoding, bitWidth);
    const symbol =
      op === "ADD" ? "+" :
      op === "SUB" ? "-" :
      op === "MUL" ? "×" :
      op === "DIV" ? "÷" :
      "%";
    // 若已有未提交的算术运算且用户已输入第二操作数,先结算再开启新一轮
    if (arithOp && arithAcc !== null && !nextClears) {
      let acc: bigint;
      if (arithOp === "ADD") acc = arithAcc + tv;
      else if (arithOp === "SUB") acc = arithAcc - tv;
      else if (arithOp === "MUL") acc = arithAcc * tv;
      else if (arithOp === "DIV") {
        if (tv === 0n) {
          // 除以 0 视为非法,清空算术状态,保留当前值
          set({ arithAcc: null, arithOp: null, nextClears: true, lastExpression: "除数不能为 0" });
          return;
        }
        // 整除(向 0 截断,与 C/JS 一致)
        acc = arithAcc / tv;
      } else {
        // MOD
        acc = tv === 0n ? arithAcc : arithAcc % tv;
      }
      // 把累加结果(真值)写入 state:支持自动扩展/收缩
      const fitted = fitTrueValue(acc, isSigned, encoding, autoBitWidth, bitWidth);
      set({
        value: fitted.value,
        bitWidth: fitted.bitWidth,
        arithAcc: acc,
        arithOp: op,
        nextClears: true,
        lastExpression: `${arithAcc} ${symbol} ${tv} =`,
      });
      return;
    }
    set({
      arithAcc: tv,
      arithOp: op,
      nextClears: true,
      lastExpression: `${tv} ${symbol}`,
    });
  },

  pressEquals: () => {
    const {
      value,
      isSigned,
      encoding,
      bitWidth,
      autoBitWidth,
      arithOp,
      arithAcc,
      pendingOp,
      secondOperand,
    } = get();

    // 优先处理算术运算
    if (arithOp && arithAcc !== null) {
      const tv = valueToTrue(value, isSigned, encoding, bitWidth);
      let resultTv: bigint;
      let expr: string;
      if (arithOp === "ADD") {
        resultTv = arithAcc + tv;
        expr = `${arithAcc} + ${tv}`;
      } else if (arithOp === "SUB") {
        resultTv = arithAcc - tv;
        expr = `${arithAcc} - ${tv}`;
      } else if (arithOp === "MUL") {
        resultTv = arithAcc * tv;
        expr = `${arithAcc} × ${tv}`;
      } else if (arithOp === "DIV") {
        if (tv === 0n) {
          // 除以 0 视为非法,清空算术状态,保留当前值
          set({ arithAcc: null, arithOp: null, nextClears: true, lastExpression: "除数不能为 0" });
          return;
        }
        // 整除(向 0 截断,与 C/JS 一致)
        resultTv = arithAcc / tv;
        expr = `${arithAcc} ÷ ${tv}`;
      } else if (arithOp === "MOD") {
        if (tv === 0n) {
          // 模 0 视为非法,清空算术状态,保留当前值
          set({ arithAcc: null, arithOp: null, nextClears: true, lastExpression: "除数不能为 0" });
          return;
        }
        resultTv = arithAcc % tv;
        expr = `${arithAcc} % ${tv}`;
      } else {
        return;
      }
      // 结果按真值适配位长(如 200+200=400 自动升到 16 位)
      const fitted = fitTrueValue(resultTv, isSigned, encoding, autoBitWidth, bitWidth);
      set({
        value: fitted.value,
        bitWidth: fitted.bitWidth,
        arithAcc: null,
        arithOp: null,
        nextClears: true,
        pendingOp: null,
        lastExpression: `${expr} =`,
      });
      return;
    }

    // 否则处理位运算
    if (pendingOp) {
      get().applyOp();
      return;
    }
  },

  applyOp: () => {
    const {
      value,
      pendingOp,
      secondOperand,
      encoding,
      bitWidth,
      autoBitWidth,
      isSigned,
    } = get();
    if (!pendingOp) return;
    const t = parseDecimal(secondOperand);
    const bTrue = t ?? 0n;
    const bValue = trueToValue(bTrue, encoding, bitWidth);
    const result = applyBitOp(value, pendingOp, bitWidth, bValue);
    const sym = {
      AND: "&",
      OR: "|",
      XOR: "^",
      NOT: "~",
      SHL: "<<",
      SHR: ">>",
      NEG: "neg",
    }[pendingOp];
    // 位运算结果是位模式:按当前符号性解释成真值后适配(可能收缩位长)
    const rt = valueToTrueSafe(result, isSigned, encoding, bitWidth);
    const fitted = fitTrueValue(rt, isSigned, encoding, autoBitWidth, bitWidth);
    set({
      value: fitted.value,
      bitWidth: fitted.bitWidth,
      lastExpression: `${value.toString(16).toUpperCase()} ${sym} ${bValue
        .toString(16)
        .toUpperCase()}`,
      pendingOp: null,
    });
  },
}));
