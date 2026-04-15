import React from "react";
import LoginModal from "../components/LoginModal";

const LoginPage: React.FC = () => {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden p-6">
      <div className="absolute inset-0 -z-1 bg-(image:--app-background)" />
      <LoginModal />
    </div>
  );
};

export default LoginPage;
