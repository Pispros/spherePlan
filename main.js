const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Cacher la barre de titre native
    titleBarStyle: "hidden", // Cacher la barre de titre mais garder les contrôles sur macOS
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // Ajouter preload pour IPC
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false,
    backgroundColor: "#0a0a0a", // Fond noir pour correspondre au design
  });

  // Désactiver le menu de l'application
  Menu.setApplicationMenu(null);

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Gérer les commandes de fenêtre depuis le rendu
  ipcMain.on("window:minimize", () => {
    mainWindow.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on("window:close", () => {
    mainWindow.close();
  });

  // Envoyer l'état de maximisation au rendu
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:maximized", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:maximized", false);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
