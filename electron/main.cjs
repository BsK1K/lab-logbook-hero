// Electron main process — wraps the deployed Lovable app in a desktop window.
// CommonJS (.cjs) because package.json sets "type": "module".
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

// URL estável da Lovable — não muda mesmo se o projeto for renomeado.
// Para apontar para a versão de preview, use o sufixo -dev:
//   https://project--fdefe534-3ab4-4c8c-97c0-483caea668e1-dev.lovable.app
const APP_URL =
  process.env.APP_URL ||
  "https://project--fdefe534-3ab4-4c8c-97c0-483caea668e1.lovable.app";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 600,
    title: "Sala de Informática",
    autoHideMenuBar: true,
    backgroundColor: "#fafbfd",
    icon: path.join(__dirname, "..", "public", "icon-512.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(APP_URL);

  // Abrir links externos (http(s)) no navegador padrão em vez de dentro do app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
}

// Menu mínimo (File → Quit, View → Reload/Zoom/DevTools).
function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "Arquivo",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Visualizar",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
