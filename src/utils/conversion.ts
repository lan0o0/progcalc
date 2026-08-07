import { BIT_WIDTHS, BitWidth, Encoding, MASK, magnitudeMask, signBitMask } from "@/types";

/**
 * 内部 value 始终是无符号 BigInt,范围由 bitWidth 决定。
 * isSigned + encoding 决定如何把 value 解释成"十进制真值"。
 */

/** value -> 指定编码下的十进制真值(BigInt,带符号) */
export function valueToTrue(
  value: bigint,
  isSigned: boolean,
  encoding: Encoding,
  bitWidth: BitWidth
): bigint {
  const mask = MASK[bitWidth];
  const v = value & mask;
  if (!isSigned) return v;
  const sign = signBitMask(bitWidth);
  const mag = magnitudeMask(bitWidth);
  const isNeg = (v & sign) !== 0n;
  const magVal = v & mag;
  switch (encoding) {
    case "true": // 原码
      return isNeg ? -magVal : v;
    case "ones": // 反码
      if (!isNeg) return v;
      return -((~v) & mag);
    case "twos": // 补码
      if (!isNeg) return v;
      return v - (1n << BigInt(bitWidth));
  }
}

/** 十进制真值 -> value(按指定编码编出 bit pattern) */
export function trueToValue(
  trueValue: bigint,
  encoding: Encoding,
  bitWidth: BitWidth
): bigint {
  const mask = MASK[bitWidth];
  if (trueValue >= 0n) return trueValue & mask;
  const abs = -trueValue;
  const sign = signBitMask(bitWidth);
  const mag = magnitudeMask(bitWidth);
  switch (encoding) {
    case "true": // 符号位 + 绝对值
      return (sign | (abs & mag)) & mask;
    case "ones": // ~abs
      return (~abs) & mask;
    case "twos": // 2^bitWidth + x
      return ((1n << BigInt(bitWidth)) + trueValue) & mask;
  }
}

/** 各编码的有效真值范围 [min, max] */
export function encodingRange(
  encoding: Encoding,
  bitWidth: BitWidth
): [bigint, bigint] {
  const mag = magnitudeMask(bitWidth); // 2^(w-1) - 1
  switch (encoding) {
    case "true":
    case "ones":
      return [-mag, mag];
    case "twos":
      return [-(1n << BigInt(bitWidth - 1)), (1n << BigInt(bitWidth - 1)) - 1n];
  }
}

/** 真值 -> 指定编码的 bitWidth 位二进制串 */
export function trueToBinary(
  trueValue: bigint,
  encoding: Encoding,
  bitWidth: BitWidth
): string {
  const v = trueToValue(trueValue, encoding, bitWidth);
  return v.toString(2).padStart(bitWidth, "0");
}

/** value -> bitWidth 位二进制串(原始 bit pattern) */
export function valueToBinary(value: bigint, bitWidth: BitWidth): string {
  return (value & MASK[bitWidth]).toString(2).padStart(bitWidth, "0");
}

/** value -> 十六进制串(位数 = bitWidth/4,大写) */
export function valueToHex(value: bigint, bitWidth: BitWidth): string {
  const hexDigits = bitWidth / 4;
  return (value & MASK[bitWidth])
    .toString(16)
    .toUpperCase()
    .padStart(hexDigits, "0");
}

/** 二进制字符串 -> 无符号 magnitude(过滤非法字符,最多 64 位,不按当前位长截断以支持自动扩展) */
export function binaryToValue(bin: string): bigint {
  const clean = bin.replace(/[^01]/g, "").slice(-64) || "0";
  return BigInt("0b" + clean) & MASK[64];
}

/** 十六进制字符串 -> 无符号 magnitude(过滤非法字符,最多 16 个 hex=64 位) */
export function hexToValue(hex: string): bigint {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "").slice(-16) || "0";
  return BigInt("0x" + clean) & MASK[64];
}

/** 十进制字符串 -> 真值 BigInt(过滤非法字符,允许负号) */
export function parseDecimal(dec: string): bigint | null {
  const clean = dec.trim().replace(/(?!^-)[^\d]/g, "");
  if (clean === "" || clean === "-") return null;
  try {
    return BigInt(clean);
  } catch {
    return null;
  }
}

/** 判断真值能否在指定位长(给定符号性/编码)下完整表示 */
export function fitsInWidth(
  trueValue: bigint,
  isSigned: boolean,
  encoding: Encoding,
  w: BitWidth
): boolean {
  if (!isSigned) return trueValue >= 0n && trueValue <= MASK[w];
  const [min, max] = encodingRange(encoding, w);
  return trueValue >= min && trueValue <= max;
}

/**
 * 自动适配最小位长,使 trueValue 能被完整表示。
 * 必须知道符号性与编码:有符号时正数也受 2^(w-1)-1 限制
 * (例如 signed 8-bit 最大是 127,200 需要 16 位)。
 * 超过 64 位范围时返回 64。
 */
export function autoFitBitWidth(
  trueValue: bigint,
  isSigned: boolean,
  encoding: Encoding
): BitWidth {
  for (const w of BIT_WIDTHS) {
    if (fitsInWidth(trueValue, isSigned, encoding, w)) return w;
  }
  return 64;
}
