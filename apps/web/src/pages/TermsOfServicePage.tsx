import React from "react";
import { Link } from "react-router-dom";
import SeoMeta from "../components/seo/SeoMeta";
import { LogIn } from "lucide-react";

const glassNav =
  "border border-(--glass-border) bg-(--glass-bg) [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]";

const TermsOfServicePage: React.FC = () => {
  return (
    <main className="relative h-full min-h-screen overflow-y-auto overflow-x-hidden overscroll-y-contain bg-(--color-bg-primary) p-4 font-sans md:p-8">
      <SeoMeta
        title="Terms of Service - Vrnya"
        description="Terms of Service for Vrnya, the AI-powered workspace for your documents."
        canonical="https://vrnya.tech/terms-of-service"
        robots="index,follow"
      />
      <div
        className="pointer-events-none fixed -left-[100px] -top-[100px] z-0 h-[500px] w-[500px] rounded-full opacity-25 blur-[100px] [background:radial-gradient(circle,var(--color-accent)_0%,transparent_70%)]"
        aria-hidden
      />

      <header
        className={`sticky top-5 z-50 mx-auto mb-16 flex max-w-[1200px] items-center justify-between rounded-[20px] px-6 py-0 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)] ${glassNav}`}
      >
        <div className="flex items-center">
          <Link to="/" className="no-underline flex items-center">
            <img src="/Vrnya-logo.png" alt="Vrnya" className="navbar-logo" />
          </Link>
        </div>
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
          Terms of Service
        </h1>

        <div className="space-y-6 text-(--color-text-secondary) leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using Vrnya (the "Services"), you agree to be
              bound by these Terms of Service. If you disagree with any part of
              the terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              2. Description of Service
            </h2>
            <p>
              Vrnya is an AI-powered workspace application that allows users to
              upload, search, preview, and chat with their documents. We grant
              you a personal, non-exclusive, non-transferable, limited privilege
              to enter and use the Site and Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              3. User Accounts
            </h2>
            <p>
              When you create an account with us, you must provide accurate,
              complete, and updated information at all times. Failure to do so
              constitutes a breach of the Terms, which may result in immediate
              termination of your account on our Service. You are responsible
              for safeguarding the password and authentication methods that you
              use to access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              4. Intellectual Property
            </h2>
            <p>
              The Service and its original content (excluding content provided
              by users), features, and functionality are and will remain the
              exclusive property of Vrnya and its licensors. You retain all of
              your ownership rights in your documents and files that you upload
              to the Service. By uploading content, you grant us a license to
              use, process, and store that content solely for the purpose of
              providing the Services to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              5. Acceptable Use
            </h2>
            <p>You agree not to use the Services in a way that:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Violates any national or international law or regulation.</li>
              <li>
                Infringes upon the rights of others, or is offensive,
                threatening, or fraudulent.
              </li>
              <li>
                Attempts to interfere with or disrupt the integrity or
                performance of the Service.
              </li>
              <li>
                Involves uploading malicious code, viruses, or harmful data.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              6. Limitation of Liability
            </h2>
            <p>
              In no event shall Vrnya, nor its directors, employees, partners,
              agents, suppliers, or affiliates, be liable for any indirect,
              incidental, special, consequential, or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses, resulting from your access to or use of or
              inability to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              7. Changes to Terms
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. By continuing to access or use our
              Service after those revisions become effective, you agree to be
              bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              8. Warranties Disclaimer
            </h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We
              make no warranties, expressed or implied, and hereby disclaim and
              negate all other warranties including, without limitation, implied
              warranties of merchantability, fitness for a particular purpose,
              title, and non-infringement of third-party intellectual property
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              9. Termination
            </h2>
            <p>
              We may terminate or suspend your account and access to the Service
              immediately, without prior notice or liability, for any reason
              whatsoever, including if you breach the Terms of Service. Upon
              termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              10. Indemnification
            </h2>
            <p>
              You agree to defend, indemnify, and hold harmless Vrnya and its
              licensees and licensors, and their employees, contractors, agents,
              officers and directors, from and against any and all claims,
              damages, obligations, losses, liabilities, costs or debt, and
              expenses (including but not limited to attorney's fees), resulting
              from or arising out of your use and access of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              11. Severability
            </h2>
            <p>
              If any provision of these Terms is found to be unenforceable or
              invalid under applicable law, such provision shall be severed and
              the remaining provisions shall continue in full force and effect
              to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              12. Entire Agreement
            </h2>
            <p>
              These Terms of Service, together with our Privacy Policy and any
              other legal notices or policies posted on the Service, constitute
              the entire, complete, and exclusive agreement between you and
              Vrnya with respect to your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              13. Governing Law and Jurisdiction
            </h2>
            <p>
              These Terms of Service shall be governed by and construed in
              accordance with the laws of the jurisdiction in which Vrnya
              operates, without regard to its conflict of law principles. You
              agree to submit to the jurisdiction of the courts in that
              jurisdiction for any and all disputes or claims arising from these
              Terms or your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-(--color-text-primary) mb-3">
              14. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us.
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

export default TermsOfServicePage;
