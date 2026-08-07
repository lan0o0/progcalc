import { Plus, Equal, Delete, Minus, Percent, X, Divide } from "lucide-react";
import { useCalculator } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";
import { Base } from "@/types";

function isAllowed(ch: string, base: Base): boolean {
  if (base === "bin") return ch === "0" || ch === "1";
  if (base === "dec") return /^[0-9]$/.test(ch);
  return /^[0-9A-F]$/.test(ch);
}

export default function NumericKeypad() {
  const {
    activeBase,
    appendDigit,
    backspace,
    isSigned,
    pressArith,
    pressEquals,
    clear,
  } = useCalculator();

  return (
    <div className="rounded-2xl bg-panel/60 p-2">
      <div className="grid grid-cols-4 gap-1.5">
        {/* 第一行:A B C AC */}
        <Key label="A" disabled={!isAllowed("A", activeBase)} onClick={() => appendDigit("A")} />
        <Key label="B" disabled={!isAllowed("B", activeBase)} onClick={() => appendDigit("B")} />
        <Key label="C" disabled={!isAllowed("C", activeBase)} onClick={() => appendDigit("C")} />
        <Key label="AC" onClick={clear} variant="func" />

        {/* 第二行:D E F ⌫ */}
        <Key label="D" disabled={!isAllowed("D", activeBase)} onClick={() => appendDigit("D")} />
        <Key label="E" disabled={!isAllowed("E", activeBase)} onClick={() => appendDigit("E")} />
        <Key label="F" disabled={!isAllowed("F", activeBase)} onClick={() => appendDigit("F")} />
        <Key icon={<Delete size={22} />} onClick={backspace} variant="func" />

        {/* 第三行:7 8 9 + */}
        <Key label="7" disabled={!isAllowed("7", activeBase)} onClick={() => appendDigit("7")} />
        <Key label="8" disabled={!isAllowed("8", activeBase)} onClick={() => appendDigit("8")} />
        <Key label="9" disabled={!isAllowed("9", activeBase)} onClick={() => appendDigit("9")} />
        <Key icon={<Plus size={18} />} onClick={() => pressArith("ADD")} variant="op" />

        {/* 第四行:4 5 6 -(减法) */}
        <Key label="4" disabled={!isAllowed("4", activeBase)} onClick={() => appendDigit("4")} />
        <Key label="5" disabled={!isAllowed("5", activeBase)} onClick={() => appendDigit("5")} />
        <Key label="6" disabled={!isAllowed("6", activeBase)} onClick={() => appendDigit("6")} />
        <Key icon={<Minus size={18} />} onClick={() => pressArith("SUB")} variant="op" />

        {/* 第五行:1 2 3 % */}
        <Key label="1" disabled={!isAllowed("1", activeBase)} onClick={() => appendDigit("1")} />
        <Key label="2" disabled={!isAllowed("2", activeBase)} onClick={() => appendDigit("2")} />
        <Key label="3" disabled={!isAllowed("3", activeBase)} onClick={() => appendDigit("3")} />
        <Key icon={<Percent size={18} />} onClick={() => pressArith("MOD")} variant="op" />

        {/* 第六行:0 × ÷ =(各占1列) */}
        <Key label="0" disabled={!isAllowed("0", activeBase)} onClick={() => appendDigit("0")} />
        <Key icon={<X size={18} />} onClick={() => pressArith("MUL")} variant="op" />
        <Key icon={<Divide size={18} />} onClick={() => pressArith("DIV")} variant="op" />
        <Key icon={<Equal size={18} />} onClick={pressEquals} variant="op" />
      </div>
    </div>
  );
}

interface KeyProps {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "digit" | "func" | "op";
  disabled?: boolean;
  colSpan?: boolean;
  rowSpan?: boolean;
}

function Key({ label, icon, onClick, variant = "digit", disabled, colSpan, rowSpan }: KeyProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "key-press flex h-12 items-center justify-center rounded-xl text-base font-medium transition-colors",
        colSpan ? "col-span-2" : "",
        rowSpan ? "row-span-2" : "",
        disabled && "opacity-30",
        variant === "func"
          ? "bg-keyFunc text-black hover:bg-keyFuncHover"
          : variant === "op"
          ? "bg-keyOp text-black hover:bg-keyOpHover"
          : "bg-keyDark text-ink hover:bg-keyDarkHover"
      )}
    >
      {icon ?? label}
    </button>
  );
}
