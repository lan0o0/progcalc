import { useState } from "react";
import {
  USER_AGREEMENT,
  PRIVACY_POLICY,
  LegalDocument,
} from "@/legal/content";
import LegalModal from "./LegalModal";
import { cn } from "@/lib/utils";

/** localStorage 键名:记录用户是否已同意协议 */
const AGREEMENT_KEY = "progcalc.agreement.accepted";

/** 检查用户是否已同意协议(仅在客户端执行) */
export function isAgreementAccepted(): boolean {
  // 优先读原生 SharedPreferences(确保原生层与前端状态一致)
  try {
    const bridge = window.appNative;
    if (bridge && typeof bridge.isAgreementAccepted === "function") {
      const nativeResult = bridge.isAgreementAccepted();
      console.log("[ProgCalc] isAgreementAccepted: native=" + nativeResult);
      // 以原生为准,不同步 localStorage(避免 localStorage 残留导致状态不一致)
      return nativeResult;
    }
    console.log("[ProgCalc] isAgreementAccepted: native bridge not available, fallback to localStorage");
  } catch (e) {
    console.log("[ProgCalc] isAgreementAccepted: native bridge error, fallback to localStorage: " + e);
  }
  try {
    const lsResult = localStorage.getItem(AGREEMENT_KEY) === "true";
    console.log("[ProgCalc] isAgreementAccepted: localStorage=" + lsResult);
    return lsResult;
  } catch {
    console.log("[ProgCalc] isAgreementAccepted: localStorage not available");
    return false;
  }
}

interface Props {
  /** 用户同意后回调 */
  onAgree: () => void;
}

/**
 * 首次启动协议门:覆盖整屏,展示协议摘要 + 协议入口。
 * 同意后才允许进入主程序;拒绝则退出应用。
 */
export default function AgreementGate({ onAgree }: Props) {
  const [activeDoc, setActiveDoc] = useState<LegalDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [exiting, setExiting] = useState(false);

  const openDoc = (doc: LegalDocument) => {
    setActiveDoc(doc);
    setModalOpen(true);
  };

  const closeDoc = () => setModalOpen(false);

  const handleAgree = () => {
    console.log("[ProgCalc] AgreementGate: user clicked agree");
    // 1. 写 localStorage(浏览器/PWA 环境需要)
    try {
      localStorage.setItem(AGREEMENT_KEY, "true");
    } catch {
      // 写入失败不阻塞使用
    }
    // 2. 通知原生层:用户已同意协议,初始化广告 SDK + 加载浮窗广告
    //    原生层会把同意状态持久化到 SharedPreferences,下次启动直接初始化 SDK + 开屏广告
    try {
      const bridge = window.appNative;
      if (bridge && typeof bridge.onAgreementAccepted === "function") {
        console.log("[ProgCalc] AgreementGate: calling native onAgreementAccepted");
        bridge.onAgreementAccepted();
      } else {
        console.log("[ProgCalc] AgreementGate: native bridge not available");
      }
    } catch (e) {
      console.log("[ProgCalc] AgreementGate: native bridge error: " + e);
    }
    onAgree();
  };

  /** 不同意并退出:优先调用原生退出桥,兜底 window.close() 并提示 */
  const handleDisagree = () => {
    setExiting(true);
    try {
      const bridge = window.appNative;
      if (bridge && typeof bridge.exit === "function") {
        bridge.exit();
        return;
      }
    } catch {
      /* 忽略,走兜底 */
    }
    try {
      window.close();
    } catch {
      /* 忽略 */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-screen"
      style={{
        paddingTop: "var(--safe-top, 0px)",
        paddingBottom: "var(--safe-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-col px-6 py-8">
        {/* 标题 */}
        <div className="mt-2 text-center">
          <h1 className="text-[20px] font-semibold text-ink">欢迎使用本 App</h1>
        </div>

        {/* App 介绍 */}
        <p className="mt-5 px-1 text-center text-[13px] leading-relaxed text-ink/75">
          本 app 专为程序员、计算机学生和嵌入式工程师打造！支持补码自动计算、多进制实时转换、位运算可视化，告别手算二进制，效率翻倍！
        </p>

        {/* 说明 */}
        <p className="mt-6 text-center text-[14px] leading-relaxed text-ink/80">
          为了保障您的权益，请阅读并同意以下协议：
        </p>

        {/* 协议入口 */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => openDoc(USER_AGREEMENT)}
            className="text-[14px] font-medium text-keyOp underline-offset-2 hover:underline"
          >
            《用户协议》
          </button>
          <button
            onClick={() => openDoc(PRIVACY_POLICY)}
            className="text-[14px] font-medium text-keyOp underline-offset-2 hover:underline"
          >
            《隐私政策》
          </button>
        </div>

        {/* 占位,把按钮推到底部 */}
        <div className="flex-1" />

        {/* 退出中提示 */}
        {exiting && (
          <p className="mb-3 text-center text-[12px] text-inkDim">
            您已选择不同意，应用即将退出…
          </p>
        )}

        {/* 底部按钮:两按钮并排 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAgree}
            className={cn(
              "key-press rounded-xl bg-keyOp py-3 text-sm font-semibold text-black transition-colors",
              "hover:bg-keyOpHover"
            )}
          >
            同意并继续
          </button>
          <button
            onClick={handleDisagree}
            className={cn(
              "key-press rounded-xl border border-inkDim/40 bg-transparent py-3 text-sm font-semibold text-ink/80 transition-colors",
              "hover:bg-white/[0.05]"
            )}
          >
            不同意并退出
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-inkDim">
          点击「同意并继续」表示您已阅读并接受上述全部协议
        </p>
      </div>

      {/* 文档查看弹层 */}
      <LegalModal open={modalOpen} doc={activeDoc} onClose={closeDoc} />
    </div>
  );
}
