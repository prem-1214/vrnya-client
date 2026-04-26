import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export type ModalType = "alert" | "confirm" | "error";

export interface ModalConfig {
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  isOpen: boolean;
  config: ModalConfig | null;
  showAlert: (title: string, message: string) => Promise<void>;
  showError: (title: string, message: string) => Promise<void>;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  closeModal: () => void;
}

export const ModalContext = React.createContext<ModalContextType | undefined>(
  undefined,
);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalConfig | null>(null);
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
    reject: (reason?: any) => void;
  } | null>(null);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
  }, []);

  const showAlert = useCallback(
    (title: string, message: string): Promise<void> => {
      return new Promise((resolve) => {
        setConfig({
          type: "alert",
          title,
          message,
          confirmText: "OK",
          onConfirm: () => {
            closeModal();
            resolve();
          },
        });
        setIsOpen(true);
      });
    },
    [closeModal],
  );

  const showError = useCallback(
    (title: string, message: string): Promise<void> => {
      return new Promise((resolve) => {
        setConfig({
          type: "error",
          title,
          message,
          confirmText: "Dismiss",
          onConfirm: () => {
            closeModal();
            resolve();
          },
        });
        setIsOpen(true);
      });
    },
    [closeModal],
  );

  const showConfirm = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfig({
          type: "confirm",
          title,
          message,
          confirmText: "Confirm",
          cancelText: "Cancel",
          onConfirm: () => {
            closeModal();
            resolve(true);
          },
          onCancel: () => {
            closeModal();
            resolve(false);
          },
        });
        setIsOpen(true);
      });
    },
    [closeModal],
  );

  return (
    <ModalContext.Provider
      value={{
        isOpen,
        config,
        showAlert,
        showError,
        showConfirm,
        closeModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
};

interface ModalComponentProps {
  isOpen: boolean;
  config: ModalConfig | null;
  onClose: () => void;
}

export const ModalComponent: React.FC<ModalComponentProps> = ({
  isOpen,
  config,
  onClose,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      if (config?.onConfirm) {
        await config.onConfirm();
      }
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleCancel = () => {
    if (config?.onCancel) {
      config.onCancel();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && config && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div
              className={`rounded-2xl shadow-2xl overflow-hidden ${
                config.type === "error"
                  ? "bg-red-950/90 border border-red-500/30"
                  : "bg-card border border-input"
              }`}
            >
              {/* Header */}
              <div
                className={`px-6 py-4 flex items-center justify-between ${
                  config.type === "error"
                    ? "bg-red-900/50 border-b border-red-500/20"
                    : "border-b border-input bg-muted/50"
                }`}
              >
                <h2
                  className={`text-lg font-semibold ${
                    config.type === "error" ? "text-red-100" : "text-foreground"
                  }`}
                >
                  {config.type === "error" && "⚠️ "} {config.title}
                </h2>
                <button
                  onClick={onClose}
                  className={`p-1 rounded hover:bg-muted/50 transition-colors ${
                    config.type === "error" ? "text-red-200" : ""
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p
                  className={`text-sm leading-relaxed ${
                    config.type === "error"
                      ? "text-red-100"
                      : "text-muted-foreground"
                  }`}
                >
                  {config.message}
                </p>
              </div>

              {/* Footer */}
              <div
                className={`px-6 py-4 flex gap-3 justify-end border-t ${
                  config.type === "error"
                    ? "border-red-500/20 bg-red-900/30"
                    : "border-input bg-muted/20"
                }`}
              >
                {config.type === "confirm" && (
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50 font-medium text-sm transition-colors"
                  >
                    {config.cancelText || "Cancel"}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                    config.type === "error"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}
                >
                  {isLoading ? "..." : config.confirmText || "OK"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
