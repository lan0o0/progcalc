import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.progcalc.app',
  appName: '程序员计算器',
  webDir: 'dist',
  android: {
    // 允许 http 资源(本应用全部为本地资源,无需 https)
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
