import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { listConversations, type Conversation } from "../../api/client";

interface RecentChatsListProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  limit?: number;
}

const RecentChatsList: React.FC<RecentChatsListProps> = ({
  activeId,
  onSelect,
  limit = 4,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listConversations();
        setConversations(data.slice(0, limit));
      } catch {
        setConversations([]);
      }
    };
    void load();
  }, [limit]);

  if (!conversations.length) {
    return (
      <p className="px-2 py-1 text-xs text-(--color-text-muted)">
        No recent chats yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((chat) => {
        const isActive = activeId === chat.id;
        return (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelect(chat.id)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
              isActive
                ? "bg-(--color-accent-subtle) text-(--color-accent)"
                : "text-(--color-text-secondary) hover:bg-(--color-bg-hover)"
            }`}
            aria-label={`Open recent chat ${chat.title || "Untitled Chat"}`}
          >
            <MessageSquare size={16} className="shrink-0" />
            <span className="truncate">{chat.title || "Untitled Chat"}</span>
          </button>
        );
      })}
    </div>
  );
};

export default RecentChatsList;
