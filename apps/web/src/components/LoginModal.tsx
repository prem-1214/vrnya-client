import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/client";
import "../pages/LoginPage.css";

type AuthMode = "login" | "register";

const LoginModal: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName || undefined);
      }
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = authApi.googleSignInUrl();
  };

  return (
    <motion.div
      className="login-card glass"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Logo / Brand */}
      <div className="login-brand">
        <h1 className="login-brand-name">Vrnya</h1>
        <p className="login-brand-tagline">Your AI-powered knowledge base</p>
      </div>

      {/* Mode toggle */}
      <div className="login-mode-toggle">
        <button
          className={`login-mode-btn ${mode === "login" ? "active" : ""}`}
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          type="button"
        >
          Sign In
        </button>
        <button
          className={`login-mode-btn ${mode === "register" ? "active" : ""}`}
          onClick={() => {
            setMode("register");
            setError(null);
          }}
          type="button"
        >
          Create Account
        </button>
      </div>

      {/* Google Sign In */}
      <button
        className="login-google-btn"
        onClick={handleGoogleSignIn}
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="login-divider">
        <span>or</span>
      </div>

      {/* Form */}
      <form className="login-form" onSubmit={handleSubmit}>
        <AnimatePresence>
          {mode === "register" && (
            <motion.div
              key="displayName"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="login-field"
            >
              <label className="login-label">Display Name</label>
              <div className="login-input-wrap">
                <User size={16} className="login-input-icon" />
                <input
                  id="displayName"
                  type="text"
                  className="login-input"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="login-field">
          <label className="login-label" htmlFor="email">
            Email
          </label>
          <div className="login-input-wrap">
            <Mail size={16} className="login-input-icon" />
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">
            Password
          </label>
          <div className="login-input-wrap">
            <Lock size={16} className="login-input-icon" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="login-input"
              placeholder={
                mode === "register" ? "Min 8 characters" : "Your password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
            <button
              type="button"
              className="login-show-password"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className="login-submit-btn"
          disabled={isLoading}
          id="auth-submit"
        >
          {isLoading ? (
            <Loader2 size={16} className="spin" />
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default LoginModal;
