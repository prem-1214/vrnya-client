import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ConversationHistory from "../chat/ConversationHistory";
import {
  MessageSquare,
  Search,
  HardDrive,
  Files,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

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
      className={`glass h-full flex flex-col rounded-xl border border-[var(--glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      <nav className=" flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `min-h-12 flex items-center overflow-hidden whitespace-nowrap no-underline rounded-xl transition-all duration-200 ease-in-out font-medium text-sm hover:bg-(--color-bg-hover) hover:text-(--color-text-primary) ${
                  isActive
                    ? "bg-(--color-accent-subtle) text-(--color-accent) shadow-[inset_0_0_0_1px_rgba(90,169,255,0.18)] [&>svg]:drop-shadow-[0_0_5px_var(--color-accent-glow)]"
                    : "text-(--color-text-secondary)"
                } ${isCollapsed ? "justify-center py-4 px-0" : "gap-4 p-4"}`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {!isCollapsed && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-(--glass-border) mt-2">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">
                History
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <ConversationHistory
                activeId={activeConversationId}
                onSelect={(id) => navigate(`/chat/${id}`)}
                onNewChat={() => navigate("/")}
              />
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-4 border-t border-(--glass-border) p-4">
        <button
          className="min-h-12 flex w-full cursor-pointer items-center justify-center rounded-xl border border-(--glass-border) bg-transparent p-2 text-(--color-text-secondary) transition-all duration-200 ease-in-out hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button
          className={`min-h-12 flex w-full cursor-pointer items-center rounded-xl border border-(--glass-border) bg-transparent text-(--color-text-secondary) transition-all duration-200 ease-in-out hover:bg-(--color-bg-hover) hover:text-(--color-text-primary) ${
            isCollapsed ? "justify-center p-2" : "gap-4 p-4"
          }`}
          disabled={isLoggingOut}
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && (
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          )}
        </button>

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
    </aside>
  );
};

export default Sidebar;
