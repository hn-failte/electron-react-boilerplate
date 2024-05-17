import { autoUpdater, CancellationToken } from 'electron-updater';
import { app, ipcMain, BrowserWindow, IpcMainEvent } from 'electron';
import path from 'path';
import mainLogger from './logger';

const updateLogger = mainLogger.scope('update');

// mac日志地址：/Users/Library/Logs/avatar-ai-interactive-screen/update.log
// win日志地址: C:\Users\AppData\Roaming\avatar-ai-interactive-screen\logs\update.log

// mac安装包下载路径：/Users/Library/Application Support/Caches/avatar-ai-interactive-screen-updater/pending
// win安装包下载路径：C:\Users\AppData\Local\avatar-ai-interactive-screen\pending

let cancellationToken: any = null;

// 服务器静态文件地址，文章后面附上ng配置及需要上传的文件
// const updateUrl = process.env.VUE_APP_PUBLISH

// 通过main进程发送事件给renderer进程，提示更新信息
function sendUpdateMessage(name: string, content: any) {
  // 窗口对象自行修改
  // const currentWindow = BrowserWindow.getFocusedWindow()
  const windowList = BrowserWindow.getAllWindows();
  windowList.forEach((win) => {
    win.webContents.send('update-message', { name, content });
  });

  updateLogger.info('====================================');
  updateLogger.info('sendUpdateMessage', name, content);
  updateLogger.info('====================================');
}

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
function updateHandle() {
  const message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本',
    updateNotAva: '现在使用的就是最新版本，不用更新',
  };

  // 防止报错no such file or directory dev-app-update.yml
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    Object.defineProperty(app, 'isPackaged', {
      get() {
        return true;
      },
    });
    autoUpdater.updateConfigPath = path.join(__dirname, 'latest.yml');
  }

  autoUpdater.logger = updateLogger;

  // 设置是否自动下载，默认是true,当点击检测到新版本时，会自动下载安装包，所以设置为false
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('error', function (err: any) {
    sendUpdateMessage('error', err || message.error);
    updateLogger.error('出错了', err);
  });

  autoUpdater.on('checking-for-update', function () {
    sendUpdateMessage('checking-for-update', message.checking);
  });

  // 版本检测结束，准备更新
  autoUpdater.on('update-available', function () {
    updateLogger.info('检测到更新');
    sendUpdateMessage('update-available', message.updateAva);
    // autoUpdater.downloadUpdate()
  });

  autoUpdater.on('update-not-available', function () {
    updateLogger.info(message.updateNotAva);
    sendUpdateMessage('update-not-available', message.updateNotAva);
  });

  // 更新下载进度事件
  autoUpdater.on(
    'download-progress',
    function (progressObj: Record<string, any>) {
      updateLogger.info('下载中...', JSON.stringify(progressObj));
      sendUpdateMessage('download-progress', progressObj);
    },
  );

  autoUpdater.on('update-cancelled', function () {
    updateLogger.info('更新已取消');
    sendUpdateMessage('update-cancelled', '更新已取消');
  });

  // 下载完成
  autoUpdater.on('update-downloaded', function () {
    updateLogger.info('下载完成');
    sendUpdateMessage('update-downloaded', '下载完成');
  });
}

// 所有窗口关闭时取消下载
app.on('window-all-closed', () => {
  if (cancellationToken) cancellationToken.cancel();
});

// 触发更新检测
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

//  开始下载，通过渲染进程发起
ipcMain.on('download-update', () => {
  cancellationToken = new CancellationToken();
  autoUpdater.downloadUpdate(cancellationToken);
});

// 取消下载
ipcMain.on('download-cancel', () => {
  if (cancellationToken) cancellationToken.cancel();
});

//  下载完成，退出且重新安装
ipcMain.on('update-success', () => {
  updateLogger.info('退出且重新安装');
  // 加载更新程序
  autoUpdater.quitAndInstall(true, true);
});

ipcMain.on('set-feedUR', (e: IpcMainEvent, url: string) => {
  // const updateUrl = process.env.VUE_APP_PUBLISH + url
  updateLogger.info(`feedUR: ${url}`);
  // 设置服务器更新地址
  autoUpdater.setFeedURL({
    provider: 'generic',
    url,
  });
});

export default updateHandle;
