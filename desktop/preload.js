// The only bridge between the web page and the desktop app.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("museoneDesktop", {
  // Prints the current page to the default printer without a dialog (receipt printers).
  print: () => ipcRenderer.invoke("print-silent"),
  saveLink: (url) => ipcRenderer.invoke("save-link", url),
});
