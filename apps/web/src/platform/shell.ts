function getElectronAPI(): ElectronAPI | undefined {
  if (typeof window === "undefined") return undefined;
  return window.electronAPI;
}

export function isDesktopShell(): boolean {
  return Boolean(getElectronAPI());
}

export function canUseWindowControls(): boolean {
  return isDesktopShell();
}

export function canPickFolderPath(): boolean {
  return typeof getElectronAPI()?.selectFolder === "function";
}

export function canPickFilePath(): boolean {
  return typeof getElectronAPI()?.selectFile === "function";
}

export async function pickFolderPath(): Promise<string | null> {
  const electronAPI = getElectronAPI();
  if (!electronAPI?.selectFolder) return null;
  return electronAPI.selectFolder();
}

export async function pickFilePath(): Promise<string | null> {
  const electronAPI = getElectronAPI();
  if (!electronAPI?.selectFile) return null;
  return electronAPI.selectFile();
}

export async function openPathInShell(path: string): Promise<string | null> {
  const electronAPI = getElectronAPI();
  if (!electronAPI?.openPath) {
    return "Opening local system paths is only available in the desktop app.";
  }
  return electronAPI.openPath(path);
}

export async function showPathInFolder(path: string): Promise<string | null> {
  const electronAPI = getElectronAPI();
  if (!electronAPI?.showInFolder) {
    return "Showing local files in their folder is only available in the desktop app.";
  }

  try {
    await electronAPI.showInFolder(path);
    return null;
  } catch (error: unknown) {
    return error instanceof Error
      ? error.message
      : "Failed to show file in folder.";
  }
}

export function minimizeWindow(): void {
  getElectronAPI()?.minimize();
}

export function maximizeWindow(): void {
  getElectronAPI()?.maximize();
}

export function closeWindow(): void {
  getElectronAPI()?.close();
}
