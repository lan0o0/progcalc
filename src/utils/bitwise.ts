import { BitOp, BitWidth, MASK } from "@/types";

/**
 * 对指定位长的无符号 value 执行位运算。
 * b 为第二操作数(无符号),仅二元运算使用。
 */
export function applyBitOp(
  a: bigint,
  op: BitOp,
  bitWidth: BitWidth,
  b?: bigint
): bigint {
  const mask = MASK[bitWidth];
  const x = a & mask;
  const y = (b ?? 0n) & mask;
  const shiftMod = BigInt(bitWidth);
  switch (op) {
    case "AND":
      return (x & y) & mask;
    case "OR":
      return (x | y) & mask;
    case "XOR":
      return (x ^ y) & mask;
    case "NOT":
      return (~x) & mask;
    case "SHL":
      return (x << (y % shiftMod)) & mask;
    case "SHR":
      // 逻辑右移(无符号)
      return (x & mask) >> (y % shiftMod);
    case "NEG":
      // 补码取负 = ~x + 1
      return (~x + 1n) & mask;
  }
}

export const BIT_OP_SYMBOL: Record<BitOp, string> = {
  AND: "&",
  OR: "|",
  XOR: "^",
  NOT: "~",
  SHL: "<<",
  SHR: ">>",
  NEG: "neg",
};

export const BIT_OP_LABEL: Record<BitOp, string> = {
  AND: "AND",
  OR: "OR",
  XOR: "XOR",
  NOT: "NOT",
  SHL: "SHL",
  SHR: "SHR",
  NEG: "NEG",
};
