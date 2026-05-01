import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, Loader2, Shield, RefreshCw } from "lucide-react";
import { BASE_URL, tokenStore } from "../api/client";
import PageShell from "../components/layout/PageShell";

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
    <PageShell
      title="Admin Panel"
      subtitle="Manage waitlist and beta access"
      actions={
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-(--color-accent)" />
          <button
            type="button"
            onClick={() => void refreshWaitlist()}
            className="flex items-center gap-1 rounded-md border border-(--color-border) bg-(--color-bg-surface) px-2.5 py-1.5 text-xs text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      }
      bodyClassName="overflow-y-auto"
      contentClassName="mx-auto w-full max-w-[1200px] p-6 md:p-8"
    >
      <div className="space-y-4">
        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <section className="glass rounded-xl border border-(--glass-border) p-4 md:p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-text-secondary)">
            Grant Beta Access
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="Enter user email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) outline-none transition-colors placeholder:text-(--color-text-muted) focus:border-(--color-accent)"
            />
            <button
              type="button"
              onClick={() => {
                if (emailInput.trim()) {
                  void grantAccess(emailInput.trim());
                  setEmailInput("");
                }
              }}
              disabled={!emailInput.trim()}
              className="rounded-lg bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Grant Access
            </button>
          </div>
        </section>

        <section className="glass rounded-xl border border-(--glass-border)">
          <div className="flex items-center justify-between border-b border-(--color-border-subtle) px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-secondary)">
              Waitlist Signups
            </h2>
            <span className="rounded-full bg-(--color-accent-subtle) px-2 py-0.5 text-xs text-(--color-accent)">
              {waitlist.length}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-(--color-text-secondary)">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : waitlist.length === 0 ? (
            <div className="px-4 py-8 text-sm text-(--color-text-muted)">
              No waitlist signups yet.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead className="sticky top-0 bg-(--color-bg-surface)">
                  <tr className="border-b border-(--color-border)">
                    <th className="px-4 py-2.5 text-left font-semibold text-(--color-text-secondary)">Email</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-(--color-text-secondary)">Name</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-(--color-text-secondary)">Profession</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-(--color-text-secondary)">Status</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-(--color-text-secondary)">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-(--color-border-subtle) align-top transition-colors hover:bg-(--color-bg-hover)"
                    >
                      <td className="px-4 py-2.5 text-(--color-text-primary)">{entry.email}</td>
                      <td className="px-4 py-2.5 text-(--color-text-primary)">{entry.name || "-"}</td>
                      <td className="px-4 py-2.5 text-(--color-text-secondary)">{entry.profession || "-"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            entry.status === "converted"
                              ? "bg-(--color-accent-subtle) text-(--color-accent)"
                              : "bg-(--color-bg-hover) text-(--color-text-muted)"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2">
                          {entry.status !== "converted" && (
                            <button
                              type="button"
                              onClick={() => void grantAccess(entry.email)}
                              disabled={grantingEmail === entry.email}
                              className="inline-flex items-center gap-1 rounded-md bg-(--color-accent) px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {grantingEmail === entry.email ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : null}
                              Grant
                            </button>
                          )}
                          {entry.status === "converted" && (
                            <button
                              type="button"
                              onClick={() => void revokeAccess(entry.email)}
                              disabled={revokingEmail === entry.email}
                              className="inline-flex items-center gap-1 rounded-md bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {revokingEmail === entry.email ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : null}
                              Revoke
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
        </section>
      </div>
    </PageShell>
  );
};

export default AdminPage;
