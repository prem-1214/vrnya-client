import React from "react";
import { Link } from "react-router-dom";
import { LogIn, Search, Eye, MessageSquare } from "lucide-react";
import LoginModal from "../components/LoginModal";
import "./WaitlistPage.css";

const WaitlistPage: React.FC = () => {
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
              at the speed of thought. Join to start utilizing the full context 
              of your workspace.
            </p>
          </div>

          <div className="waitlist-login-wrapper">
            <LoginModal />
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
