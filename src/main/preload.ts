import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-ready-callback' | 'ipc-ready-sync' | 'ipc-ready-promise' | 'renderer-ready-single' | 'renderer-ready-webview';

const electronHandler = {
  ipcRenderer: {
    ...ipcRenderer,
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    sendToHost(channel: Channels, ...args: unknown[]) {
      ipcRenderer.sendToHost(channel, ...args);
    },
    sendSync(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.sendSync(channel, ...args);
    },
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel: Channels, func: (event: IpcRendererEvent, ...args: unknown[]) => void) {
      return ipcRenderer.on(channel, func);
    },
    once(channel: Channels, func: (event: IpcRendererEvent, ...args: unknown[]) => void) {
      return ipcRenderer.once(channel, func);
    },
    removeListener(channel: Channels, func: (event: IpcRendererEvent, ...args: unknown[]) => void) {
      return ipcRenderer.removeListener(channel, func);
    },
    removeAllListeners(channel: Channels) {
      return ipcRenderer.removeAllListeners(channel);
    },
  },
  crash: process.crash.bind(process)
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;

const appInfo = {
  arch: process.arch,
  chromeVersion: process.versions.chrome,
  nodeVersion: process.versions.node,
  electronVersion: process.versions.electron,
}

contextBridge.exposeInMainWorld('appInfo', appInfo)

export type AppInfo = typeof appInfo;
