import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ConversationHistory from "../chat/ConversationHistory";
import RecentChatsList from "../chat/RecentChatsList";
import SidebarSection from "../sidebar/SidebarSection";
import SidebarFilesTree from "../sidebar/SidebarFilesTree";
import {
  MessageSquare,
  Search,
  HardDrive,
  Files,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Extract conversation ID from URL if on a chat route
  const pathParts = location.pathname.split("/");
  const activeConversationId = (location.pathname === "/" || location.pathname.startsWith("/chat/")) 
    ? (pathParts[2] || null) 
    : null;

  const navItems = [
    { to: "/", icon: MessageSquare, label: "Chat" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/index", icon: HardDrive, label: "Index" },
    { to: "/files", icon: Files, label: "Files" },
  ];

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const isActiveRoute = (to: string) =>
    to === "/" ? location.pathname === "/" || location.pathname.startsWith("/chat/") : location.pathname.startsWith(to);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/waitlist", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={`glass h-full flex flex-col rounded-xl border border-(--glass-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      <nav className="flex min-h-0 flex-1 flex-col" aria-label="Primary app navigation">
        {isCollapsed && (
          <div className="flex min-h-0 flex-1 flex-col items-center gap-1.5 px-2 py-3">
            {navItems.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  isActiveRoute(item.to)
                    ? "border-(--color-accent-subtle) bg-(--color-accent-subtle) text-(--color-accent)"
                    : "border-(--glass-border) text-(--color-text-secondary) hover:bg-(--color-bg-hover)"
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <item.icon size={16} />
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsHistoryView((prev) => !prev)}
              className={`mt-1 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                isHistoryView
                  ? "border-(--color-accent-subtle) bg-(--color-accent-subtle) text-(--color-accent)"
                  : "border-(--glass-border) text-(--color-text-muted) hover:bg-(--color-bg-hover)"
              }`}
              title="Chat history"
              aria-label="Chat history"
            >
              <Clock3 size={16} />
            </button>

            <button
              type="button"
              className="mt-auto flex h-9 w-9 items-center justify-center rounded-lg border border-(--glass-border) bg-transparent text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
              onClick={() => setIsCollapsed(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--glass-border) bg-transparent text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
              onClick={() => navigate("/settings")}
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--glass-border) bg-transparent text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--glass-border) bg-transparent text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
              onClick={() => navigate("/settings")}
              title="Account"
              aria-label="Account"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-hover))] text-[11px] font-bold text-(--color-bg-primary)">
                {initial}
              </span>
            </button>
          </div>
        )}

        {!isCollapsed && (
          <div className="flex items-center gap-1.5 px-2 py-2">
            {navItems.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                  isActiveRoute(item.to)
                    ? "border-(--color-accent-subtle) bg-(--color-accent-subtle) text-(--color-accent)"
                    : "border-(--glass-border) text-(--color-text-secondary) hover:bg-(--color-bg-hover)"
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <item.icon size={15} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsHistoryView((prev) => !prev)}
              className={`ml-0.5 flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                isHistoryView
                  ? "border-(--color-accent-subtle) bg-(--color-accent-subtle) text-(--color-accent)"
                  : "border-(--glass-border) text-(--color-text-muted) hover:bg-(--color-bg-hover)"
              }`}
              title={isHistoryView ? "Show workspace" : "Show chat history"}
              aria-label={isHistoryView ? "Show workspace view" : "Show chat history"}
            >
              <Clock3 size={15} />
            </button>
            <button
              type="button"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-(--glass-border) text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover)"
              onClick={() => setIsCollapsed(true)}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={15} />
            </button>
          </div>
        )}

        {!isCollapsed && !isHistoryView && (
          <div className="mt-1.5 flex min-h-0 flex-1 flex-col border-t border-(--glass-border)">
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2 pt-2">
              <SidebarSection
                id="sidebar-recent-chats"
                title="Recent Chats"
                defaultOpen
              >
                <RecentChatsList
                  activeId={activeConversationId}
                  onSelect={(id) => navigate(`/chat/${id}`)}
                />
              </SidebarSection>

              <SidebarSection id="sidebar-files-tree" title="Workspace" defaultOpen>
                <SidebarFilesTree />
              </SidebarSection>
            </div>
          </div>
        )}

        {!isCollapsed && isHistoryView && (
          <div className="mt-1.5 flex min-h-0 flex-1 flex-col border-t border-(--glass-border)">
            <div className="px-2.5 py-2">
              <span className="px-1 text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">
                Chat History
              </span>
            </div>
            <div className="min-h-0 flex-1 px-2 pb-2">
              <ConversationHistory
                activeId={activeConversationId}
                onSelect={(id) => navigate(`/chat/${id}`)}
                onNewChat={() => navigate("/")}
                compact
              />
            </div>
          </div>
        )}
      </nav>

      {!isCollapsed && (
      <div className="mt-auto flex flex-col gap-2.5 border-t border-(--glass-border) p-3">
        <div className={`grid ${isCollapsed ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
          <button
            className={`min-h-10 flex w-full cursor-pointer items-center rounded-lg border border-(--glass-border) bg-transparent text-(--color-text-secondary) transition-all duration-200 ease-in-out hover:bg-(--color-bg-hover) hover:text-(--color-text-primary) ${
              isCollapsed ? "justify-center p-2" : "justify-center gap-2 px-2 py-2"
            }`}
            onClick={() => navigate("/settings")}
            title="Settings"
            type="button"
          >
            <Settings size={16} className="shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>
          <button
            className={`min-h-10 flex w-full cursor-pointer items-center rounded-lg border border-(--glass-border) bg-transparent text-(--color-text-secondary) transition-all duration-200 ease-in-out hover:bg-(--color-bg-hover) hover:text-(--color-text-primary) ${
              isCollapsed ? "justify-center p-2" : "justify-center gap-2 px-2 py-2"
            }`}
            disabled={isLoggingOut}
            onClick={handleLogout}
            title="Logout"
            type="button"
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && (
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            )}
          </button>
        </div>

        <div
          className={`flex items-center overflow-hidden whitespace-nowrap ${isCollapsed ? "justify-center" : "gap-4"}`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-hover))] text-(--color-bg-primary) text-sm font-bold shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
            {initial}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-(--color-text-primary)">
                {displayName}
              </span>
              <span className="text-xs text-(--color-text-muted) w-36 overflow-hidden text-ellipsis">
                {user?.email || "Local User"}
              </span>
            </div>
          )}
        </div>
      </div>
      )}
    </aside>
  );
};

export default Sidebar;
