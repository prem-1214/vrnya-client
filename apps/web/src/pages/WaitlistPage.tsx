import React from "react";
import { Link } from "react-router-dom";
import { LogIn, Search, Eye, MessageSquare } from "lucide-react";
import LoginModal from "../components/LoginModal";

const glassNav =
  "border border-(--glass-border) bg-(--glass-bg) [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]";

const featureCardClass = `${glassNav} rounded-3xl border-white/30 bg-white/40 p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-white/60 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`;

const WaitlistPage: React.FC = () => {
  return (
    <main className="relative h-full min-h-screen overflow-y-auto overflow-x-hidden overscroll-y-contain bg-(--color-bg-primary) p-4 font-sans md:p-8">
      <div
        className="pointer-events-none fixed -left-[100px] -top-[100px] z-0 h-[500px] w-[500px] rounded-full opacity-25 blur-[100px] [background:radial-gradient(circle,var(--color-accent)_0%,transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -bottom-[150px] -right-[100px] z-0 h-[500px] w-[500px] rounded-full opacity-25 blur-[100px] [background:radial-gradient(circle,#34d399_0%,transparent_70%)]"
        aria-hidden
      />

      <header
        className={`sticky top-5 z-50 mx-auto mb-16 flex max-w-[1200px] items-center justify-between rounded-[20px] px-6 py-3 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)] ${glassNav}`}
      >
        <div className="bg-linear-to-br from-(--color-text-primary) to-indigo-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          Vrnya
        </div>
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Primary"
        >
          <a
            className="text-[0.95rem] font-medium text-(--color-text-secondary) no-underline transition-colors hover:text-(--color-text-primary)"
            href="#features"
          >
            Search
          </a>
          <a
            className="text-[0.95rem] font-medium text-(--color-text-secondary) no-underline transition-colors hover:text-(--color-text-primary)"
            href="#features"
          >
            Preview
          </a>
          <a
            className="text-[0.95rem] font-medium text-(--color-text-secondary) no-underline transition-colors hover:text-(--color-text-primary)"
            href="#features"
          >
            Chat
          </a>
        </nav>
        <div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[0.95rem] font-semibold text-(--color-text-primary) no-underline transition-colors hover:bg-black/4"
            to="/login"
          >
            <LogIn size={16} />
            Login
          </Link>
        </div>
      </header>

      <div className="relative z-1 mx-auto max-w-[1200px]">
        <section className="flex flex-col items-center gap-12 py-12 pb-24 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:text-left">
          <div className="w-full max-w-[620px] flex-1">
            <div className="mb-6 inline-flex rounded-full bg-indigo-500/10 px-3.5 py-1.5 text-[0.85rem] font-semibold text-indigo-500">
              Beta Access Now Open
            </div>
            <h1 className="mb-6 text-[clamp(2.5rem,5vw,4.2rem)] font-bold leading-[1.1] tracking-[-0.04em] text-(--color-text-primary)">
              Search, preview, and chat with your documents.
            </h1>
            <p className="mb-8 text-xl leading-relaxed text-(--color-text-secondary)">
              Vrnya is an AI-powered workspace that helps you find documentation
              at the speed of thought. Join to start utilizing the full context
              of your workspace.
            </p>
          </div>

          <div className="w-full max-w-[460px] shrink-0">
            <LoginModal />
          </div>
        </section>

        <section
          className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-3"
          id="features"
        >
          <article className={featureCardClass}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-(--color-accent) shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <Search size={20} />
            </div>
            <h2 className="mb-3 text-xl font-semibold text-(--color-text-primary)">
              Smarter Search
            </h2>
            <p className="leading-relaxed text-(--color-text-secondary)">
              Find exactly what you need with context-aware indexing.
            </p>
          </article>

          <article className={featureCardClass}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-(--color-accent) shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <Eye size={20} />
            </div>
            <h2 className="mb-3 text-xl font-semibold text-(--color-text-primary)">
              Fast Previews
            </h2>
            <p className="leading-relaxed text-(--color-text-secondary)">
              Review documents instantly without leaving your workspace.
            </p>
          </article>

          <article className={featureCardClass}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-(--color-accent) shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <MessageSquare size={20} />
            </div>
            <h2 className="mb-3 text-xl font-semibold text-(--color-text-primary)">
              Natural Chat
            </h2>
            <p className="leading-relaxed text-(--color-text-secondary)">
              Interact with your codebase and documents using AI.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
};

export default WaitlistPage;
