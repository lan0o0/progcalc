import { X } from "lucide-react";
import { BIT_WIDTHS, BitWidth, Encoding } from "@/types";
import { useCalculator } from "@/store/calculatorStore";
import { cn } from "@/lib/utils";
import AboutSection from "./AboutSection";
import ThemeSection from "./ThemeSection";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ENCODINGS: { value: Encoding; label: string; desc: string }[] = [
  { value: "twos", label: "补码", desc: "Two's Complement" },
  { value: "true", label: "原码", desc: "Sign-Magnitude" },
  { value: "ones", label: "反码", desc: "Ones' Complement" },
];

export default function SettingsDrawer({ open, onClose }: Props) {
  const {
    isSigned,
    setSigned,
    bitWidth,
    autoBitWidth,
    setBitWidth,
    setAutoBitWidth,
    encoding,
    setEncoding,
  } = useCalculator();

  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {/* 抽屉 */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[300px] flex-col bg-panel shadow-panel transition-transform duration-300 ease-apple",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header
          className="flex items-center justify-between border-b border-divider px-4 py-3"
          style={{ paddingTop: "calc(var(--safe-top, 0px) + 0.75rem)" }}
        >
          <h2 className="text-sm font-semibold text-ink">设置</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-inkDim hover:bg-white/5 hover:text-ink"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* 主题颜色 */}
          <ThemeSection />

          {/* 符号性 */}
          <Section title="符号性">
            <div className="grid grid-cols-2 gap-2">
              <ChoiceBtn
                active={!isSigned}
                onClick={() => setSigned(false)}
                label="UNSIGNED"
                sub="无符号"
              />
              <ChoiceBtn
                active={isSigned}
                onClick={() => setSigned(true)}
                label="SIGNED"
                sub="有符号"
              />
            </div>
          </Section>

          {/* 位长 */}
          <Section title="位长">
            <div className="grid grid-cols-5 gap-2">
              <ChoiceBtn
                active={autoBitWidth}
                onClick={() => setAutoBitWidth(true)}
                label="AUTO"
              />
              {BIT_WIDTHS.map((w: BitWidth) => (
                <ChoiceBtn
                  key={w}
                  active={!autoBitWidth && bitWidth === w}
                  onClick={() => setBitWidth(w)}
                  label={`${w}`}
                />
              ))}
            </div>
          </Section>

          {/* 编码方式 */}
          <Section title="编码方式(影响 DEC 解释)">
            <div className="space-y-2">
              {ENCODINGS.map((e) => (
                <ChoiceBtn
                  key={e.value}
                  active={encoding === e.value}
                  onClick={() => setEncoding(e.value)}
                  label={e.label}
                  sub={e.desc}
                  block
                />
              ))}
            </div>
          </Section>

          <p className="px-1 pt-2 text-[11px] leading-relaxed text-inkDim/70">
            AUTO 会根据数值自动选择最小适配位长。手动选择某位长后将锁定,直至重新点 AUTO。
          </p>

          {/* 关于我们:含用户协议、隐私政策、个人信息收集清单 */}
          <AboutSection />
        </div>
      </aside>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-inkDim">
        {title}
      </div>
      {children}
    </div>
  );
}

function ChoiceBtn({
  active,
  onClick,
  label,
  sub,
  block,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  block?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 text-left transition-colors",
        block && "w-full",
        active
          ? "bg-keyOp text-black"
          : "bg-keyDark text-ink hover:bg-keyDarkHover"
      )}
    >
      <div className="font-mono text-xs font-semibold">{label}</div>
      {sub && <div className="text-[10px] opacity-70">{sub}</div>}
    </button>
  );
}
