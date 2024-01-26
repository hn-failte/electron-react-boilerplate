import type { ElectronHandler, AppInfo } from '../main/preload';

declare global {
  interface Window {
    electron: ElectronHandler;
    appInfo: AppInfo
  }
}

export {};
