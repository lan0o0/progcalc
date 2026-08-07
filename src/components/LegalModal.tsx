import { X } from "lucide-react";
import { LegalDocument } from "@/legal/content";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  doc: LegalDocument | null;
  onClose: () => void;
}

/** 通用法律文本查看器:展示一份 LegalDocument 的标题/版本/章节。 */
export default function LegalModal({ open, doc, onClose }: Props) {
  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {/* 全屏弹层 */}
      <div
        className={cn(
          "fixed inset-0 z-[61] flex items-end justify-center sm:items-center transition-all duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        style={{
          paddingTop: "calc(var(--safe-top, 0px) + 0.5rem)",
          paddingBottom: "calc(var(--safe-bottom, 0px) + 0.5rem)",
        }}
      >
        <div
          className={cn(
            "flex h-full w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-panel shadow-panel transition-transform duration-300 ease-apple sm:h-[88vh] sm:rounded-2xl",
            open ? "translate-y-0" : "translate-y-full"
          )}
        >
          {doc && (
            <>
              {/* 头部 */}
              <header className="flex items-center justify-between border-b border-divider px-4 py-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-ink">{doc.title}</h3>
                  <p className="font-mono text-[10px] text-inkDim">
                    {doc.version} · 更新于 {doc.updatedAt}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-inkDim hover:bg-white/5 hover:text-ink"
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </header>

              {/* 正文 */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="mb-4 text-[12px] leading-relaxed text-inkDim">{doc.intro}</p>
                <div className="space-y-4">
                  {doc.sections.map((sec, i) => (
                    <section key={i}>
                      <h4 className="mb-1.5 text-[13px] font-semibold text-ink">{sec.heading}</h4>
                      {sec.paragraphs?.map((p, j) => (
                        <p key={j} className="mb-1.5 text-[12px] leading-relaxed text-ink/80">
                          {p}
                        </p>
                      ))}
                      {sec.list && (
                        <ul className="ml-4 list-disc space-y-1">
                          {sec.list.map((item, k) => (
                            <li
                              key={k}
                              className="text-[12px] leading-relaxed text-ink/80"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
