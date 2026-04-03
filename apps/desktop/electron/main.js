import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Detect WSL Distribution
let wslDistribution = "Ubuntu-24.04"; // Explicitly set based on user environment
console.log(`Using WSL Distribution: ${wslDistribution}`);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Frameless window
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // win.loadURL("http://localhost:5173");
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    win.loadURL("http://localhost:5173");
  }

  // Dialogs (Register inside scoped to win)
  ipcMain.handle("dialog:selectFolder", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (canceled) return null;
    return filePaths[0];
  });

  ipcMain.handle("dialog:selectFile", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
    });
    if (canceled) return null;
    return filePaths[0];
  });
}

// Window Controls (Global)
ipcMain.on("window-minimize", (_event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});
ipcMain.on("window-maximize", (_event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});
ipcMain.on("window-close", (_event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

function translatePath(p) {
  if (!p || typeof p !== "string") return p;
  if (p.match(/^[a-zA-Z]:\\/)) return p; // Already a Windows absolute path.

  const windowsDesktop = app.getPath("desktop");
  const windowsHome = app.getPath("home");
  const userHomeName = path.basename(app.getPath("home"));
  // Legacy Linux root used when server returns old WSL-style paths.
  const linuxRoot = `/home/${userHomeName}/secondBrain`;
  // Dynamic Windows root for relative paths.
  const windowsLocalRoot = app.getPath("desktop");
  // WSL share fallback for Linux-style absolute paths.
  const baseShare = `\\\\wsl.localhost\\${wslDistribution}`;
  const windowsRoot = `${baseShare}\\home\\${userHomeName}\\secondBrain`;

  // Expand home shortcuts used by models.
  if (p.startsWith("~/")) {
    const translated = path.join(windowsHome, p.slice(2).replace(/\//g, "\\"));
    console.log(`Expanded home shortcut: [${p}] -> [${translated}]`);
    return translated;
  }

  // Normalize mac/linux-style Desktop paths to current Windows Desktop.
  const usersDesktopPrefix = `/Users/${userHomeName}/Desktop/`;
  if (p.startsWith(usersDesktopPrefix)) {
    const rest = p.slice(usersDesktopPrefix.length).replace(/\//g, "\\");
    const translated = path.join(windowsDesktop, rest);
    console.log(`Normalized /Users Desktop path: [${p}] -> [${translated}]`);
    return translated;
  }

  const genericUsersDesktop = p.match(/^\/Users\/[^/]+\/Desktop\/(.+)$/);
  if (genericUsersDesktop) {
    const rest = genericUsersDesktop[1].replace(/\//g, "\\");
    const translated = path.join(windowsDesktop, rest);
    console.log(
      `Normalized generic /Users Desktop path: [${p}] -> [${translated}]`,
    );
    return translated;
  }

  const homeDesktopPrefix = `/home/${userHomeName}/Desktop/`;
  if (p.startsWith(homeDesktopPrefix)) {
    const rest = p.slice(homeDesktopPrefix.length).replace(/\//g, "\\");
    const translated = path.join(windowsDesktop, rest);
    console.log(`Normalized /home Desktop path: [${p}] -> [${translated}]`);
    return translated;
  }

  const genericHomeDesktop = p.match(/^\/home\/[^/]+\/Desktop\/(.+)$/);
  if (genericHomeDesktop) {
    const rest = genericHomeDesktop[1].replace(/\//g, "\\");
    const translated = path.join(windowsDesktop, rest);
    console.log(
      `Normalized generic /home Desktop path: [${p}] -> [${translated}]`,
    );
    return translated;
  }

  // Resolve relative paths from current user's Desktop on Windows.
  if (!p.startsWith("/") && !p.startsWith("\\") && !p.match(/^[a-zA-Z]:/)) {
    p = path.join(windowsLocalRoot, p);
    console.log(`Resolved relative path to: [${p}]`);
    return p;
  }

  if (p.startsWith(linuxRoot)) {
    const translated = p.replace(linuxRoot, windowsRoot).replace(/\//g, "\\");
    console.log(`Path Translation: [${p}] -> [${translated}]`);
    return translated;
  }

  // Handle absolute Linux root if it doesn't match the specific home path
  if (p.startsWith("/")) {
    const translated = `${baseShare}${p.replace(/\//g, "\\")}`;
    console.log(`Fallback Path Translation: [${p}] -> [${translated}]`);
    return translated;
  }

  return p;
}

// Shell Actions
ipcMain.handle("open-path", async (_event, fullPath) => {
  const localPath = translatePath(fullPath);
  console.log("Main process: opening translated path:", localPath);

  if (!fs.existsSync(localPath)) {
    console.error(
      "FS Error: Path does not exist according to fs.existsSync:",
      localPath,
    );
    return "Path does not exist";
  }

  try {
    const stats = fs.statSync(localPath);
    console.log(
      `Path stats: isDirectory=${stats.isDirectory()}, size=${stats.size}`,
    );

    const error = await shell.openPath(localPath);
    if (error) console.error("shell.openPath error:", error);
    return error;
  } catch (err) {
    console.error("IPC open-path exception:", err);
    throw err;
  }
});

ipcMain.handle("show-in-folder", async (_event, fullPath) => {
  const localPath = translatePath(fullPath);
  console.log("Main process: showing translated path in folder:", localPath);

  if (!fs.existsSync(localPath)) {
    console.error(
      "FS Error: Path does not exist according to fs.existsSync:",
      localPath,
    );
    return;
  }

  try {
    shell.showItemInFolder(localPath);
  } catch (err) {
    console.error("IPC show-in-folder exception:", err);
    throw err;
  }
});

app.whenReady().then(createWindow);
