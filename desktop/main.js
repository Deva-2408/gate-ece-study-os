'use strict';

const { app, BrowserWindow, Menu, dialog, protocol, net, session, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const APP_ORIGIN = 'app://gateos';
const RENDERER_ROOT = path.join(__dirname, 'renderer');

// A standard, secure custom origin keeps localStorage and IndexedDB stable across
// launches (file:// origins are treated as opaque by Chromium).
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

app.setAppUserModelId('com.gateos.study');

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  let mainWindow = null;

  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  function resolveAssetPath(requestUrl) {
    const url = new URL(requestUrl);
    let pathname = decodeURIComponent(url.pathname);
    if (!pathname || pathname === '/') pathname = '/index.html';
    const resolved = path.normalize(path.join(RENDERER_ROOT, pathname));
    const root = RENDERER_ROOT.endsWith(path.sep) ? RENDERER_ROOT : RENDERER_ROOT + path.sep;
    if (resolved !== RENDERER_ROOT && !resolved.startsWith(root)) return null;
    return resolved;
  }

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1320,
      height: 880,
      minWidth: 340,
      minHeight: 480,
      show: false,
      backgroundColor: '#080b12',
      title: 'GATE ECE Study OS',
      icon: path.join(__dirname, 'renderer', 'icon.png'),
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: true,
        devTools: !app.isPackaged
      }
    });

    Menu.setApplicationMenu(null);

    mainWindow.once('ready-to-show', () => mainWindow.show());

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Keep the app inside its own origin. Anything else opens in the default browser.
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(APP_ORIGIN + '/')) {
        event.preventDefault();
        if (/^https?:/i.test(url)) shell.openExternal(url);
      }
    });

    mainWindow.webContents.on('will-attach-webview', (event) => event.preventDefault());

    mainWindow.loadURL(APP_ORIGIN + '/index.html');
  }

  app.whenReady().then(() => {
    protocol.handle('app', (request) => {
      const filePath = resolveAssetPath(request.url);
      if (!filePath) {
        return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
      }
      return net.fetch(pathToFileURL(filePath).toString());
    });

    // Give exports a real "Save as…" dialog instead of silently dropping files.
    session.defaultSession.on('will-download', (event, item, webContents) => {
      const suggested = item.getFilename() || 'gateos-export';
      const savePath = dialog.showSaveDialogSync(webContents, {
        title: 'Save export',
        defaultPath: path.join(app.getPath('downloads'), suggested),
        buttonLabel: 'Save'
      });
      if (!savePath) {
        event.preventDefault();
        item.cancel();
        return;
      }
      item.setSavePath(savePath);
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
