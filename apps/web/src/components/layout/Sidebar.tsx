import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  MessageSquare,
  Search,
  HardDrive,
  Files,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { to: "/", icon: MessageSquare, label: "Chat" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/index", icon: HardDrive, label: "Index" },
    { to: "/files", icon: Files, label: "Files" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={`glass h-full flex flex-col border-r border-(--glass-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      <nav className=" flex flex-col flex-1 ">
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
      </nav>
      <div className="mt-auto flex flex-col gap-4 border-t border-(--glass-border) p-4">
        <button
          className="min-h-12 flex w-full cursor-pointer items-center justify-center rounded-xl border border-(--glass-border) bg-transparent p-2 text-(--color-text-secondary) transition-all duration-200 ease-in-out hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
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
