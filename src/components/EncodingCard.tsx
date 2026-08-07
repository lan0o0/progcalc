import { Encoding } from "@/types";
import { useCalculator } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";
import {
  encodingRange,
  trueToBinary,
  valueToTrue,
} from "@/utils/conversion";

const ENC_LABEL: Record<Encoding, string> = {
  true: "原码",
  ones: "反码",
  twos: "补码",
};

interface Props {
  encoding: Encoding;
}

/** 紧凑单行机器码卡片 */
export default function EncodingCard({ encoding }: Props) {
  const { value, isSigned, encoding: currentEnc, setEncoding, bitWidth } =
    useCalculator();

  if (!isSigned) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
        <span className="font-mono text-xs text-inkDim">{ENC_LABEL[encoding]}</span>
        <span className="text-[10px] text-inkDim/60">切 SIGNED 查看</span>
      </div>
    );
  }

  const trueValue = valueToTrue(value, true, encoding, bitWidth);
  const [min, max] = encodingRange(encoding, bitWidth);
  const overflow = trueValue < min || trueValue > max;
  const binary = overflow ? "" : trueToBinary(trueValue, encoding, bitWidth);
  const signBit = binary ? binary[0] : "";

  return (
    <button
      onClick={() => setEncoding(encoding)}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
        "bg-white/[0.03] hover:bg-white/[0.06]",
        currentEnc === encoding && "ring-1 ring-keyOp/50"
      )}
    >
      <span
        className={cn(
          "w-9 shrink-0 font-mono text-[11px] font-semibold",
          currentEnc === encoding ? "text-keyOp" : "text-inkDim"
        )}
      >
        {ENC_LABEL[encoding]}
      </span>
      <code className="flex-1 break-all text-right font-mono text-[11px] leading-none text-inkDim">
        {binary ? (
          <>
            <span className="text-keyOp">{signBit}</span>
            {binary.slice(1)}
          </>
        ) : (
          "溢出"
        )}
      </code>
      <span className="w-16 shrink-0 text-right font-mono text-xs text-ink">
        {overflow ? "—" : trueValue.toString()}
      </span>
    </button>
  );
}
