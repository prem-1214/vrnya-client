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
            className="fixed inset-0 bg-black/40 z-40"
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
              className={`rounded-2xl shadow-2xl overflow-hidden border ${
                config.type === "error"
                  ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                  : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
              }`}
            >
              {/* Header */}
              <div
                className={`px-6 py-4 flex items-center justify-between ${
                  config.type === "error"
                    ? "bg-red-100 dark:bg-red-900 border-b border-red-200 dark:border-red-800"
                    : "bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700"
                }`}
              >
                <h2
                  className={`text-lg font-semibold ${
                    config.type === "error"
                      ? "text-red-900 dark:text-red-100"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {config.type === "error" && "⚠️ "} {config.title}
                </h2>
                <button
                  onClick={onClose}
                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
                    config.type === "error"
                      ? "text-red-700 dark:text-red-300"
                      : "text-gray-600 dark:text-gray-400"
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
                      ? "text-red-800 dark:text-red-200"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {config.message}
                </p>
              </div>

              {/* Footer */}
              <div
                className={`px-6 py-4 flex gap-3 justify-end border-t ${
                  config.type === "error"
                    ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
                    : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                }`}
              >
                {config.type === "confirm" && (
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50 font-medium text-sm transition-colors"
                  >
                    {config.cancelText || "Cancel"}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                    config.type === "error"
                      ? "bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600"
                      : "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
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
