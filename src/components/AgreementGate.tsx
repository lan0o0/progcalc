import { useState } from "react";
import { FileText, ShieldCheck, ChevronRight } from "lucide-react";
import {
  AGREEMENT_SUMMARY,
  USER_AGREEMENT,
  PRIVACY_POLICY,
  PERSONAL_INFO_LIST,
  LegalDocument,
} from "@/legal/content";
import LegalModal from "./LegalModal";
import { cn } from "@/lib/utils";

/** localStorage 键名:记录用户是否已同意协议 */
const AGREEMENT_KEY = "progcalc.agreement.accepted";

/** 检查用户是否已同意协议(仅在客户端执行) */
export function isAgreementAccepted(): boolean {
  try {
    return localStorage.getItem(AGREEMENT_KEY) === "true";
  } catch {
    // localStorage 不可用时(隐私模式/异常)默认放行,避免阻塞使用
    return false;
  }
}

interface Props {
  /** 用户同意后回调 */
  onAgree: () => void;
}

/**
 * 首次启动协议门:覆盖整屏,展示协议摘要 + 三份文档入口。
 * 同意后才允许进入主程序;拒绝则提示退出。
 */
export default function AgreementGate({ onAgree }: Props) {
  const [activeDoc, setActiveDoc] = useState<LegalDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDoc = (doc: LegalDocument) => {
    setActiveDoc(doc);
    setModalOpen(true);
  };

  const closeDoc = () => setModalOpen(false);

  const handleAgree = () => {
    try {
      localStorage.setItem(AGREEMENT_KEY, "true");
    } catch {
      // 写入失败不阻塞使用
    }
    onAgree();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-screen"
      style={{
        paddingTop: "var(--safe-top, 0px)",
        paddingBottom: "var(--safe-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-col px-5 py-6">
        {/* 顶部图标 + 标题 */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-keyOp/15 ring-1 ring-keyOp/30">
            <ShieldCheck size={28} className="text-keyOp" />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-ink">{AGREEMENT_SUMMARY.title}</h1>
          <p className="mt-1 text-[12px] text-inkDim">
            请在使用前阅读并同意以下协议
          </p>
        </div>

        {/* 滚动正文 */}
        <div className="mt-5 flex-1 overflow-y-auto">
          <p className="text-[12px] leading-relaxed text-ink/80">
            {AGREEMENT_SUMMARY.intro}
          </p>

          {/* 关键提示 */}
          <ul className="mt-4 space-y-2">
            {AGREEMENT_SUMMARY.highlights.map((h, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[12px] leading-relaxed text-ink/80"
              >
                <span className="mt-0.5 shrink-0 text-keyOp">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>

          {/* 协议入口 */}
          <div className="mt-5 space-y-2">
            {AGREEMENT_SUMMARY.docs.map((d) => {
              const doc =
                d.key === "agreement"
                  ? USER_AGREEMENT
                  : d.key === "privacy"
                  ? PRIVACY_POLICY
                  : PERSONAL_INFO_LIST;
              return (
                <button
                  key={d.key}
                  onClick={() => openDoc(doc)}
                  className="flex w-full items-center justify-between rounded-lg bg-white/[0.03] px-3 py-3 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText size={16} className="text-keyOp" />
                    <span className="text-[13px] font-medium text-ink">{d.label}</span>
                  </span>
                  <ChevronRight size={16} className="text-inkDim" />
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={handleAgree}
            className={cn(
              "key-press w-full rounded-xl bg-keyOp py-3 text-sm font-semibold text-black transition-colors",
              "hover:bg-keyOpHover"
            )}
          >
            同意并继续
          </button>
          <p className="text-center text-[10px] text-inkDim">
            点击「同意并继续」表示您已阅读并接受上述全部协议
          </p>
        </div>
      </div>

      {/* 文档查看弹层 */}
      <LegalModal open={modalOpen} doc={activeDoc} onClose={closeDoc} />
    </div>
  );
}
