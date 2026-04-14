import React from "react";
import LoginModal from "../components/LoginModal";
import "./LoginPage.css";

const LoginPage: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-bg-gradient" />
      <LoginModal />
    </div>
  );
};

export default LoginPage;
