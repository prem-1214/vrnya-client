import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import SeoMeta from "../components/seo/SeoMeta";

const NotFoundPage: React.FC = () => {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--color-bg-primary) p-6">
            <SeoMeta
                title="404 - Page Not Found | Vrnya"
                description="The page you are looking for does not exist."
                canonical="https://vrnya.tech/waitlist"
                robots="noindex,nofollow"
            />

            <div
                className="pointer-events-none absolute -left-[120px] -top-[120px] h-[420px] w-[420px] rounded-full opacity-20 blur-[90px] [background:radial-gradient(circle,var(--color-accent)_0%,transparent_70%)]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -bottom-[160px] -right-[120px] h-[420px] w-[420px] rounded-full opacity-15 blur-[90px] [background:radial-gradient(circle,var(--color-success)_0%,transparent_70%)]"
                aria-hidden
            />

            <section className="glass relative z-10 mx-auto flex w-full max-w-[620px] flex-col items-center rounded-3xl border border-(--glass-border) px-8 py-12 text-center shadow-(--shadow-lg)">
                <span className="mb-3 rounded-full bg-(--color-accent-subtle) px-3 py-1 text-xs font-semibold uppercase tracking-wider text-(--color-accent)">
                    Error 404
                </span>
                <h1 className="mb-3 text-4xl font-bold text-(--color-text-primary)">
                    Page not found
                </h1>
                <p className="mb-8 max-w-[480px] text-sm leading-relaxed text-(--color-text-secondary)">
                    This route does not exist or may have been moved. You can
                    return to the main workspace safely.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-xl bg-(--color-accent) px-5 py-3 text-sm font-semibold text-white no-underline transition-all duration-200 hover:bg-(--color-accent-hover) hover:shadow-(--shadow-accent)">
                        <Home size={16} />
                        Go to main page
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-bg-surface) px-5 py-3 text-sm font-semibold text-(--color-text-primary) transition-colors duration-200 hover:bg-(--color-bg-hover)">
                        <ArrowLeft size={16} />
                        Go back
                    </button>
                </div>
            </section>
        </main>
    );
};

export default NotFoundPage;
