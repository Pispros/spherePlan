const { contextBridge, ipcRenderer } = require("electron");

// Exposer une API sécurisée pour contrôler la fenêtre
contextBridge.exposeInMainWorld("electronAPI", {
  // Contrôles de fenêtre
  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  maximizeWindow: () => ipcRenderer.send("window:maximize"),
  closeWindow: () => ipcRenderer.send("window:close"),

  // Écouter les changements d'état de la fenêtre
  onWindowMaximized: (callback) => {
    ipcRenderer.on("window:maximized", (event, isMaximized) => {
      callback(isMaximized);
    });
  },

  // Informations sur la plateforme
  platform: process.platform,
  isWindows: process.platform === "win32",
  isMac: process.platform === "darwin",
  isLinux: process.platform === "linux",
});
