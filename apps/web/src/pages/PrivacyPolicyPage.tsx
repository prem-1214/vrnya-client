import React from "react";
import { Link } from "react-router-dom";
import SeoMeta from "../components/seo/SeoMeta";
import { LogIn } from "lucide-react";

const glassNav =
  "border border-(--glass-border) bg-(--glass-bg) [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <main className="relative h-full min-h-screen overflow-y-auto overflow-x-hidden overscroll-y-contain bg-(--color-bg-primary) p-4 font-sans md:p-8">
      <SeoMeta
        title="Privacy Policy - Vrnya"
        description="Privacy Policy for Vrnya, the AI-powered workspace for your documents."
        canonical="https://vrnya.vercel.app/privacy-policy"
        robots="index,follow"
      />
      <div
        className="pointer-events-none fixed -left-[100px] -top-[100px] z-0 h-[500px] w-[500px] rounded-full opacity-25 blur-[100px] [background:radial-gradient(circle,var(--color-accent)_0%,transparent_70%)]"
        aria-hidden
      />

      <header
        className={`sticky top-5 z-50 mx-auto mb-16 flex max-w-[1200px] items-center justify-between rounded-[20px] px-6 py-3 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)] ${glassNav}`}
      >
        <Link
          to="/"
          className="bg-linear-to-br from-(--color-text-primary) to-indigo-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent no-underline"
        >
          Vrnya
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <Link
            className="text-[0.95rem] font-medium text-(--color-text-secondary) no-underline transition-colors hover:text-(--color-text-primary)"
            to="/waitlist"
          >
            Waitlist
          </Link>
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

      <div className="relative z-1 mx-auto max-w-[800px] rounded-3xl p-8 lg:p-12 shadow-sm border border-white/20 bg-white/40">
        <h1 className="mb-8 text-4xl font-bold text-(--color-text-primary)">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-(--color-text-secondary) leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              1. Introduction
            </h2>
            <p>
              Welcome to Vrnya ("we," "our," or "us"). We respect your privacy
              and are committed to protecting it through our compliance with
              this policy. This Privacy Policy outlines our practices regarding
              the collection, use, and disclosure of information when you use
              our web application, tools, and services (collectively, the
              "Services").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              2. Information We Collect
            </h2>
            <p>
              We collect several types of information from and about users of
              our Services, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Personal Data:</strong> Information by which you may be
                personally identified, such as name, email address, or
                authentication data provided through Google OAuth.
              </li>
              <li>
                <strong>Document Data:</strong> Content, documents, and files
                you upload or interact with using our AI workspace. All document
                data is processed to provide search, chat, and preview
                capabilities.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about your interaction
                with the Services, such as IP addresses, browser types, and
                usage patterns.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              3. How We Use Your Information
            </h2>
            <p>
              We use information that we collect about you or that you provide
              to us:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To present our Services and their contents to you.</li>
              <li>
                To provide, maintain, and improve the quality of our AI models
                and workspace functionalities.
              </li>
              <li>
                To communicate with you about your account, updates, or customer
                support.
              </li>
              <li>To fulfill any other purpose for which you provide it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              4. Data Security
            </h2>
            <p>
              We have implemented rigorous measures designed to secure your
              personal information and documents from accidental loss and from
              unauthorized access, use, alteration, and disclosure. However, no
              internet-based service can be 100% secure, and we cannot guarantee
              the absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              5. Third-Party Services
            </h2>
            <p>
              Our Services rely on specific third-party providers (like vector
              databases, cloud storage providers, and AI language models). These
              providers are carefully vetted and only process data in accordance
              with our instructions to facilitate the core features of Vrnya.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              6. Changes to Our Privacy Policy
            </h2>
            <p>
              We may update our privacy policy from time to time. If we make
              material changes to how we treat our users' personal information,
              we will notify you through a notice on the Service's home page or
              via email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              7. Contact Information
            </h2>
            <p>
              To ask questions or comment about this privacy policy and our
              privacy practices, contact us via email.
            </p>
          </section>

          <footer className="mt-12 border-t border-white/20 pt-8">
            <div className="flex justify-center gap-4">
              <Link
                to="/privacy-policy"
                className="text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-sm text-(--color-text-secondary)">•</span>
              <Link
                to="/terms-of-service"
                className="text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;
