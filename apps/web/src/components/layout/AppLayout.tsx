import React from "react";
import { Outlet } from "react-router-dom";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import StatusBar from "./StatusBar";

const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%),var(--color-bg-primary)]">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[radial-gradient(circle_at_top_right,var(--color-accent-subtle),transparent_600px)]">
          <Outlet />
        </main>
      </div>
      <StatusBar />
    </div>
  );
};

export default AppLayout;
