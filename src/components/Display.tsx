import { Settings } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useCalculator } from "@/store/calculatorStore";
import { valueToTrue } from "@/utils/conversion";

const BASE_LABEL = { dec: "DEC", bin: "BIN", hex: "HEX" } as const;
const ENC_LABEL = { true: "原码", ones: "反码", twos: "补码" } as const;

// 显示区域固定高度:字号变化时高度保持不变,避免上下跳动
const FIXED_HEIGHT = 64;
const MAX_FONT = 48;
const MIN_FONT = 16;

interface Props {
  onOpenSettings: () => void;
}

/** 纯显示屏:仅显示数值与状态,无任何操作按钮 */
export default function Display({ onOpenSettings }: Props) {
  const {
    value,
    isSigned,
    activeBase,
    encoding,
    bitWidth,
    autoBitWidth,
    lastExpression,
    pendingOp,
    arithOp,
  } = useCalculator();

  const trueValue = valueToTrue(value, isSigned, encoding, bitWidth);
  const main =
    activeBase === "dec"
      ? trueValue.toString()
      : activeBase === "bin"
      ? value.toString(2)
      : value.toString(16).toUpperCase();

  const hasPending = pendingOp || arithOp;

  // 自适应字号:单行显示,内容过长时自动缩小字号至刚好能容纳。
  // 显示区域高度固定不变,避免输入时上下跳动。
  const valueRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(MAX_FONT);

  useLayoutEffect(() => {
    const el = valueRef.current;
    if (!el) return;
    // 先用最大字号测量:若不溢出,直接用最大字号
    el.style.fontSize = MAX_FONT + "px";
    if (el.scrollWidth <= el.clientWidth) {
      setFontSize(MAX_FONT);
      return;
    }
    // 二分查找:[MIN_FONT, MAX_FONT] 间找最大且不溢出的字号
    let lo = MIN_FONT;
    let hi = MAX_FONT;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi + 1) / 2);
      el.style.fontSize = mid + "px";
      if (el.scrollWidth <= el.clientWidth) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    setFontSize(lo);
  }, [main]);

  return (
    <div className="rounded-2xl bg-screen px-4 py-5">
      {/* 状态行:左侧设置入口(高亮),右侧状态标签 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onOpenSettings}
          className="group flex items-center gap-1.5 rounded-full bg-keyOp/20 px-2.5 py-1 text-keyOp transition-all hover:bg-keyOp/30 active:scale-95"
          aria-label="设置"
        >
          <Settings
            size={14}
            className="transition-transform group-hover:rotate-45"
          />
          <span className="font-mono text-[10px] font-medium">设置</span>
        </button>
        <span className="font-mono text-[10px] text-inkDim">
          {BASE_LABEL[activeBase]} · {bitWidth}-bit
          {autoBitWidth ? " · AUTO" : ""}
          {isSigned ? ` · ${ENC_LABEL[encoding]}` : " · UNSIGNED"}
        </span>
      </div>

      {/* 表达式行 */}
      <div className="mt-2 truncate text-right font-mono text-xs text-keyOp/80">
        {lastExpression || (hasPending ? `${pendingOp || arithOp} …` : "\u00A0")}
      </div>

      {/* 主数值:固定高度,字号自适应缩小,单行不换行,高度不跳动 */}
      <div
        ref={valueRef}
        className="mt-1 overflow-hidden whitespace-nowrap text-right font-mono font-light tracking-tight text-ink"
        style={{
          height: FIXED_HEIGHT + "px",
          lineHeight: FIXED_HEIGHT + "px",
          fontSize: fontSize + "px",
        }}
      >
        {main || "0"}
      </div>
    </div>
  );
}
