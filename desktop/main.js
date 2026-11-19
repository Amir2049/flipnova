// FLIPNOVA for Windows: the same game (build 21) in its own window. F11 = fullscreen.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 640, minHeight: 360, title: 'FLIPNOVA', backgroundColor: '#05060d',
    icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  // links (update page, share) open in the normal browser, never inside the game window
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
});
app.on('window-all-closed', () => app.quit());
