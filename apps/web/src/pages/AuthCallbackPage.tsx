import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi, tokenStore } from "../api/client";

const AuthCallbackPage: React.FC = () => {
  const { setTokenAndUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // With HashRouter, /#/auth/callback?token=abc — useSearchParams reads ?token=abc
    const token = searchParams.get("token");

    if (!token) {
      navigate("/login?error=google_auth_failed", { replace: true });
      return;
    }

    // Set token immediately so authApi.me() can use it
    tokenStore.set(token);

    // Fetch user profile then finalize the session
    const finalize = async () => {
      try {
        const { user } = await authApi.me();
        setTokenAndUser(token, user);
        navigate("/", { replace: true });
      } catch {
        tokenStore.clear();
        navigate("/login?error=session_error", { replace: true });
      }
    };

    finalize();
  }, [navigate, setTokenAndUser, searchParams]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        color: "var(--color-text-secondary)",
      }}
    >
      <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
      <p>Finishing sign-in...</p>
    </div>
  );
};

export default AuthCallbackPage;
