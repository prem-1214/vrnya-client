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

  const modeButtonClass = (isActive: boolean) =>
    `flex-1 rounded-full border-0 px-2 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-(--color-accent) text-white shadow-[0_1px_6px_var(--color-accent-glow)]"
        : "bg-transparent text-(--color-text-muted)"
    }`;

  return (
    <motion.div
      className="flex w-full max-w-[480px] flex-col gap-4 rounded-[28px] border border-(--glass-border) bg-(--glass-bg) px-8 py-12 shadow-(--shadow-lg) [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Logo / Brand */}
      <div className="mb-1 flex flex-col items-center gap-2">
        <img src="/Vrnya-logo.png" alt="Vrnya" className="login-modal-logo" />
        <p className="text-sm text-(--color-text-muted)">
          Your AI-powered knowledge base
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-full border border-(--color-border) bg-(--color-bg-surface) p-[3px]">
        <button
          className={modeButtonClass(mode === "login")}
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          type="button"
        >
          Sign In
        </button>
        <button
          className={modeButtonClass(mode === "register")}
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
        className="flex w-full items-center justify-center gap-2 rounded-full border border-(--color-border) bg-(--color-bg-surface) px-4 py-2 text-sm font-medium text-(--color-text-primary) transition-all duration-200 hover:border-(--color-text-muted) hover:bg-(--color-bg-hover)"
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

      <div className="flex items-center gap-2 text-xs text-(--color-text-muted) before:h-px before:flex-1 before:bg-(--color-border) before:content-[''] after:h-px after:flex-1 after:bg-(--color-border) after:content-['']">
        <span>or</span>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <AnimatePresence>
          {mode === "register" && (
            <motion.div
              key="displayName"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-1.5 overflow-hidden"
            >
              <label className="text-xs font-medium tracking-[0.05em] text-(--color-text-muted) uppercase">
                Display Name
              </label>
              <div className="relative flex items-center">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3 text-(--color-text-muted)"
                />
                <input
                  id="displayName"
                  type="text"
                  className="w-full rounded-full border border-(--color-border) bg-(--color-bg-surface) px-4 py-2 pl-[38px] font-sans text-sm text-(--color-text-primary) outline-none transition-colors duration-200 focus:border-(--color-accent) focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-1.5 overflow-hidden">
          <label
            className="text-xs font-medium tracking-[0.05em] text-(--color-text-muted) uppercase"
            htmlFor="email"
          >
            Email
          </label>
          <div className="relative flex items-center">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 text-(--color-text-muted)"
            />
            <input
              id="email"
              type="email"
              className="w-full rounded-full border border-(--color-border) bg-(--color-bg-surface) px-4 py-2 pl-[38px] font-sans text-sm text-(--color-text-primary) outline-none transition-colors duration-200 focus:border-(--color-accent) focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 overflow-hidden">
          <label
            className="text-xs font-medium tracking-[0.05em] text-(--color-text-muted) uppercase"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative flex items-center">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3 text-(--color-text-muted)"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full rounded-full border border-(--color-border) bg-(--color-bg-surface) px-4 py-2 pl-[38px] font-sans text-sm text-(--color-text-primary) outline-none transition-colors duration-200 focus:border-(--color-accent) focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
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
              className="absolute right-2.5 flex cursor-pointer border-0 bg-transparent p-1 text-(--color-text-muted) transition-colors duration-200 hover:text-(--color-text-primary)"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-center gap-1 rounded-sm border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-(--color-error)"
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
          className="flex min-h-10 w-full items-center justify-center gap-1 rounded-full border-0 bg-(--color-accent) px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-(--shadow-accent) hover:not-disabled:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          id="auth-submit"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
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
