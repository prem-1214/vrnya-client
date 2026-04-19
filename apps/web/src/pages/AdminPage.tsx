import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { BASE_URL, tokenStore } from "../api/client";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  profession: string | null;
  status: string;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grantingEmail, setGrantingEmail] = useState<string | null>(null);
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [emailInput, setEmailInput] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Fetch waitlist
  useEffect(() => {
    const fetchWaitlist = async () => {
      try {
        setIsLoading(true);
        const token = tokenStore.get();
        if (!token) {
          setMessage({
            type: "error",
            text: "No authentication token found. Please login again.",
          });
          setIsLoading(false);
          return;
        }
        const response = await fetch(`${BASE_URL}/api/v1/admin/waitlist`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch waitlist");
        const data = await response.json();
        setWaitlist(data.waitlist);
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error ? error.message : "Failed to load waitlist",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWaitlist();
  }, []);

  // Refresh waitlist without page reload
  const refreshWaitlist = async () => {
    try {
      const token = tokenStore.get();
      if (!token) return;

      const response = await fetch(`${BASE_URL}/api/v1/admin/waitlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWaitlist(data.waitlist);
      }
    } catch (error) {
      console.error("Error refreshing waitlist:", error);
    }
  };

  const grantAccess = async (email: string) => {
    try {
      setGrantingEmail(email);
      const token = tokenStore.get();
      if (!token) {
        setMessage({
          type: "error",
          text: "No authentication token found. Please login again.",
        });
        return;
      }
      const response = await fetch(
        `${BASE_URL}/api/v1/admin/grant-beta-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        },
      );

      if (!response.ok) throw new Error("Failed to grant access");

      setMessage({
        type: "success",
        text: `Beta access granted to ${email}`,
      });

      // Refresh waitlist without page reload
      await refreshWaitlist();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to grant access",
      });
    } finally {
      setGrantingEmail(null);
    }
  };

  const revokeAccess = async (email: string) => {
    try {
      setRevokingEmail(email);
      const token = tokenStore.get();
      if (!token) {
        setMessage({
          type: "error",
          text: "No authentication token found. Please login again.",
        });
        return;
      }
      const response = await fetch(
        `${BASE_URL}/api/v1/admin/revoke-beta-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to revoke access");
      }

      setMessage({
        type: "success",
        text: `Beta access revoked from ${email}`,
      });

      // Refresh waitlist without page reload
      await refreshWaitlist();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to revoke access",
      });
    } finally {
      setRevokingEmail(null);
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Admin Panel</h1>

      {message && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "2rem",
            borderRadius: "0.5rem",
            backgroundColor:
              message.type === "success"
                ? "rgba(34, 197, 94, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
            border:
              message.type === "success"
                ? "1px solid rgb(34, 197, 94)"
                : "1px solid rgb(239, 68, 68)",
            color:
              message.type === "success"
                ? "rgb(34, 197, 94)"
                : "rgb(239, 68, 68)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {message.type === "success" ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>Grant Beta Access</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="email"
            placeholder="Enter user email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
            }}
          />
          <button
            onClick={() => {
              if (emailInput) {
                grantAccess(emailInput);
                setEmailInput("");
              }
            }}
            disabled={!emailInput}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "var(--color-accent)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: emailInput ? "pointer" : "not-allowed",
              opacity: emailInput ? 1 : 0.5,
            }}
          >
            Grant Access
          </button>
        </div>
      </div>

      <div>
        <h2 style={{ marginBottom: "1rem" }}>
          Waitlist Signups ({waitlist.length})
        </h2>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <Loader2
              size={24}
              style={{ animation: "spin 1s linear infinite", margin: "0 auto" }}
            />
          </div>
        ) : waitlist.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>
            No waitlist signups yet
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid var(--color-border)",
              borderRadius: "0.75rem",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-bg-surface)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Profession
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((entry) => (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ padding: "0.75rem" }}>{entry.email}</td>
                    <td style={{ padding: "0.75rem" }}>{entry.name || "-"}</td>
                    <td style={{ padding: "0.75rem" }}>
                      {entry.profession || "-"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color:
                          entry.status === "converted"
                            ? "var(--color-accent)"
                            : "var(--color-text-secondary)",
                      }}
                    >
                      {entry.status}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {entry.status !== "converted" && (
                          <button
                            onClick={() => grantAccess(entry.email)}
                            disabled={grantingEmail === entry.email}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "var(--color-accent)",
                              color: "white",
                              border: "none",
                              borderRadius: "0.375rem",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                            }}
                          >
                            {grantingEmail === entry.email ? (
                              <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              "Grant"
                            )}
                          </button>
                        )}
                        {entry.status === "converted" && (
                          <button
                            onClick={() => revokeAccess(entry.email)}
                            disabled={revokingEmail === entry.email}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "0.375rem",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                            }}
                          >
                            {revokingEmail === entry.email ? (
                              <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              "Revoke"
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
