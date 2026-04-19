import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi, tokenStore } from "../api/client";

const AuthCallbackPage: React.FC = () => {
  const { setTokenAndUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error parameter from backend (e.g., beta access denied)
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    // With HashRouter, /#/auth/callback?token=abc — useSearchParams reads ?token=abc
    const token = searchParams.get("token");

    if (!token) {
      setError("No authentication token received");
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
      } catch (err) {
        tokenStore.clear();
        const message =
          err instanceof Error ? err.message : "Failed to load user profile";
        setError(message);
      }
    };

    finalize();
  }, [navigate, setTokenAndUser, searchParams]);

  if (error) {
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
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            color: "#ef4444",
            fontSize: "1.1rem",
            fontWeight: "500",
          }}
        >
          <AlertCircle size={24} />
          <span>Authentication Error</span>
        </div>
        <p style={{ maxWidth: "400px", lineHeight: "1.6" }}>{error}</p>
        <button
          onClick={() => navigate("/waitlist", { replace: true })}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "var(--color-accent)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Back to Waitlist
        </button>
      </div>
    );
  }

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
