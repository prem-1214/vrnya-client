import React from "react";

interface PageShellProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  contentClassName?: string;
}

const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  actions,
  children,
  bodyClassName = "",
  contentClassName = "",
}) => {
  return (
    <section className="flex h-full min-h-0 flex-col" aria-label={`${title} page`}>
      <header className="z-10 flex items-center justify-between rounded-t-xl border-b border-(--glass-border) bg-(--header-bg) px-8 py-4 [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]">
        <div>
          <h1 className="text-md font-bold text-(--color-text-primary)">{title}</h1>
          <p className="text-xs text-(--color-text-muted)">{subtitle}</p>
        </div>
        {actions ? <div className="flex items-center gap-4">{actions}</div> : null}
      </header>

      <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
        <div className={`mx-auto w-full ${contentClassName}`}>{children}</div>
      </div>
    </section>
  );
};

export default PageShell;
