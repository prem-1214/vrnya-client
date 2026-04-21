import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Eye,
  MessageSquare,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

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
    <main className="relative h-full min-h-screen overflow-y-auto overflow-x-hidden pt-8 px-4 md:px-8 pb-8 bg-[var(--color-bg)] font-sans overscroll-y-contain">
      <div className="fixed w-[500px] h-[500px] rounded-full blur-[100px] opacity-25 pointer-events-none z-0 -top-[100px] -left-[100px] bg-[radial-gradient(circle,var(--color-accent)_0%,transparent_70%)]" />
      <div className="fixed w-[500px] h-[500px] rounded-full blur-[100px] opacity-25 pointer-events-none z-0 -bottom-[150px] -right-[100px] bg-[radial-gradient(circle,#34d399_0%,transparent_70%)]" />

      <header className="sticky top-[20px] z-50 flex items-center justify-between w-full max-w-[1200px] mx-auto mb-16 px-6 py-0 rounded-[25px] bg-white/95 backdrop-blur-[6px] border border-white/40 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)] h-[70px]">
        <div className="text-[1.4rem] font-extrabold tracking-[-0.03em] bg-gradient-to-br from-[var(--color-text-primary)] to-[#6366f1] bg-clip-text text-transparent">
          <img
            src="/Vrnya-logo.png"
            alt="Vrnya Logo"
            className="h-[70px] w-auto object-contain transition-[height] duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:opacity-80"
          />
        </div>
        <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
          <a href="#features" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors duration-200 hover:text-[var(--color-text-primary)]">Search</a>
          <a href="#features" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors duration-200 hover:text-[var(--color-text-primary)]">Preview</a>
          <a href="#features" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors duration-200 hover:text-[var(--color-text-primary)]">Chat</a>
        </nav>
      </header>

      <div className="relative z-10 w-full max-w-[1200px] mx-auto">
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 py-12 pb-24 text-center lg:text-left">
          <div className="flex-1 w-full max-w-[620px] lg:max-w-none">
            <div className="inline-flex px-3.5 py-1.5 bg-[#6366f1]/10 text-[#6366f1] font-semibold text-[0.85rem] rounded-full mb-6 relative">
              Currently in beta — join the waitlist for early access.
            </div>
            <h1 className="text-[clamp(2.5rem,5vw,4.2rem)] leading-[1.1] tracking-[-0.04em] mb-6 text-[var(--color-text-primary)] font-bold">
              Ask anything from your documents
            </h1>
            <p className="text-xl leading-[1.6] text-[var(--color-text-secondary)] mb-8">
              Upload your PDFs, reports, and notes. Search across all of them.
              Get exact answers with the source highlighted. No more opening
              files one by one.
            </p>
          </div>

          <div className="w-full max-w-[500px] lg:max-w-[440px] mx-auto bg-white/95 backdrop-blur-[6px] border border-white/40 rounded-[32px] p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)]">
            {authError ? (
              <div className="p-8">
                <div className="flex flex-col gap-6 items-center text-center">
                  <div className="flex items-center justify-center gap-3 text-red-500 text-[1.1rem] font-semibold">
                    <AlertCircle size={24} />
                    <span>Beta Access Required</span>
                  </div>

                  <p className="text-base leading-[1.6] text-[var(--color-text-secondary)] max-w-[450px]">
                    {authError}
                  </p>

                  <p className="text-[0.95rem] text-[var(--color-text-secondary)]">
                    Join the waitlist below to get notified when beta access
                    opens up! 🚀
                  </p>

                  <button
                    onClick={() => {
                      setAuthError(null);
                      const formElement = document.querySelector("form");
                      if (formElement) {
                        formElement.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="mt-4 px-6 py-3 bg-[var(--color-accent)] text-white border-none rounded-lg cursor-pointer font-semibold"
                  >
                    Join the Waitlist
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-8 flex flex-col items-center">
                  <h2 className="text-[1.75rem] mb-2 font-bold text-[var(--color-text-primary)]">Join the waitlist</h2>
                  <p className="text-[var(--color-text-secondary)] text-[0.95rem]">Enter your details to get early access.</p>
                </div>

                <div className="flex flex-col gap-5 mb-6 text-left">
                  <label className="flex flex-col gap-2.5">
                    <span className="text-[0.9rem] font-semibold text-[var(--color-text-primary)]">Email address</span>
                    <input
                      autoComplete="email"
                      name="email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@work.com"
                      required
                      type="email"
                      value={email}
                      className="w-full px-[18px] py-[14px] rounded-[16px] border border-[var(--color-border)] bg-white/80 text-base text-[var(--color-text-primary)] outline-none transition-all duration-200 focus:border-slate-500 focus:ring-4 focus:ring-black/5"
                    />
                  </label>

                  <label className="flex flex-col gap-2.5">
                    <span className="text-[0.9rem] font-semibold text-[var(--color-text-primary)]">I am a...</span>
                    <div className="relative w-full" ref={dropdownRef}>
                      <div
                        className={`flex items-center justify-between w-full px-[18px] py-[14px] rounded-[16px] border border-[var(--color-border)] bg-white/80 text-base text-[var(--color-text-primary)] cursor-pointer transition-all duration-200 select-none hover:bg-white/95 hover:border-black/15 ${isDropdownOpen ? "!border-slate-500 ring-4 ring-black/5 !bg-white" : ""}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <span>{currentProfessionLabel}</span>
                        <ChevronDown
                          className={`text-slate-400 transition-all duration-200 ${isDropdownOpen ? "text-[var(--color-accent)] rotate-180" : ""}`}
                          size={18}
                        />
                      </div>

                      {isDropdownOpen && (
                        <ul className="absolute top-[calc(100%+8px)] left-0 right-0 p-2 rounded-[20px] bg-white/99 border border-white/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] list-none z-[100] animate-[dropdownEntry_0.2s_ease-out] origin-top">
                          {professionOptions.map((option) => (
                            <li
                              key={option.value}
                              className={`px-4 py-3 rounded-xl text-[0.95rem] text-[var(--color-text-secondary)] cursor-pointer transition-all duration-150 hover:bg-black/5 hover:text-[var(--color-text-primary)] ${profession === option.value ? "bg-black/10 text-[var(--color-text-primary)] font-semibold" : ""}`}
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
                  className="w-full p-4 bg-[#6366f1] text-white border-none rounded-2xl text-base font-bold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:bg-[#4f46e5] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(99,102,241,0.35)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Joining..." : "Get Early Access"}
                </button>

                {message && (
                  <div className="mt-4 p-3 rounded-xl text-[0.9rem] font-medium text-center bg-green-500/10 text-green-800" role="status">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 rounded-xl text-[0.9rem] font-medium text-center bg-red-500/10 text-red-800" role="alert">
                    {error}
                  </div>
                )}
              </form>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-24 text-left" id="features">
          <article className="p-8 rounded-[24px] bg-white/40 border border-white/30 transition-all duration-300 hover:-translate-y-2 hover:bg-white/60 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="w-12 h-12 flex items-center justify-center bg-white text-[var(--color-accent)] rounded-2xl mb-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <Search size={20} />
            </div>
            <h2 className="text-[1.25rem] mb-3 font-bold text-[var(--color-text-primary)]">Semantic Search</h2>
            <p className="text-[var(--color-text-secondary)] leading-[1.6]">
              Find the exact paragraph you're looking for across all your
              uploaded files, not just the file name.
            </p>
          </article>

          <article className="p-8 rounded-[24px] bg-white/40 border border-white/30 transition-all duration-300 hover:-translate-y-2 hover:bg-white/60 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="w-12 h-12 flex items-center justify-center bg-white text-[var(--color-accent)] rounded-2xl mb-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <Eye size={20} />
            </div>
            <h2 className="text-[1.25rem] mb-3 font-bold text-[var(--color-text-primary)]">Document Viewer</h2>
            <p className="text-[var(--color-text-secondary)] leading-[1.6]">
              See exactly where the answer came from, highlighted inside the
              original document.
            </p>
          </article>

          <article className="p-8 rounded-[24px] bg-white/40 border border-white/30 transition-all duration-300 hover:-translate-y-2 hover:bg-white/60 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="w-12 h-12 flex items-center justify-center bg-white text-[var(--color-accent)] rounded-2xl mb-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <MessageSquare size={20} />
            </div>
            <h2 className="text-[1.25rem] mb-3 font-bold text-[var(--color-text-primary)]">AI Chat</h2>
            <p className="text-[var(--color-text-secondary)] leading-[1.6]">
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
