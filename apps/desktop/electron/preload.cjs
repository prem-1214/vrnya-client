console.log("Preload script is executing (as CJS)...");
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  selectFolder: () => ipcRenderer.invoke("dialog:selectFolder"),
  selectFile: () => ipcRenderer.invoke("dialog:selectFile"),
  openPath: (fullPath) => ipcRenderer.invoke("open-path", fullPath),
  showInFolder: (fullPath) => ipcRenderer.invoke("show-in-folder", fullPath),
});
