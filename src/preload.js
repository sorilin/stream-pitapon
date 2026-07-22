const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('obsFrame', {
  getState: () => ipcRenderer.invoke('get-state'),
  chooseFiles: () => ipcRenderer.invoke('choose-files'),
  addDroppedFiles: (files) => ipcRenderer.invoke('add-files', files.map((file) => webUtils.getPathForFile(file))),
  selectItem: (id) => ipcRenderer.invoke('select-item', id),
  removeItem: (id) => ipcRenderer.invoke('remove-item', id),
  reorderItems: (ids) => ipcRenderer.invoke('reorder-items', ids),
  clearDisplay: () => ipcRenderer.invoke('clear-display'),
  advance: (direction) => ipcRenderer.invoke('advance', direction),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  onStateChanged: (callback) => ipcRenderer.on('state-changed', (_event, state) => callback(state))
});
