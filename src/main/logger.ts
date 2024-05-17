import { app } from 'electron';
import logger from 'electron-log/main';

const path = require('path');

const useLogger = (isDevelopment: boolean) => {
  logger.initialize();
  /**
   * @desc app 启动时的时间
   * @example 若 app 在前一天打开，一直运行到第二天，第二天的日志将存储在前一天
   */
  const appRunDate = new Date();
  /**
   * @desc 日志文件名
   * @example {date}.log
   */
  const logFileName = `${appRunDate.getFullYear()}-${appRunDate.getMonth() + 1}-${appRunDate.getDate()}.log`;

  /**
   * @desc 日志文件位置
   * @example macOS: ~/Library/Logs/{appName}/{appVersion}/{date}.log
   * @example Windows: %USERPROFILE%\AppData\Roaming\{appName}\logs\{appVersion}\{date}.log
   */
  const logFilePath: string = path.resolve(
    app.getPath('logs'),
    app.getVersion(),
    logFileName,
  );

  logger.transports.console.format =
    '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'; // 设置日志内容格式

  logger.transports.file.level = isDevelopment ? 'silly' : 'verbose'; // 配置 silly 时表示所有日志都写入文件
  logger.transports.file.maxSize = 10 * 1024 * 1024; // 最大不超过10M
  logger.transports.file.fileName = logFileName;
  logger.transports.file.resolvePath = () => logFilePath;

  logger.verbose('Logger is ready');
};

export default useLogger;
