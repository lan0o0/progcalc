// 进制类型
export type Base = "dec" | "bin" | "hex";

// 机器码编码方式:原码 / 反码 / 补码
export type Encoding = "true" | "ones" | "twos";

// 位运算操作符
export type BitOp = "AND" | "OR" | "XOR" | "NOT" | "SHL" | "SHR" | "NEG";

// 可选位长
export type BitWidth = 8 | 16 | 32 | 64;

export const BIT_WIDTHS: BitWidth[] = [8, 16, 32, 64];

// 各位长对应的掩码(预计算)
export const MASK: Record<BitWidth, bigint> = {
  8: 0xffn,
  16: 0xffffn,
  32: 0xffffffffn,
  64: 0xffffffffffffffffn,
};

// 符号位
export function signBitMask(w: BitWidth): bigint {
  return 1n << BigInt(w - 1);
}

// 数值位掩码(去掉符号位)
export function magnitudeMask(w: BitWidth): bigint {
  return MASK[w] ^ signBitMask(w);
}

// 计算器状态(位长可变)
export interface CalculatorState {
  /** 当前数值,内部以无符号存储(范围由 bitWidth 决定) */
  value: bigint;
  /** 是否按有符号数解释 */
  isSigned: boolean;
  /** 当前激活的进制(用于显示屏主进制) */
  activeBase: Base;
  /** 当前查看的机器码编码方式 */
  encoding: Encoding;
  /** 位长 */
  bitWidth: BitWidth;
  /** 是否自动适配位长 */
  autoBitWidth: boolean;
  /** 位运算第二操作数(十进制字符串) */
  secondOperand: string;
  /** 待执行的位运算 */
  pendingOp: BitOp | null;
  /** 上一次位运算结果回填时使用的表达式,用于显示屏副标题 */
  lastExpression: string;
}
