import { Base, MASK } from "@/types";
import { useCalculator } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";
import { valueToTrue } from "@/utils/conversion";

interface Props {
  base: Base;
  label: string;
}

export default function BaseInputRow({ base, label }: Props) {
  const {
    value,
    isSigned,
    encoding,
    bitWidth,
    activeBase,
    setActiveBase,
  } = useCalculator();

  const formatted =
    base === "dec"
      ? valueToTrue(value, isSigned, encoding, bitWidth).toString()
      : base === "bin"
      ? (value & MASK[bitWidth]).toString(2).padStart(bitWidth, "0")
      : (value & MASK[bitWidth])
          .toString(16)
          .toUpperCase()
          .padStart(bitWidth / 4, "0");

  const isActive = activeBase === base;
  // BIN 串较长,用更小字体
  const isLong = base === "bin" && bitWidth >= 32;

  return (
    <div
      onClick={() => setActiveBase(base)}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer select-none",
        isActive ? "bg-keyOp/15 ring-1 ring-keyOp/40" : "hover:bg-white/5"
      )}
    >
      <span
        className={cn(
          "w-8 shrink-0 font-mono text-[10px] font-semibold tracking-wider",
          isActive ? "text-keyOp" : "text-inkDim"
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "w-full truncate text-right font-mono text-ink",
          isLong ? "text-[11px]" : "text-sm"
        )}
      >
        {formatted}
      </div>
    </div>
  );
}
