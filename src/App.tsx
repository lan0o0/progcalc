import { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import AgreementGate, { isAgreementAccepted } from "@/components/AgreementGate";

export default function App() {
  // 首次启动时检查是否已同意协议;未同意则阻塞主程序
  const [agreed, setAgreed] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    setAgreed(isAgreementAccepted());
    setChecked(true);
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
