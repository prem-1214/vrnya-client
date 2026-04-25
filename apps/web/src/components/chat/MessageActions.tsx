import React, { useState } from "react";
import { Copy, Edit2, Trash2, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { deleteMessage, updateMessage } from "../../api/client";
import { useSpeech } from "../../hooks/useSpeech";

interface MessageActionsProps {
  messageId: string;
  conversationId: string;
  content: string;
  role: "user" | "assistant";
  onMessageUpdated?: (newContent: string) => void;
  onMessageDeleted?: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  conversationId,
  content,
  role,
  onMessageUpdated,
  onMessageDeleted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const { speak, stop, isSpeaking } = useSpeech();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(content);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      alert("Message cannot be empty");
      return;
    }

    try {
      await updateMessage(conversationId, messageId, editValue.trim());
      onMessageUpdated?.(editValue.trim());
      setIsEditing(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update message:", error);
      alert("Failed to update message");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;

    try {
      await deleteMessage(conversationId, messageId);
      onMessageDeleted?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message");
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(content);
    }
  };

  return (
    <div className="relative">
      {/* Floating action button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title="Message actions"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-lg">⋯</span>
      </motion.button>

      {/* Actions dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 bg-card border border-input rounded-lg shadow-lg z-50 min-w-[200px]"
          >
            {isEditing ? (
              <div className="p-3 space-y-3">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-3 py-2 rounded bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-3 py-2 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Copy */}
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>

                {/* Speak */}
                <button
                  onClick={handleSpeak}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Read Aloud
                    </>
                  )}
                </button>

                {/* Edit (user messages only) */}
                {role === "user" && (
                  <button
                    onClick={handleEditStart}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}

                {/* Delete (user messages only) */}
                {role === "user" && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-destructive/10 transition-colors flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageActions;
