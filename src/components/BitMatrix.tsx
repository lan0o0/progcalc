import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCalculator } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";

/** 位图:可折叠,默认展开 */
export default function BitMatrix() {
  const { value, bitWidth, toggleBit } = useCalculator();
  const [open, setOpen] = useState(true);

  const positions = Array.from(
    { length: bitWidth },
    (_, i) => bitWidth - 1 - i
  );
  const rows: number[][] = [];
  for (let i = 0; i < positions.length; i += 8) {
    rows.push(positions.slice(i, i + 8));
  }

  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-[11px] text-inkDim"
      >
        <span>位图 · 点击翻转</span>
        <span className="flex items-center gap-1 font-mono">
          {bitWidth}-bit
          <ChevronDown
            size={12}
            className={cn("transition-transform", !open && "-rotate-90")}
          />
        </span>
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-8 gap-1">
              {row.map((bitIndex) => {
                const bit = (value >> BigInt(bitIndex)) & 1n;
                const isSign = bitIndex === bitWidth - 1;
                return (
                  <button
                    key={bitIndex}
                    onClick={() => toggleBit(bitIndex)}
                    title={`bit ${bitIndex} = ${bit === 1n ? 1 : 0}`}
                    className={cn(
                      "aspect-square rounded font-mono text-[9px] font-semibold leading-none transition-all duration-100",
                      "flex items-center justify-center",
                      bit === 1n
                        ? "bg-bitOn text-black"
                        : "bg-bitOff text-inkDim/60",
                      isSign && "ring-1 ring-bitSign/70"
                    )}
                  >
                    {bit === 1n ? "1" : "0"}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
