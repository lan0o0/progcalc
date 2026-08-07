import { BitOp } from "@/types";
import { useCalculator } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";
import { BIT_OP_LABEL } from "@/utils/bitwise";

const OPS: BitOp[] = ["AND", "OR", "XOR", "NOT", "SHL", "SHR", "NEG"];

export default function BitOpPad() {
  const { pendingOp, secondOperand, setPendingOp, setSecondOperand } =
    useCalculator();

  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-2">
        <input
          value={secondOperand}
          inputMode="numeric"
          spellCheck={false}
          onChange={(e) => setSecondOperand(e.target.value)}
          placeholder="第二操作数 DEC"
          className="w-28 rounded-md bg-black/40 px-2 py-1 text-right font-mono text-xs text-ink outline-none ring-1 ring-divider focus:ring-keyOp/50"
        />
        <div className="grid flex-1 grid-cols-7 gap-1">
          {OPS.map((op) => (
            <button
              key={op}
              onClick={() => setPendingOp(pendingOp === op ? null : op)}
              className={cn(
                "key-press rounded-md py-1.5 font-mono text-[10px] font-semibold transition-colors",
                pendingOp === op
                  ? "bg-keyOp text-black"
                  : "bg-keyDark text-ink hover:bg-keyDarkHover"
              )}
            >
              {BIT_OP_LABEL[op]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
