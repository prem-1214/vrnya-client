import React, { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2, Loader2, Search } from "lucide-react";
import { type Conversation, listConversations, deleteConversation } from "../../api/client";

interface ConversationHistoryProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  activeId,
  onSelect,
  onNewChat,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await listConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      try {
        await deleteConversation(id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeId === id) onNewChat();
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  const filtered = conversations.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-3 flex flex-col gap-3">
        <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) text-white font-bold text-sm transition-all shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          New Chat
        </button>

        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) group-focus-within:text-(--color-accent) transition-colors" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-(--color-bg-hover) border border-transparent focus:border-(--color-accent-subtle) rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none transition-all placeholder:text-(--color-text-muted)"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-(--color-accent-subtle)" size={20} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs font-medium text-(--color-text-muted)">
              {searchQuery ? "No chats match your search." : "No previous chats found."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((chat) => {
              const isActive = activeId === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-(--color-accent-subtle) text-(--color-accent)"
                      : "text-(--color-text-primary) hover:bg-(--color-bg-hover)"
                  }`}
                >
                  <MessageSquare size={16} className={isActive ? "text-(--color-accent)" : "text-(--color-text-muted)"} />
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate leading-tight">
                      {chat.title || "Untitiled Chat"}
                    </span>
                    <span className="text-[10px] font-medium opacity-60 mt-0.5">
                      {formatTime(chat.updated_at)}
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-(--color-text-muted) hover:text-(--color-error) hover:bg-[rgba(239,68,68,0.1)] transition-all"
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;
