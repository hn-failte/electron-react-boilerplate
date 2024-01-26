import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

window.electron.ipcRenderer.on('ipc-ready-callback', (arg) => {
  console.log('4 > renderer:', arg);
});

window.electron.ipcRenderer.sendMessage(
  'ipc-ready-callback',
  '1 > renderer is ready from callback!',
);

const ipcReadySyncMessage = window.electron.ipcRenderer.sendSync(
  'ipc-ready-sync',
  '1 > renderer is ready from sync!',
);
console.log('4 > renderer:', ipcReadySyncMessage);

window.electron.ipcRenderer
  .invoke('ipc-ready-promise', '1 > renderer is ready from promise!')
  .then((arg) => {
    console.log('4 > renderer:', arg);
  });

window.electron.ipcRenderer.once('renderer-ready-single', (arg) => {
  console.log('renderer:', arg);
});

window.electron.ipcRenderer.on('renderer-ready-webview', (arg) => {
  console.log('2 > renderer:', arg);
});

window.electron.ipcRenderer.sendToHost(
  'renderer-ready-webview',
  '1 > renderer is ready from sendToHost!',
);
