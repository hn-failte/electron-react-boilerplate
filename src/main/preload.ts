import path from 'path'
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import log from 'electron-log'

const rendererLogger = log.create('renderer')

rendererLogger.variables.from = 'renderer'
rendererLogger.scope.defaultLabel = 'global'

// 已经存在的模块名
const moduleNameList = ['global', 'login', 'live-mask', 'home', 'download', 'update']

// 把日志的一个参数设置为模块名
rendererLogger.hooks.push((message) => {
  if (!message.scope) {
    const scope = message.data.length > 1 ? message.data[0] : ''
    if (moduleNameList.includes(scope)) {
      message.data.shift()
      message.scope = { label: scope }
    }
  }

  return message;
})

const logFileName = process.env.SCREEN_LOG_FILE_NAME!
const logFileDirPath = process.env.SCREEN_LOG_FILE_DIR_PATH!

/**
 * @desc 日志文件位置
 * @example macOS: ~/Library/Logs/{appName}/{appVersion}/{date}.log
 * @example Windows: %USERPROFILE%\AppData\Roaming\{appName}\logs\{appVersion}\{date}.log
 */
const logFilePath = path.resolve(logFileDirPath, logFileName)

rendererLogger.transports.console.level = 'silly' // 控制台展示所有日志
rendererLogger.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}' // 设置控制台日志内容格式

rendererLogger.transports.file.level = isDevelopment ? 'debug' : 'verbose' // 文件日志在开发时记录 debug 级别以上日志，在打包后记录 verbose 级别以上的日志
rendererLogger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{from}]{scope} {text}' // 设置日志内容格式
rendererLogger.transports.file.maxSize = 10 * 1024 * 1024 // 最大不超过10M
rendererLogger.transports.file.fileName = logFileName
rendererLogger.transports.file.resolvePath = () => logFilePath

// rendererLogger.transports.remote.level = 'info' // 远端日志需要 info 级别以上才记录
// rendererLogger.transports.remote.url = ''
// rendererLogger.transports.remote.requestOptions = {}

rendererLogger.catchErrors()

window.$logger = rendererLogger

// 劫持浏览器的控制台输出
Object.assign(console, rendererLogger.functions);

window.$logger.log('global', 'rendererLogger is ready');

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
