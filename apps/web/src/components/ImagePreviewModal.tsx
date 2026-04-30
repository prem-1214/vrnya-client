import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { getImageDownloadUrl } from "../api/client";

interface ImagePreviewModalProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  fileId,
  fileName,
  onClose,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        const response = await getImageDownloadUrl(fileId);
        setImageUrl(response.downloadUrl);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load image";
        setError(message);
        setImageUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [fileId]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative flex w-full max-w-5xl max-h-[92vh] flex-col items-center"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-0 top-12 z-10 rounded-lg p-2 text-white transition-colors hover:bg-white/10"
            title="Close"
          >
            <X size={24} />
          </button>

          {/* Image or Loading/Error state */}
          {isLoading && (
            <div className="flex h-96 w-96 items-center justify-center">
              <Loader2 size={48} className="text-white animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center w-96 h-96 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <p className="text-red-400 text-center px-4">{error}</p>
            </div>
          )}

          {imageUrl && !isLoading && (
            <div className="flex w-full flex-1 flex-col items-center gap-3 overflow-hidden pt-12">
              <div className="flex w-full flex-1 items-center justify-center overflow-auto rounded-lg bg-black/20 p-2 md:p-3">
                <img
                  src={imageUrl}
                  alt={fileName}
                  className="h-auto max-h-[78vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                />
              </div>
              <p className="text-sm text-white/85">
                {fileName}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImagePreviewModal;
