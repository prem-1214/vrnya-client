import { useState } from "react";
import { NavLink } from "react-router-dom";
import { MessageSquare, Search, HardDrive, Files, ChevronLeft, ChevronRight, Settings } from "lucide-react";

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navItems = [
    { to: "/", icon: MessageSquare, label: "Chat" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/index", icon: HardDrive, label: "Index" },
    { to: "/files", icon: Files, label: "Files" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside 
      className={`glass h-full flex flex-col border-r border-[--glass-border] py-4 px-2 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isCollapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center overflow-hidden whitespace-nowrap no-underline rounded-xl transition-all duration-200 ease-in-out font-medium text-sm hover:bg-[--color-bg-hover] hover:text-[--color-text-primary] ${
                isActive 
                  ? "bg-[--color-accent-subtle] text-[--color-accent] shadow-[inset_0_0_0_1px_rgba(90,169,255,0.18)] [&>svg]:drop-shadow-[0_0_5px_var(--color-accent-glow)]" 
                  : "text-[--color-text-secondary]"
              } ${isCollapsed ? "justify-center py-4 px-0" : "gap-4 p-4"}`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-[--glass-border] mt-auto flex flex-col gap-4">
        <button 
          className="bg-transparent border border-[--glass-border] text-[--color-text-secondary] rounded-xl p-2 cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out w-full hover:bg-[--color-bg-hover] hover:text-[--color-text-primary]" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className={`flex items-center overflow-hidden whitespace-nowrap ${isCollapsed ? "justify-center" : "gap-4"}`}>
          <div className="shrink-0 w-8 h-8 bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-hover))] rounded-full flex items-center justify-center text-[--color-bg-primary] font-bold text-sm shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
            P
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[--color-text-primary]">Premr</span>
              <span className="text-xs text-[--color-text-muted]">Local Admin</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
