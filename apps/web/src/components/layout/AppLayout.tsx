import React from "react";
import { Outlet } from "react-router-dom";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import StatusBar from "./StatusBar";

const AppLayout: React.FC = () => {
  return (
    <div
      style={{ padding: "8px" }}
      className="h-screen w-screen flex overflow-hidden bg-[var(--app-background)]"
    >
      <div className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-[var(--glass-border)] shadow-[var(--shadow-lg)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%),var(--color-bg-primary)]">
        <TitleBar />
        <div
          style={{ padding: "8px", gap: "8px" }}
          className="flex flex-1 overflow-hidden"
        >
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden relative rounded-xl bg-[radial-gradient(circle_at_top_right,var(--color-accent-subtle),transparent_600px)]">
            <Outlet />
          </main>
        </div>
        <StatusBar />
      </div>
    </div>
  );
};

export default AppLayout;
