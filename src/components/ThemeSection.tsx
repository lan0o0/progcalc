import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import { useThemeStore, ThemeMode } from "@/store/themeStore";
import { cn } from "@/lib/utils";

const OPTIONS: {
  value: ThemeMode;
  label: string;
  desc: string;
  Icon: typeof Moon;
}[] = [
  { value: "auto", label: "自动", desc: "跟随系统", Icon: MonitorSmartphone },
  { value: "dark", label: "深色", desc: "Dark", Icon: Moon },
  { value: "light", label: "浅色", desc: "Light", Icon: Sun },
];

/**
 * 设置抽屉中的「主题颜色」区块:自动 / 深色 / 浅色 三选一。
 * 选择后立即生效并持久化到 localStorage。
 */
export default function ThemeSection() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <div>
      <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-inkDim">
        主题颜色
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value, label, desc, Icon }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 transition-colors",
                active
                  ? "bg-keyOp text-black"
                  : "bg-keyDark text-ink hover:bg-keyDarkHover"
              )}
            >
              <Icon size={16} />
              <div className="font-mono text-[11px] font-semibold">{label}</div>
              <div className="text-[9px] opacity-70">{desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
