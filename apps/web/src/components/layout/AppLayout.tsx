import React from "react";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import StatusBar from "./StatusBar";

const AppLayout: React.FC = () => {
  return (
    <div
      style={{ padding: "8px" }}
      className="h-screen w-screen flex overflow-hidden bg-(--app-background)"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-2000 focus:rounded-md focus:bg-(--color-bg-surface) focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to main content
      </a>
      <div className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-(--glass-border) shadow-(--shadow-lg) bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%),var(--color-bg-primary)]">
        <Helmet>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <TitleBar />
        <div
          style={{ padding: "8px", gap: "8px" }}
          className="flex flex-1 overflow-hidden"
        >
          <Sidebar />
          <main
            id="main-content"
            className="flex-1 flex flex-col overflow-hidden relative rounded-xl bg-[radial-gradient(circle_at_top_right,var(--color-accent-subtle),transparent_600px)]"
          >
            <Outlet />
          </main>
        </div>
        <StatusBar />
      </div>
    </div>
  );
};

export default AppLayout;
