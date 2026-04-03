declare global {
  interface ElectronAPI {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    selectFolder: () => Promise<string | null>;
    selectFile: () => Promise<string | null>;
    openPath: (fullPath: string) => Promise<string>;
    showInFolder: (fullPath: string) => Promise<void>;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
