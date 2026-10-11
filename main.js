const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

/** @type {BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 480,
    minHeight: 520,
    backgroundColor: "#0f172a",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Evita "flash" branco: só mostra quando o conteúdo está pronto.
  mainWindow.once("ready-to-show", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });

  // Notifica o renderer sobre mudanças de tela cheia (para atualizar o botão).
  const notifyFullscreen = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "window:fullscreen-changed",
        mainWindow.isFullScreen()
      );
    }
  };
  mainWindow.on("enter-full-screen", notifyFullscreen);
  mainWindow.on("leave-full-screen", notifyFullscreen);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadFile("index.html");
}

// ---- IPC de tela cheia (API mínima exposta via preload) ----
function windowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

ipcMain.handle("window:toggle-fullscreen", (event) => {
  const win = windowFromEvent(event);
  if (!win) return false;
  const next = !win.isFullScreen();
  win.setFullScreen(next);
  return next;
});

ipcMain.handle("window:set-fullscreen", (event, value) => {
  const win = windowFromEvent(event);
  if (!win) return false;
  win.setFullScreen(Boolean(value));
  return win.isFullScreen();
});

ipcMain.handle("window:is-fullscreen", (event) => {
  const win = windowFromEvent(event);
  return win ? win.isFullScreen() : false;
});
// -------------------------------------------------------------

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
