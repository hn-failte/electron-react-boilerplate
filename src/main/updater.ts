import type { AppUpdater, ProgressInfo } from 'electron-updater';
import path from 'path';
import { app, ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import { autoUpdater, CancellationToken } from 'electron-updater';

log.transports.file.fileName = 'update.log';

interface AutoUpdaterOptions {
  autoUpdater: AppUpdater;
  updateUrl: string;
}

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
class AutoUpdater {
  autoUpdater: AppUpdater;

  cancellationToken: CancellationToken | null = null;

  // 服务器静态文件地址，文章后面附上ng配置及需要上传的文件
  updateUrl: string = '';

  message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本',
    updateNotAva: '现在使用的就是最新版本，不用更新',
  };

  constructor(options?: Partial<AutoUpdaterOptions>) {
    if (!options?.autoUpdater) throw new Error('autoUpdater can not be null');
    if (!options?.updateUrl) throw new Error('updateUrl can not be empty');
    this.autoUpdater = options.autoUpdater;
    this.updateUrl = options.updateUrl;

    // 防止报错no such file or directory dev-app-update.yml
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      Object.defineProperty(app, 'isPackaged', {
        get() {
          return true;
        },
      });
      this.autoUpdater.updateConfigPath = path.join(
        __dirname,
        'dev-app-update.yml',
      );
    }

    this.autoUpdater.logger = log;

    // 设置是否自动下载，默认是true,当点击检测到新版本时，会自动下载安装包，所以设置为false
    this.autoUpdater.autoDownload = false;
    this.autoUpdater.autoInstallOnAppQuit = false;

    // 设置服务器更新地址
    this.autoUpdater.setFeedURL({
      provider: 'generic',
      url: this.updateUrl,
    });
    this.autoUpdater.on('error', (err: any) => {
      this.sendUpdateMessage('error', err || this.message.error);
      log.error('出错了', err);
    });
    this.autoUpdater.on('checking-for-update', () => {
      this.sendUpdateMessage('checking-for-update', this.message.checking);
    });
    // 版本检测结束，准备更新
    this.autoUpdater.on('update-available', () => {
      log.info('检测到更新');
      this.sendUpdateMessage('update-available', this.message.updateAva);
    });
    this.autoUpdater.on('update-not-available', () => {
      log.info(this.message.updateNotAva);
      this.sendUpdateMessage('update-not-available', this.message.updateNotAva);
    });
    // 更新下载进度事件
    this.autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
      log.info('下载中...', progressObj.percent);
      this.sendUpdateMessage('download-progress', String(progressObj.percent));
    });

    this.autoUpdater.on('update-cancelled', () => {
      log.info('更新已取消');
      this.sendUpdateMessage('update-cancelled', '更新已取消');
    });

    // 下载完成
    this.autoUpdater.on('update-downloaded', () => {
      log.info('下载完成');
      this.sendUpdateMessage('update-downloaded', '下载完成');
    });

    // 所有窗口关闭时取消下载
    app.on('window-all-closed', () => {
      if (this.cancellationToken) this.cancellationToken.cancel();
    });

    // 触发更新检测
    ipcMain.on('check-for-updates', () => {
      this.autoUpdater.checkForUpdates();
    });

    //  开始下载，通过渲染进程发起
    ipcMain.on('download-update', () => {
      this.cancellationToken = new CancellationToken();
      this.autoUpdater.downloadUpdate(this.cancellationToken);
    });

    // 取消下载
    ipcMain.on('download-cancel', () => {
      if (this.cancellationToken) this.cancellationToken.cancel();
    });

    //  下载完成，退出且重新安装
    ipcMain.on('update-success', () => {
      log.info('退出且重新安装');
      // 加载更新程序
      this.autoUpdater.quitAndInstall(true, true);
    });
  }

  // 通过main进程发送事件给renderer进程，提示更新信息
  sendUpdateMessage(name: string, content: string) {
    // 窗口对象自行修改
    // const currentWindow = BrowserWindow.getFocusedWindow()
    const windowList = BrowserWindow.getAllWindows();
    windowList.forEach((win) => {
      win.webContents.send('update-message', { name, content });
    });

    console.log('====================================');
    console.log('sendUpdateMessage', name, content);
    console.log('====================================');
  }
}

const ins = new AutoUpdater({
  autoUpdater,
  updateUrl: process.env.VUE_APP_PUBLISH,
});

export default ins;
