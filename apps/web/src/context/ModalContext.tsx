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
              className={`rounded-2xl overflow-hidden border border-(--glass-border) shadow-(--shadow-lg) bg-(--color-bg-surface) ${
                config.type === "error" ? "ring-2 ring-(--color-error)/25" : ""
              }`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between border-b px-6 py-4 border-(--color-border) ${
                  config.type === "error"
                    ? "bg-[color-mix(in_srgb,var(--color-error)_10%,var(--color-bg-secondary))]"
                    : "bg-(--color-bg-secondary)"
                }`}
              >
                <h2
                  className={`text-lg font-semibold ${
                    config.type === "error"
                      ? "text-(--color-error)"
                      : "text-(--color-text-primary)"
                  }`}
                >
                  {config.type === "error" && "⚠️ "} {config.title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded p-1 transition-colors hover:bg-(--color-bg-hover) ${
                    config.type === "error"
                      ? "text-(--color-error)"
                      : "text-(--color-text-muted)"
                  }`}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p
                  className={`text-sm leading-relaxed ${
                    config.type === "error"
                      ? "text-(--color-text-primary)"
                      : "text-(--color-text-secondary)"
                  }`}
                >
                  {config.message}
                </p>
              </div>

              {/* Footer */}
              <div
                className={`flex justify-end gap-3 border-t border-(--color-border) bg-(--color-bg-secondary) px-6 py-4`}
              >
                {config.type === "confirm" && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="rounded-lg bg-(--color-bg-hover) px-4 py-2 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-bg-active) disabled:opacity-50"
                  >
                    {config.cancelText || "Cancel"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-95 disabled:opacity-50 ${
                    config.type === "error"
                      ? "bg-(--color-error)"
                      : "bg-(--color-accent) hover:bg-(--color-accent-hover)"
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
