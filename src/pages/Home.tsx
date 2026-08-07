import { useState } from "react";
import Display from "@/components/Display";
import SettingsDrawer from "@/components/SettingsDrawer";
import BaseInputRow from "@/components/BaseInputRow";
import EncodingCard from "@/components/EncodingCard";
import BitMatrix from "@/components/BitMatrix";
import BitOpPad from "@/components/BitOpPad";
import NumericKeypad from "@/components/NumericKeypad";
import { cn } from "@/lib/utils";

type Tab = "base" | "encoding" | "bit";

const TABS: { id: Tab; label: string }[] = [
  { id: "base", label: "进制" },
  { id: "encoding", label: "机器码" },
  { id: "bit", label: "位图/运算" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("base");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        paddingTop: "var(--safe-top, 0px)",
        paddingBottom: "var(--safe-bottom, 0px)",
      }}
    >
      {/* 主内容区 */}
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col gap-3 px-3 pt-4 pb-3">
        {/* 显示屏 */}
        <Display onOpenSettings={() => setSettingsOpen(true)} />

        {/* Tab 切换 */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-panel/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg py-1.5 text-xs font-medium transition-colors",
                tab === t.id
                  ? "bg-keyOp text-black"
                  : "text-inkDim hover:bg-white/5 hover:text-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 内容(弹性填充,避免底部键盘被挤) */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {tab === "base" && (
            <section className="space-y-1 rounded-2xl bg-panel/60 p-2">
              <BaseInputRow base="dec" label="DEC" />
              <BaseInputRow base="hex" label="HEX" />
              <BaseInputRow base="bin" label="BIN" />
            </section>
          )}
          {tab === "encoding" && (
            <section className="space-y-1">
              <EncodingCard encoding="true" />
              <EncodingCard encoding="ones" />
              <EncodingCard encoding="twos" />
            </section>
          )}
          {tab === "bit" && (
            <section className="space-y-2">
              <BitMatrix />
              <BitOpPad />
            </section>
          )}
        </div>

        {/* 底部:数字键盘(含 AC)固定 */}
        <NumericKeypad />
      </main>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
