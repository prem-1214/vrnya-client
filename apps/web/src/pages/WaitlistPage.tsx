import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogIn, Search, Eye, MessageSquare } from "lucide-react";
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

      <section className="waitlist-hero">
        <div className="waitlist-pill">Early access for Vrnya Web</div>
        <h1>Search, preview, and chat with your documents.</h1>
        <p>
          Vrnya is an AI-powered web workspace that helps you find the right
          document faster, review context quickly, and ask better questions in
          one place.
        </p>

        <div className="waitlist-hero__actions">
          <a className="waitlist-button waitlist-button--primary" href="#join">
            Join Waitlist
            <ArrowRight size={16} />
          </a>
          <Link className="waitlist-button waitlist-button--secondary" to="/login">
            Go to Login
          </Link>
        </div>

        <div className="waitlist-hero__note">
          Early access is limited while we shape the first public web
          experience.
        </div>
      </section>

      <section className="waitlist-features" id="features">
        <article className="waitlist-card glass">
          <div className="waitlist-card__icon">
            <Search size={20} />
          </div>
          <h2>Smarter Search</h2>
          <p>
            Search across your workspace with context-aware results that help
            you reach the right page, not just the right keyword.
          </p>
        </article>

        <article className="waitlist-card glass">
          <div className="waitlist-card__icon">
            <Eye size={20} />
          </div>
          <h2>Fast Web Previews</h2>
          <p>
            Review the right document faster with clean previews that let you
            scan context before opening the full file.
          </p>
        </article>

        <article className="waitlist-card glass">
          <div className="waitlist-card__icon">
            <MessageSquare size={20} />
          </div>
          <h2>Natural Chat</h2>
          <p>
            Ask follow-up questions, explore ideas, and understand your
            documents through a simple, direct chat experience.
          </p>
        </article>
      </section>

      <section className="waitlist-cta glass" id="join">
        <h2>Ready to try Vrnya on the web?</h2>
        <p>
          Join the waitlist to get early access, share feedback, and help shape
          how Vrnya works for web-based document workflows.
        </p>
        <div className="waitlist-cta__actions">
          <a className="waitlist-button waitlist-button--primary" href="mailto:hello@vrnya.com?subject=Vrnya%20Waitlist">
            Join Waitlist
          </a>
          <Link className="waitlist-button waitlist-button--secondary" to="/login">
            Existing user? Login
          </Link>
        </div>
      </section>
    </main>
  );
};

export default WaitlistPage;
