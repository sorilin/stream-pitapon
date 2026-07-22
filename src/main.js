const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.avif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv']);
const DEFAULT_STATE = {
  items: [], currentId: null, width: 1920, height: 1080,
  imageDuration: 8, autoAdvance: false, loopPlaylist: true,
  muted: false, volume: 1, transitionMs: 250
};

let mainWindow;
let server;
let port;
let state = { ...DEFAULT_STATE };
const eventClients = new Set();

function statePath() { return path.join(app.getPath('userData'), 'state.json'); }
function mediaDir() { return path.join(app.getPath('userData'), 'media'); }

function loadState() {
  try {
    const saved = JSON.parse(fs.readFileSync(statePath(), 'utf8'));
    state = { ...DEFAULT_STATE, ...saved };
    state.items = state.items.filter((item) => fs.existsSync(path.join(mediaDir(), item.fileName)));
    if (!state.items.some((item) => item.id === state.currentId)) state.currentId = null;
  } catch { state = { ...DEFAULT_STATE }; }
}

function saveState() {
  fs.mkdirSync(path.dirname(statePath()), { recursive: true });
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2));
}

function publicState() {
  return { ...state, displayUrl: `http://127.0.0.1:${port}/player` };
}

function broadcast() {
  const payload = `data: ${JSON.stringify(publicState())}\n\n`;
  for (const response of eventClients) response.write(payload);
  mainWindow?.webContents.send('state-changed', publicState());
}

function updateState(patch) {
  state = { ...state, ...patch };
  saveState();
  broadcast();
  return publicState();
}

function mediaType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  return null;
}

function uniqueTarget(source) {
  const extension = path.extname(source).toLowerCase();
  return `${crypto.randomUUID()}${extension}`;
}

function addFiles(filePaths) {
  fs.mkdirSync(mediaDir(), { recursive: true });
  const added = [];
  for (const source of filePaths) {
    const type = mediaType(source);
    if (!type || !fs.statSync(source).isFile()) continue;
    const fileName = uniqueTarget(source);
    fs.copyFileSync(source, path.join(mediaDir(), fileName));
    added.push({ id: crypto.randomUUID(), name: path.basename(source), fileName, type });
  }
  if (added.length) {
    state.items.push(...added);
    state.currentId = added.at(-1).id;
    saveState();
    broadcast();
  }
  return publicState();
}

function contentType(fileName) {
  const types = { '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.bmp':'image/bmp','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.m4v':'video/x-m4v','.ogv':'video/ogg' };
  return types[path.extname(fileName).toLowerCase()] || 'application/octet-stream';
}

function serveMedia(req, res, fileName) {
  const safeName = path.basename(fileName);
  const filePath = path.join(mediaDir(), safeName);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return; }
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  const headers = { 'Content-Type': contentType(safeName), 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
  if (range) {
    const [startText, endText] = range.replace(/bytes=/, '').split('-');
    const start = Number(startText);
    const end = endText ? Number(endText) : stat.size - 1;
    if (!Number.isFinite(start) || start > end || end >= stat.size) { res.writeHead(416); res.end(); return; }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': stat.size });
    fs.createReadStream(filePath).pipe(res);
  }
}

function startServer() {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/player' || url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      fs.createReadStream(path.join(__dirname, 'player.html')).pipe(res);
    } else if (url.pathname === '/player.css') {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' });
      fs.createReadStream(path.join(__dirname, 'player.css')).pipe(res);
    } else if (url.pathname === '/player.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      fs.createReadStream(path.join(__dirname, 'player.js')).pipe(res);
    } else if (url.pathname === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
      res.write(`data: ${JSON.stringify(publicState())}\n\n`);
      eventClients.add(res);
      req.on('close', () => eventClients.delete(res));
    } else if (url.pathname === '/advance' && req.method === 'POST') {
      if (state.items.length && state.autoAdvance) {
        let index = state.items.findIndex((item) => item.id === state.currentId) + 1;
        if (index >= state.items.length) index = state.loopPlaylist ? 0 : state.items.length - 1;
        if (state.items[index]?.id !== state.currentId) updateState({ currentId: state.items[index].id });
      }
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); res.end();
    } else if (url.pathname.startsWith('/media/')) {
      serveMedia(req, res, decodeURIComponent(url.pathname.slice(7)));
    } else { res.writeHead(404); res.end(); }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { port = server.address().port; resolve(); });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100, height: 760, minWidth: 820, minHeight: 600,
    backgroundColor: '#111318',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

ipcMain.handle('get-state', () => publicState());
ipcMain.handle('choose-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile', 'multiSelections'], filters: [{ name: '画像・動画', extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].map((x) => x.slice(1)) }] });
  return result.canceled ? publicState() : addFiles(result.filePaths);
});
ipcMain.handle('add-files', (_event, paths) => addFiles(paths));
ipcMain.handle('select-item', (_event, id) => updateState({ currentId: id }));
ipcMain.handle('update-settings', (_event, settings) => updateState(settings));
ipcMain.handle('reorder-items', (_event, ids) => {
  const lookup = new Map(state.items.map((item) => [item.id, item]));
  state.items = ids.map((id) => lookup.get(id)).filter(Boolean);
  return updateState({ items: state.items });
});
ipcMain.handle('remove-item', (_event, id) => {
  const item = state.items.find((entry) => entry.id === id);
  if (item) { try { fs.unlinkSync(path.join(mediaDir(), item.fileName)); } catch {} }
  state.items = state.items.filter((entry) => entry.id !== id);
  if (state.currentId === id) state.currentId = state.items[0]?.id || null;
  return updateState({ items: state.items, currentId: state.currentId });
});
ipcMain.handle('clear-display', () => updateState({ currentId: null }));
ipcMain.handle('advance', (_event, direction = 1) => {
  if (!state.items.length) return publicState();
  let index = state.items.findIndex((item) => item.id === state.currentId);
  index = index < 0 ? 0 : index + direction;
  if (state.loopPlaylist) index = (index + state.items.length) % state.items.length;
  else index = Math.max(0, Math.min(state.items.length - 1, index));
  return updateState({ currentId: state.items[index].id });
});

app.whenReady().then(async () => { loadState(); await startServer(); createWindow(); });
app.on('window-all-closed', () => { server?.close(); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
