import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";

export type PendingComposerAttach = {
  docIds: string[];
  folder?: { name: string; path: string };
};

export type ComposerAttachHandler = (
  payload: PendingComposerAttach,
) => Promise<void>;

type ComposerAttachContextValue = {
  registerAttachHandler: (handler: ComposerAttachHandler | null) => void;
  attachFromSidebar: (payload: PendingComposerAttach) => Promise<void>;
};

const ComposerAttachContext = createContext<ComposerAttachContextValue | null>(
  null,
);

export const ComposerAttachProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const handlerRef = useRef<ComposerAttachHandler | null>(null);
  const navigate = useNavigate();

  const registerAttachHandler = useCallback(
    (handler: ComposerAttachHandler | null) => {
      handlerRef.current = handler;
    },
    [],
  );

  const attachFromSidebar = useCallback(
    async (payload: PendingComposerAttach) => {
      if (!payload.docIds.length) return;
      const run = handlerRef.current;
      if (run) {
        await run(payload);
        return;
      }
      navigate("/", { state: { pendingComposerAttach: payload } });
    },
    [navigate],
  );

  const value = useMemo(
    () => ({ registerAttachHandler, attachFromSidebar }),
    [registerAttachHandler, attachFromSidebar],
  );

  return (
    <ComposerAttachContext.Provider value={value}>
      {children}
    </ComposerAttachContext.Provider>
  );
};

export const useComposerAttach = (): ComposerAttachContextValue => {
  const ctx = useContext(ComposerAttachContext);
  if (!ctx) {
    throw new Error(
      "useComposerAttach must be used within ComposerAttachProvider",
    );
  }
  return ctx;
};
