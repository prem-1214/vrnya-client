import React from "react";
import { Outlet } from "react-router-dom";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import StatusBar from "./StatusBar";
import "./AppLayout.css";
import "./TitleBar.css";
import "./Sidebar.css";
import "./StatusBar.css";

const AppLayout: React.FC = () => {
  return (
    <div className="app-container">
      <TitleBar />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <StatusBar />
    </div>
  );
};

export default AppLayout;
