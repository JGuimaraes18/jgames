const { contextBridge, ipcRenderer } = require("electron");

/**
 * API mínima exposta ao renderer. Nada além do necessário para o controle
 * de tela cheia é liberado; objetos completos do Electron não são expostos.
 */
contextBridge.exposeInMainWorld("jgWindow", {
  toggleFullscreen: () => ipcRenderer.invoke("window:toggle-fullscreen"),
  setFullscreen: (value) => ipcRenderer.invoke("window:set-fullscreen", value),
  isFullscreen: () => ipcRenderer.invoke("window:is-fullscreen"),
  onFullscreenChange: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("window:fullscreen-changed", listener);
    return () => ipcRenderer.removeListener("window:fullscreen-changed", listener);
  }
});
