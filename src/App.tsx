import { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import AgreementGate, { isAgreementAccepted } from "@/components/AgreementGate";
import { initTheme } from "@/store/themeStore";

export default function App() {
  // 首次启动时检查是否已同意协议;未同意则阻塞主程序
  const [agreed, setAgreed] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    // 初始化主题(应用持久化偏好 + 监听系统主题变化)
    const cleanup = initTheme();
    setAgreed(isAgreementAccepted());
    setChecked(true);
    return cleanup;
  }, []);

  if (!checked) {
    // 等待 localStorage 检查完成,避免闪烁
    return null;
  }

  if (!agreed) {
    return <AgreementGate onAgree={() => setAgreed(true)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
