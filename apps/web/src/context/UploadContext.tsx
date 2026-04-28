import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useR2Upload, type UploadItem } from "../hooks/useR2Upload";

interface UploadContextType {
  items: UploadItem[];
  uploadMultiple: (files: FileList | File[], folderPath?: string) => void;
  dismissItem: (id: string) => void;
  clearCompleted: () => void;
  hasCompleted: boolean;
  isIdle: boolean;
  targetFolder: string | null;
  setTargetFolder: (folder: string | null) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const upload = useR2Upload();
  const [targetFolder, setTargetFolder] = useState<string | null>(null);

  return (
    <UploadContext.Provider
      value={{ ...upload, targetFolder, setTargetFolder }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUploadContext = (): UploadContextType => {
  const context = useContext(UploadContext);
  if (!context)
    throw new Error("useUploadContext must be used within UploadProvider");
  return context;
};
