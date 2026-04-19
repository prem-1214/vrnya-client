import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Eye,
  MessageSquare,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import "./WaitlistPage.css";
import type { Profession } from "./api/client";
import { joinWaitlist } from "./api/client";

const WaitlistPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState<Profession>(
    "working_professional",
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's an auth error from Google login attempt
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setAuthError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const professionOptions = [
    { value: "student", label: "Student" },
    { value: "working_professional", label: "Working Professional" },
    { value: "startup", label: "Startup Founder" },
  ];

  const currentProfessionLabel = professionOptions.find(
    (opt) => opt.value === profession,
  )?.label;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await joinWaitlist({
        email,
        profession,
        source: "vrnya-web-waitlist",
      });

      setMessage(response.message);
      if (!response.alreadyJoined) {
        setEmail("");
      }
    } catch (submitError) {
      const nextError =
        submitError instanceof Error
          ? submitError.message
          : "Unable to join the waitlist right now.";
      setError(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="waitlist-page">
      <div className="waitlist-page__glow waitlist-page__glow--left" />
      <div className="waitlist-page__glow waitlist-page__glow--right" />

      <header className="waitlist-nav glass">
        <div className="waitlist-nav__brand">
          <img
            src="/Vrnya-logo.png"
            alt="Vrnya Logo"
            className="waitlist-logo"
          />
        </div>
        <nav className="waitlist-nav__links" aria-label="Primary">
          <a href="#features">Search</a>
          <a href="#features">Preview</a>
          <a href="#features">Chat</a>
        </nav>
        {/* <div className="waitlist-nav__actions">
          <Link className="waitlist-nav__login" to="/login">
            <LogIn size={16} />
            Login
          </Link>
        </div> */}
      </header>

      <div className="waitlist-container">
        <section className="waitlist-hero">
          <div className="waitlist-hero__content">
            <div className="waitlist-pill">
              Currently in beta — join the waitlist for early access.
            </div>
            <h1>Ask anything from your documents</h1>
            <p className="waitlist-hero__subtext">
              Upload your PDFs, reports, and notes. Search across all of them.
              Get exact answers with the source highlighted. No more opening
              files one by one.
            </p>
          </div>

          <div className="waitlist-onboarding glass">
            {authError ? (
              <div className="waitlist-form" style={{ padding: "2rem" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                      color: "#ef4444",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                    }}
                  >
                    <AlertCircle size={24} />
                    <span>Beta Access Required</span>
                  </div>

                  <p
                    style={{
                      fontSize: "1rem",
                      lineHeight: "1.6",
                      color: "var(--color-text-secondary)",
                      maxWidth: "450px",
                    }}
                  >
                    {authError}
                  </p>

                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Join the waitlist below to get notified when beta access
                    opens up! 🚀
                  </p>

                  <button
                    onClick={() => {
                      setAuthError(null);
                      // Scroll to the form
                      const formElement =
                        document.querySelector("form.waitlist-form");
                      if (formElement) {
                        formElement.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "var(--color-accent)",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Join the Waitlist
                  </button>
                </div>
              </div>
            ) : (
              <form className="waitlist-form" onSubmit={handleSubmit}>
                <div className="waitlist-form__header">
                  <h2>Join the waitlist</h2>
                  <p>Enter your details to get early access.</p>
                </div>

                <div className="waitlist-form__fields">
                  <label className="waitlist-field">
                    <span>Email address</span>
                    <input
                      autoComplete="email"
                      name="email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@work.com"
                      required
                      type="email"
                      value={email}
                    />
                  </label>

                  <label className="waitlist-field">
                    <span>I am a...</span>
                    <div className="waitlist-select__wrapper" ref={dropdownRef}>
                      <div
                        className={`waitlist-select__trigger ${isDropdownOpen ? "active" : ""}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <span>{currentProfessionLabel}</span>
                        <ChevronDown
                          className="waitlist-select__icon"
                          size={18}
                        />
                      </div>

                      {isDropdownOpen && (
                        <ul className="waitlist-select__options glass">
                          {professionOptions.map((option) => (
                            <li
                              key={option.value}
                              className={`waitlist-select__option ${profession === option.value ? "selected" : ""}`}
                              onClick={() => {
                                setProfession(option.value as Profession);
                                setIsDropdownOpen(false);
                              }}
                            >
                              {option.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                </div>

                <button
                  className="waitlist-button waitlist-button--primary"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Joining..." : "Get Early Access"}
                </button>

                {message && (
                  <div className="waitlist-form__message" role="status">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="waitlist-form__error" role="alert">
                    {error}
                  </div>
                )}
              </form>
            )}

            {/* <div className="waitlist-onboarding__footer">
              <Link to="/login">Existing user? Login</Link>
            </div> */}
          </div>
        </section>

        <section className="waitlist-features" id="features">
          <article className="waitlist-card glass">
            <div className="waitlist-card__icon">
              <Search size={20} />
            </div>
            <h2>Semantic Search</h2>
            <p>
              Find the exact paragraph you're looking for across all your
              uploaded files, not just the file name.
            </p>
          </article>

          <article className="waitlist-card glass">
            <div className="waitlist-card__icon">
              <Eye size={20} />
            </div>
            <h2>Document Viewer</h2>
            <p>
              See exactly where the answer came from, highlighted inside the
              original document.
            </p>
          </article>

          <article className="waitlist-card glass">
            <div className="waitlist-card__icon">
              <MessageSquare size={20} />
            </div>
            <h2>AI Chat</h2>
            <p>
              Ask questions across all your files and get answers with exact
              source citations instantly.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
};

export default WaitlistPage;
