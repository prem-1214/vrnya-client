import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { Link } from "react-router-dom";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline?: () => void;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  requireCheckbox?: boolean;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  title = "Terms of Service",
  description = "Please read and accept our Terms of Service to continue.",
  showCloseButton = true,
  requireCheckbox = true,
}) => {
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAccept = () => {
    if (requireCheckbox && !isAccepted) {
      return;
    }
    onAccept();
  };

  const handleDecline = () => {
    setIsAccepted(false);
    onDecline?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-2xl bg-(--color-bg-primary) border border-white/20 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-white/10 bg-(--color-bg-primary)/95 px-8 py-6 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-(--color-text-primary)">
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-2 text-(--color-text-secondary)">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={handleDecline}
                    className="ml-4 rounded-lg p-2 text-(--color-text-secondary) transition-colors hover:bg-white/10 hover:text-(--color-text-primary)"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              <div className="space-y-4 text-(--color-text-secondary) text-sm leading-relaxed">
                <div className="rounded-lg bg-white/5 p-4">
                  <p>
                    By accepting these Terms of Service, you agree to comply
                    with all the terms and conditions outlined in our{" "}
                    <Link
                      to="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-(--color-accent) hover:underline"
                    >
                      full Terms of Service
                    </Link>
                    . Please ensure you have read and understood all the
                    conditions before proceeding.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold text-(--color-text-primary)">
                    Key points:
                  </p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>You retain ownership of all documents you upload</li>
                    <li>
                      We use your documents solely to provide our Services
                    </li>
                    <li>
                      You agree to use the Service in accordance with applicable
                      laws
                    </li>
                    <li>
                      We reserve the right to modify these terms at any time
                    </li>
                    <li>
                      By using the Service, you accept all liability limitations
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg bg-blue-500/10 p-4 text-(--color-accent)">
                  <p className="text-sm">
                    For the complete Terms of Service, please visit the{" "}
                    <Link
                      to="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline"
                    >
                      Terms of Service page
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {/* Checkbox */}
              {requireCheckbox && (
                <div className="mt-6 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="tos-accept"
                    checked={isAccepted}
                    onChange={(e) => setIsAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-2 border-(--color-accent) bg-transparent accent-(--color-accent)"
                  />
                  <label
                    htmlFor="tos-accept"
                    className="cursor-pointer select-none text-sm text-(--color-text-secondary) leading-relaxed"
                  >
                    I have read and agree to the Terms of Service
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 border-t border-white/10 bg-(--color-bg-primary)/95 px-8 py-4 backdrop-blur-sm">
              <div className="flex gap-3">
                {onDecline && (
                  <button
                    onClick={handleDecline}
                    className="flex-1 rounded-lg border border-white/20 px-4 py-3 font-medium text-(--color-text-secondary) transition-colors hover:bg-white/10 hover:text-(--color-text-primary)"
                  >
                    Decline
                  </button>
                )}
                <button
                  onClick={handleAccept}
                  disabled={requireCheckbox && !isAccepted}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-(--color-accent) px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-(--color-accent)/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={18} />
                  Accept Terms
                </button>
              </div>

              {requireCheckbox && !isAccepted && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 text-amber-500 flex-shrink-0"
                  />
                  <p className="text-xs text-amber-600/80">
                    You must accept the Terms of Service to continue
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermsOfServiceModal;
