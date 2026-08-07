/// <reference types="vite/client" />

interface AppNativeBridge {
  exit: () => void;
}

interface Window {
  appNative?: AppNativeBridge;
}
