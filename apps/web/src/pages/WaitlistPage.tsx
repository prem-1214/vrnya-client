import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogIn, Search, Eye, MessageSquare, ChevronDown } from "lucide-react";
import { joinWaitlist, type Profession } from "../api/client";
import "./WaitlistPage.css";

const WaitlistPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState<Profession>(
    "working_professional",
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        <div className="waitlist-nav__brand">Vrnya</div>
        <nav className="waitlist-nav__links" aria-label="Primary">
          <a href="#features">Search</a>
          <a href="#features">Preview</a>
          <a href="#features">Chat</a>
        </nav>
        <div className="waitlist-nav__actions">
          <Link className="waitlist-nav__login" to="/login">
            <LogIn size={16} />
            Login
          </Link>
        </div>
      </header>

      <div className="waitlist-container">
        <section className="waitlist-hero">
          <div className="waitlist-hero__content">
            <div className="waitlist-pill">Beta Access Now Open</div>
            <h1>Search, preview, and chat with your documents.</h1>
            <p className="waitlist-hero__subtext">
              Vrnya is an AI-powered workspace that helps you find documentation
              at the speed of thought. Join the waitlist for the next wave of
              early users.
            </p>
          </div>

          <div className="waitlist-onboarding glass">
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

            <div className="waitlist-onboarding__footer">
              <Link to="/login">Existing user? Login</Link>
            </div>
          </div>
        </section>

        <section className="waitlist-features" id="features">
          <article className="waitlist-card glass">
            <div className="waitlist-card__icon">
              <Search size={20} />
            </div>
            <h2>Smarter Search</h2>
            <p>Find exactly what you need with context-aware indexing.</p>
          </article>

          <article className="waitlist-card glass">
            <div className="waitlist-card__icon">
              <Eye size={20} />
            </div>
            <h2>Fast Previews</h2>
            <p>Review documents instantly without leaving your workspace.</p>
          </article>

          <article className="waitlist-card glass">
            <div className="waitlist-card__icon">
              <MessageSquare size={20} />
            </div>
            <h2>Natural Chat</h2>
            <p>Interact with your codebase and documents using AI.</p>
          </article>
        </section>
      </div>
    </main>
  );
};

export default WaitlistPage;
