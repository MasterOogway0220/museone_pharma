// MuseOne Pharma desktop: a locked-down window around one pharmacy's billing link.
// Billing, offline storage and sync all live in the web app; this adds silent receipt
// printing, start-on-boot and a dedicated window.
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

if (require("electron-squirrel-startup")) app.quit(); // Windows installer events

// Smoke runs use a throwaway profile so they never touch the real config.
if (process.argv.includes("--smoke")) app.setPath("userData", path.join(require("node:os").tmpdir(), "museone-smoke"));

const configFile = () => path.join(app.getPath("userData"), "config.json");
const readConfig = () => {
  try {
    return JSON.parse(fs.readFileSync(configFile(), "utf8"));
  } catch {
    return {};
  }
};
const writeConfig = (c) => fs.writeFileSync(configFile(), JSON.stringify(c, null, 2));

// Only https links to a pharmacy page (/t/<slug>) are accepted; http only for local testing.
function parseLink(raw) {
  try {
    const u = new URL(raw);
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (u.protocol !== "https:" && !(local && u.protocol === "http:")) return null;
    const m = u.pathname.match(/^\/t\/([a-z0-9-]+)/);
    return m ? `${u.origin}/t/${m[1]}` : null;
  } catch {
    return null;
  }
}

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1366,
    height: 800,
    show: false,
    title: "MuseOne Pharma",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.maximize();
  win.once("ready-to-show", () => win.show());

  // Stay on the pharmacy's own site; anything else opens in the normal browser.
  const allowed = () => {
    const link = readConfig().link;
    return link ? new URL(link).origin : null;
  };
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    const origin = allowed();
    if (url.startsWith("file:") || (origin && new URL(url).origin === origin)) return;
    e.preventDefault();
    if (url.startsWith("https://")) shell.openExternal(url);
  });

  openHome();
}

function openHome() {
  const { link } = readConfig();
  if (link) win.loadURL(link);
  else win.loadFile(path.join(__dirname, "setup.html"));
}

function buildMenu() {
  const { openAtLogin } = app.getLoginItemSettings();
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "MuseOne",
        submenu: [
          { label: "Go to billing", accelerator: "CmdOrCtrl+H", click: openHome },
          { role: "reload" },
          {
            label: "Start when Windows starts",
            type: "checkbox",
            checked: openAtLogin,
            click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
          },
          {
            label: "Change pharmacy link",
            click: () => {
              writeConfig({ ...readConfig(), link: undefined });
              openHome();
            },
          },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      { role: "editMenu" },
      { label: "View", submenu: [{ role: "zoomIn" }, { role: "zoomOut" }, { role: "resetZoom" }, { role: "togglefullscreen" }] },
    ]),
  );
}

ipcMain.handle("save-link", (_e, raw) => {
  const link = parseLink(String(raw));
  if (!link) return "That doesn't look like a MuseOne billing link (https://.../t/your-pharmacy).";
  writeConfig({ ...readConfig(), link });
  openHome();
  return null;
});

ipcMain.handle("print-silent", (e) => {
  // Only the pharmacy site may print.
  const origin = readConfig().link && new URL(readConfig().link).origin;
  if (!origin || new URL(e.senderFrame.url).origin !== origin) return false;
  return new Promise((resolve) =>
    e.sender.print({ silent: true, printBackground: false, margins: { marginType: "none" } }, (ok) => resolve(ok)),
  );
});

if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.whenReady().then(() => {
  // `npm run smoke -- <link>`: open the link, report the page title, quit. Used to check a build.
  const smoke = process.argv.includes("--smoke");
  if (smoke) {
    const link = parseLink(process.argv[process.argv.length - 1]);
    if (link) writeConfig({ ...readConfig(), link });
  }
  buildMenu();
  createWindow();
  if (smoke) {
    win.webContents.once("did-finish-load", () => {
      console.log(`SMOKE OK title="${win.webContents.getTitle()}" url=${win.webContents.getURL()}`);
      app.quit();
    });
    win.webContents.once("did-fail-load", (_e, code, desc) => {
      console.log(`SMOKE FAIL ${code} ${desc}`);
      app.exit(1);
    });
  }
});

app.on("window-all-closed", () => app.quit());

module.exports = { parseLink };
