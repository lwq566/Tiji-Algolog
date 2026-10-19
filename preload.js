'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('algolog', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  exportData: (data) => ipcRenderer.invoke('data:export', data),
  importData: () => ipcRenderer.invoke('data:import'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  revealData: () => ipcRenderer.invoke('app:revealData'),
  getInfo: () => ipcRenderer.invoke('app:info'),
});
