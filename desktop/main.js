'use strict';

const { app, BrowserWindow, Menu, protocol, shell } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const util = require('node:util');

const MAIN_LOG = path.join(process.env.TEMP || __dirname, 'FRAME-main.log');
function debugLog() {
  try {
    fs.appendFileSync(MAIN_LOG, new Date().toISOString() + ' ' + util.format.apply(null, arguments) + '\n', 'utf8');
  } catch {
    // Diagnostics must never prevent the game from launching.
  }
}
process.on('uncaughtException', (error) => debugLog('UNCAUGHT', error && error.stack ? error.stack : error));
process.on('unhandledRejection', (reason) => debugLog('UNHANDLED', reason && reason.stack ? reason.stack : reason));
debugLog('main-start', __dirname);

// A stable custom origin keeps localStorage/saves intact across app updates.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'frame',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      codeCache: true
    }
  }
]);

const APP_ID = 'com.frame.camera-simulator';
const APP_TITLE = 'FRAME · 相机公司模拟器';
const gotSingleInstanceLock = app.requestSingleInstanceLock();
debugLog('single-instance-lock', gotSingleInstanceLock);

if (!gotSingleInstanceLock) {
  debugLog('quitting: no single instance lock');
  app.quit();
} else {
  app.setName('FRAME Camera Simulator');
  app.setAppUserModelId(APP_ID);
  app.setPath('userData', path.join(app.getPath('appData'), 'FRAME-Camera-Simulator'));

  let mainWindow = null;
  let quitting = false;

  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };

  function registerLocalProtocol() {
    protocol.handle('frame', async (request) => {
      try {
        const url = new URL(request.url);
        let relative = decodeURIComponent(url.pathname);
        if (!relative || relative === '/') relative = '/index.html';
        relative = relative.replace(/^[/\\]+/, '');
        const root = path.resolve(__dirname);
        const filePath = path.resolve(root, relative);
        const fromRoot = path.relative(root, filePath);
        if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) {
          return new Response('Forbidden', { status: 403 });
        }
        const data = await fsp.readFile(filePath);
        const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        return new Response(data, {
          status: 200,
          headers: {
            'content-type': type,
            'cache-control': 'no-store'
          }
        });
      } catch (error) {
        return new Response('Not found', { status: 404 });
      }
    });
  }

  function statePath() {
    return path.join(app.getPath('userData'), 'window-state.json');
  }

  function loadWindowState() {
    try {
      const raw = fs.readFileSync(statePath(), 'utf8');
      const state = JSON.parse(raw);
      if (!state || typeof state !== 'object') return {};
      const out = {};
      if (Number.isFinite(state.width) && state.width >= 900) out.width = Math.min(3200, Math.round(state.width));
      if (Number.isFinite(state.height) && state.height >= 650) out.height = Math.min(2200, Math.round(state.height));
      if (state.maximized === true) out.maximized = true;
      return out;
    } catch {
      return {};
    }
  }

  function saveWindowState() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      const bounds = mainWindow.getNormalBounds();
      fs.writeFileSync(statePath(), JSON.stringify({
        width: bounds.width,
        height: bounds.height,
        maximized: mainWindow.isMaximized()
      }, null, 2), 'utf8');
    } catch {
      // 存档与窗口状态写入失败不应该影响游戏本身。
    }
  }

  function createWindow() {
    const state = loadWindowState();
    mainWindow = new BrowserWindow({
      width: state.width || 1600,
      height: state.height || 1000,
      minWidth: 1024,
      minHeight: 680,
      center: true,
      show: false,
      backgroundColor: '#0b0d0b',
      autoHideMenuBar: true,
      title: APP_TITLE,
      icon: path.join(__dirname, 'assets', 'icon.ico'),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
        backgroundThrottling: false
      }
    });

    Menu.setApplicationMenu(null);
    mainWindow.setMenuBarVisibility(false);
    if (state.maximized) mainWindow.maximize();

    mainWindow.once('ready-to-show', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.show();
      mainWindow.focus();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!String(url).startsWith('frame://')) event.preventDefault();
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;
      if (input.key === 'F11') {
        event.preventDefault();
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    });

    mainWindow.webContents.on('did-fail-load', (event, code, description, url) => {
      debugLog('did-fail-load', code, description, url);
    });
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      debugLog('render-process-gone', JSON.stringify(details));
    });
    mainWindow.webContents.on('console-message', (event, level, message) => {
      if (level >= 2) debugLog('renderer-console', level, message);
    });

    mainWindow.on('close', saveWindowState);
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    mainWindow.loadURL('frame://app/index.html');
  }

  app.whenReady().then(() => {
    debugLog('app-ready', app.getPath('userData'));
    registerLocalProtocol();
    debugLog('protocol-registered');
    app.setAboutPanelOptions({
      applicationName: 'FRAME · 相机公司模拟器',
      applicationVersion: '1.0.0',
      version: '1.0.0',
      copyright: '个人自用影像产业模拟沙盒'
    });
    createWindow();
    debugLog('window-created');

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.on('before-quit', () => {
    quitting = true;
    saveWindowState();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
