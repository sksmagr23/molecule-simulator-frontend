import React, { createContext, useContext, useState } from "react";
interface FileContextType {
  activeFileId: string | null;
  setActiveFileId: (fileId: string | null) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  return (
    <FileContext.Provider value={{ activeFileId, setActiveFileId }}>
      {children}
    </FileContext.Provider>
  );
};

export function useFile(): FileContextType {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFile must be used within a FileProvider");
  }
  return context;
}
