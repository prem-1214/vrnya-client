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
    <aside className={`sidebar glass ${isCollapsed ? "collapsed" : ""}`}>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button 
          className="collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className="user-profile">
          <div className="avatar">P</div>
          <div className="user-info">
            <span className="username">Premr</span>
            <span className="user-role">Local Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
