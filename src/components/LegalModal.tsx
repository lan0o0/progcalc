import { useEffect, useRef, useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { LegalDocument } from "@/legal/content";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  doc: LegalDocument | null;
  onClose: () => void;
}

/**
 * 通用法律文本查看器:通过 WebView/iframe 加载公网独立成文的协议页。
 *
 * 合规方案1:协议内容为公网独立 HTML 文件,可被监管验证,更新无需发版。
 * 本地不保留协议正文副本,仅保留标题/版本等元数据用于展示。
 */
export default function LegalModal({ open, doc, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // 加载超时定时器(8 秒未触发 onLoad 视为失败)
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !doc) return;
    setLoading(true);
    setFailed(false);
    // 8 秒超时兜底:网络不通时 onLoad 不触发,需主动判失败
    timerRef.current = window.setTimeout(() => {
      setLoading(false);
      setFailed(true);
    }, 8000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open, doc, reloadKey]);

  const handleIframeLoad = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setLoading(false);
    setFailed(false);
  };

  const handleRetry = () => {
    setFailed(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

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
                  <h3 className="truncate text-sm font-semibold text-ink">
                    {doc.title}
                  </h3>
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

              {/* 正文:iframe 加载公网协议页 */}
              <div className="relative flex-1 overflow-hidden bg-screen">
                {/* 加载态 */}
                {loading && !failed && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-inkDim">
                    <RefreshCw size={20} className="animate-spin" />
                    <span className="text-[12px]">正在加载协议内容…</span>
                  </div>
                )}

                {/* 失败兜底:网络不通时提示重试 */}
                {failed ? (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-[13px] text-ink/80">
                      协议内容加载失败
                    </p>
                    <p className="text-[11px] text-inkDim">
                      请检查网络连接后重试
                    </p>
                    <button
                      onClick={handleRetry}
                      className="mt-1 flex items-center gap-1.5 rounded-lg bg-keyOp px-4 py-2 text-[12px] font-semibold text-black hover:bg-keyOpHover"
                    >
                      <RefreshCw size={14} />
                      重新加载
                    </button>
                  </div>
                ) : (
                  <iframe
                    key={reloadKey}
                    src={doc.url}
                    onLoad={handleIframeLoad}
                    title={doc.title}
                    className="h-full w-full border-0 bg-white"
                    // 允许同源访问以便复制选中文本;禁止外部跳转
                    sandbox="allow-same-origin allow-popups"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
