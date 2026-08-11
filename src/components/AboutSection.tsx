import { useState } from "react";
import { FileText, ChevronRight, Info } from "lucide-react";
import {
  APP_INFO,
  USER_AGREEMENT,
  PRIVACY_POLICY,
  PERSONAL_INFO_LIST,
  LegalDocument,
} from "@/legal/content";
import LegalModal from "./LegalModal";

/**
 * 设置抽屉中的「关于我们」区块:
 * 展示应用版本信息,并提供用户协议 / 隐私政策 / 个人信息收集清单的查看入口。
 */
export default function AboutSection() {
  const [activeDoc, setActiveDoc] = useState<LegalDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDoc = (doc: LegalDocument) => {
    setActiveDoc(doc);
    setModalOpen(true);
  };

  const items: { label: string; doc: LegalDocument }[] = [
    { label: "用户协议", doc: USER_AGREEMENT },
    { label: "隐私政策", doc: PRIVACY_POLICY },
    { label: "个人信息收集清单", doc: PERSONAL_INFO_LIST },
  ];

  return (
    <div>
      <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-inkDim">
        关于我们
      </div>

      {/* 应用信息卡片 */}
      <div className="rounded-lg bg-white/[0.03] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <Info size={16} className="text-keyOp" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs font-semibold text-ink">
              {APP_INFO.name}
            </div>
            <div className="text-[10px] text-inkDim">
              {APP_INFO.appNameEn} · v{APP_INFO.version}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-inkDim/80">
          离线程序员计算器 · 不联网 · 不收集个人信息
        </p>
      </div>

      {/* 协议入口列表 */}
      <div className="mt-2 space-y-1">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => openDoc(it.doc)}
            className="flex w-full items-center justify-between rounded-lg bg-keyDark px-3 py-2.5 text-left transition-colors hover:bg-keyDarkHover"
          >
            <span className="flex items-center gap-2.5">
              <FileText size={15} className="text-inkDim" />
              <span className="text-[12px] font-medium text-ink">{it.label}</span>
            </span>
            <ChevronRight size={15} className="text-inkDim" />
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-0.5 px-1">
        <p className="text-[10px] leading-relaxed text-inkDim/60">
          开发者:{APP_INFO.developer}
        </p>
        <p className="text-[10px] leading-relaxed text-inkDim/60">
          更新日期:{APP_INFO.updateDate}
        </p>
      </div>

      <LegalModal
        open={modalOpen}
        doc={activeDoc}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
