'use strict';

// When this file is started by an environment that sets ELECTRON_RUN_AS_NODE,
// Electron behaves like plain Node and never creates a window. Relaunch the
// real app once with that variable removed. This keeps double-click launches
// working even when they inherit a developer/automation environment.
if (process.env.ELECTRON_RUN_AS_NODE) {
  const { spawn } = require('node:child_process');
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const args = process.argv.slice(1);
  if (!args.includes('--no-sandbox')) args.push('--no-sandbox');
  try {
    spawn(process.execPath, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env,
    }).unref();
  } catch (error) {
    console.error(error);
  }
  process.exit(0);
}

const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');

const APP_NAME = 'AlgoLog';
app.setName(APP_NAME);
app.setAppUserModelId('com.algolog.desktop');

function prepareUserDataDirectory(candidate) {
  try {
    fs.mkdirSync(candidate, { recursive: true });
    fs.accessSync(candidate, fs.constants.W_OK);
    return candidate;
  } catch (error) {
    console.error(`Cannot use data directory ${candidate}:`, error);
    const fallback = path.join(os.tmpdir(), 'AlgoLog-data');
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

// Packaged builds are portable: data lives in ./data next to the exe.
// Source runs use a workspace-local .dev-data folder. This avoids writing to
// AppData, which can be blocked in restricted or portable environments.
const EXE_DIR = path.dirname(app.getPath('exe'));
const DEFAULT_USER_DATA = app.isPackaged
  ? path.join(EXE_DIR, 'data')
  : path.join(__dirname, '.dev-data');
const USER_DATA = prepareUserDataDirectory(
  process.env.ALGOLOG_USER_DATA
    ? path.resolve(process.env.ALGOLOG_USER_DATA)
    : DEFAULT_USER_DATA,
);
app.setPath('userData', USER_DATA);

process.on('uncaughtException', (error) => {
  console.error(error);
});
process.on('unhandledRejection', (error) => {
  console.error(error);
});

const DATA_FILE = path.join(USER_DATA, 'data.json');
const BACKUP_DIR = path.join(USER_DATA, 'backups');
const EMPTY_DATA = { version: 1, sites: [], records: [] };
const MAX_IMPORT_BYTES = 30 * 1024 * 1024;
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

let mainWindow = null;

function cleanText(value, max = 300) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function normalizeIso(value) {
  if (typeof value !== 'string') return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeUrl(value) {
  const raw = cleanText(value, 500);
  if (!raw) return '';
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

function normalizeColor(value) {
  return typeof value === 'string' && COLOR_RE.test(value) ? value : '#1F7A5C';
}

/**
 * Accepts a backup object and returns a clean, safe data object.
 * Invalid rows are skipped and counted so the UI can report the result.
 */
function normalizeData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('备份文件格式不正确，应为题迹导出的 JSON 文件。');
  }
  if (!Array.isArray(raw.sites) || !Array.isArray(raw.records)) {
    throw new Error('备份文件缺少 sites 或 records 数据，无法导入。');
  }

  const sites = [];
  const siteIds = new Set();
  let droppedSites = 0;

  for (const item of raw.sites.slice(0, 5000)) {
    if (!item || typeof item !== 'object') {
      droppedSites += 1;
      continue;
    }
    const name = cleanText(item.name, 60);
    if (!name) {
      droppedSites += 1;
      continue;
    }
    let id = validId(item.id) ? item.id : makeId('site');
    while (siteIds.has(id)) id = makeId('site');
    siteIds.add(id);
    sites.push({
      id,
      name,
      url: normalizeUrl(item.url),
      color: normalizeColor(item.color),
      createdAt: normalizeIso(item.createdAt),
    });
  }

  const records = [];
  const recordIds = new Set();
  let droppedRecords = 0;

  for (const item of raw.records.slice(0, 200000)) {
    if (!item || typeof item !== 'object') {
      droppedRecords += 1;
      continue;
    }
    const siteId = cleanText(item.siteId, 80);
    const date = cleanText(item.date, 10);
    const problemTitle = cleanText(item.problemTitle ?? item.title, 200);
    const problemNumber = cleanText(item.problemNumber ?? item.number, 80);
    if (!siteIds.has(siteId) || !isValidDateKey(date) || !problemTitle || !problemNumber) {
      droppedRecords += 1;
      continue;
    }
    let id = validId(item.id) ? item.id : makeId('record');
    while (recordIds.has(id)) id = makeId('record');
    recordIds.add(id);

    const tags = Array.isArray(item.tags)
      ? [...new Set(item.tags.map((tag) => cleanText(tag, 24)).filter(Boolean))].slice(0, 12)
      : [];

    records.push({
      id,
      date,
      siteId,
      problemNumber,
      problemTitle,
      difficulty: cleanText(item.difficulty, 40),
      tags,
      createdAt: normalizeIso(item.createdAt),
      updatedAt: normalizeIso(item.updatedAt ?? item.createdAt),
    });
  }

  return {
    data: { version: 1, sites, records },
    summary: {
      sites: sites.length,
      records: records.length,
      droppedSites,
      droppedRecords,
    },
  };
}

async function pathExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonAtomic(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await fsp.writeFile(tempPath, json, 'utf8');
  try {
    await fsp.rename(tempPath, filePath);
  } catch (error) {
    // Windows can refuse a rename over an existing file in rare cases.
    if (error && (error.code === 'EPERM' || error.code === 'EEXIST')) {
      await fsp.copyFile(tempPath, filePath);
      await fsp.unlink(tempPath).catch(() => {});
    } else {
      await fsp.unlink(tempPath).catch(() => {});
      throw error;
    }
  }
}

async function pruneBackups() {
  try {
    const entries = await fsp.readdir(BACKUP_DIR, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const fullPath = path.join(BACKUP_DIR, entry.name);
      const stat = await fsp.stat(fullPath);
      files.push({ path: fullPath, time: stat.mtimeMs });
    }
    files.sort((a, b) => b.time - a.time);
    await Promise.all(files.slice(40).map((file) => fsp.unlink(file.path).catch(() => {})));
  } catch {
    // Backups are best-effort; never block a save because cleanup failed.
  }
}

async function ensureDailyBackup() {
  if (!(await pathExists(DATA_FILE))) return;
  try {
    await fsp.mkdir(BACKUP_DIR, { recursive: true });
    const today = new Date();
    const key = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    const target = path.join(BACKUP_DIR, `auto-${key}.json`);
    if (!(await pathExists(target))) {
      await fsp.copyFile(DATA_FILE, target);
      await pruneBackups();
    }
  } catch (error) {
    console.warn('Daily backup failed:', error);
  }
}

async function readData() {
  await fsp.mkdir(USER_DATA, { recursive: true });

  if (!(await pathExists(DATA_FILE))) {
    await writeJsonAtomic(DATA_FILE, EMPTY_DATA);
    return { data: EMPTY_DATA, warning: null };
  }

  let raw;
  try {
    const text = await fsp.readFile(DATA_FILE, 'utf8');
    raw = JSON.parse(text);
  } catch (error) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const corruptPath = path.join(BACKUP_DIR, `corrupt-${stamp}.json`);
    await fsp.mkdir(BACKUP_DIR, { recursive: true });
    await fsp.copyFile(DATA_FILE, corruptPath).catch(() => {});
    await writeJsonAtomic(DATA_FILE, EMPTY_DATA);
    return {
      data: EMPTY_DATA,
      warning: `本地数据文件无法读取，已备份为 ${path.basename(corruptPath)}，并创建了空白数据。`,
    };
  }

  try {
    const normalized = normalizeData(raw);
    let warning = null;
    if (normalized.summary.droppedSites || normalized.summary.droppedRecords) {
      warning = `读取时跳过了 ${normalized.summary.droppedSites} 个题站和 ${normalized.summary.droppedRecords} 条不完整记录。`;
    }
    return { data: normalized.data, warning };
  } catch (error) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const corruptPath = path.join(BACKUP_DIR, `invalid-${stamp}.json`);
    await fsp.mkdir(BACKUP_DIR, { recursive: true });
    await fsp.copyFile(DATA_FILE, corruptPath).catch(() => {});
    await writeJsonAtomic(DATA_FILE, EMPTY_DATA);
    return {
      data: EMPTY_DATA,
      warning: `${error.message} 原文件已备份为 ${path.basename(corruptPath)}。`,
    };
  }
}

function validateSavePayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('保存的数据格式不正确。');
  }
  if (!Array.isArray(data.sites) || !Array.isArray(data.records)) {
    throw new Error('保存的数据缺少 sites 或 records。');
  }
  if (data.sites.length > 5000 || data.records.length > 200000) {
    throw new Error('数据量超出应用支持的范围。');
  }
  const json = JSON.stringify(data);
  if (Buffer.byteLength(json, 'utf8') > MAX_IMPORT_BYTES) {
    throw new Error('数据文件超过 30 MB，无法保存。');
  }
}

async function saveData(data) {
  validateSavePayload(data);
  await ensureDailyBackup();
  await writeJsonAtomic(DATA_FILE, data);
  return { ok: true, savedAt: new Date().toISOString() };
}

function safeDefaultFileName(prefix) {
  const now = new Date();
  const key = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return `${prefix}-${key}.json`;
}

function getWindow() {
  return BrowserWindow.getFocusedWindow() || mainWindow;
}

function registerIpc() {
  ipcMain.handle('data:load', async () => {
    try {
      return await readData();
    } catch (error) {
      console.error('Load failed:', error);
      return { data: EMPTY_DATA, warning: `读取本地数据失败：${error.message}` };
    }
  });

  ipcMain.handle('data:save', async (_event, data) => {
    try {
      return await saveData(data);
    } catch (error) {
      console.error('Save failed:', error);
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('data:export', async (_event, data) => {
    try {
      validateSavePayload(data);
      const result = await dialog.showSaveDialog(getWindow(), {
        title: '导出题迹备份',
        defaultPath: path.join(app.getPath('documents'), safeDefaultFileName('题迹备份')),
        filters: [{ name: 'JSON 数据文件', extensions: ['json'] }],
        properties: ['showOverwriteConfirmation'],
      });
      if (result.canceled || !result.filePath) return { canceled: true };
      await writeJsonAtomic(result.filePath, data);
      return { canceled: false, path: result.filePath };
    } catch (error) {
      return { canceled: false, error: error.message };
    }
  });

  ipcMain.handle('data:import', async () => {
    try {
      const result = await dialog.showOpenDialog(getWindow(), {
        title: '导入题迹备份',
        filters: [{ name: 'JSON 数据文件', extensions: ['json'] }],
        properties: ['openFile'],
      });
      if (result.canceled || !result.filePaths?.[0]) return { canceled: true };

      const filePath = result.filePaths[0];
      const stat = await fsp.stat(filePath);
      if (stat.size > MAX_IMPORT_BYTES) {
        return { canceled: false, error: '备份文件超过 30 MB，无法导入。' };
      }
      const text = await fsp.readFile(filePath, 'utf8');
      const parsed = JSON.parse(text);
      const normalized = normalizeData(parsed);

      // Keep a snapshot of the current data before replacing it.
      if (await pathExists(DATA_FILE)) {
        await fsp.mkdir(BACKUP_DIR, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fsp.copyFile(DATA_FILE, path.join(BACKUP_DIR, `before-import-${stamp}.json`));
      }
      await writeJsonAtomic(DATA_FILE, normalized.data);
      return {
        canceled: false,
        data: normalized.data,
        summary: normalized.summary,
        path: filePath,
      };
    } catch (error) {
      return { canceled: false, error: `导入失败：${error.message}` };
    }
  });

  ipcMain.handle('app:openExternal', async (_event, url) => {
    try {
      const candidate = normalizeUrl(url);
      if (!candidate) return { ok: false, error: '网址格式不正确。' };
      await shell.openExternal(candidate);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('app:revealData', async () => {
    try {
      await fsp.mkdir(USER_DATA, { recursive: true });
      if (await pathExists(DATA_FILE)) shell.showItemInFolder(DATA_FILE);
      else await shell.openPath(USER_DATA);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('app:info', async () => ({
    version: app.getVersion(),
    dataPath: DATA_FILE,
    dataDir: USER_DATA,
    backupDir: BACKUP_DIR,
    platform: process.platform,
    packaged: app.isPackaged,
  }));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 940,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    backgroundColor: '#f4f6f1',
    title: '题迹 AlgoLog',
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const candidate = normalizeUrl(url);
    if (candidate) shell.openExternal(candidate);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    registerIpc();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
