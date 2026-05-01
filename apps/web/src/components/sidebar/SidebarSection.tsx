import React from "react";
import { ChevronDown } from "lucide-react";

interface SidebarSectionProps {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  id,
  title,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <section className="min-h-0">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-(--color-bg-hover)"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <span className="text-[12px] font-bold uppercase tracking-wider text-(--color-text-muted)">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-(--color-text-muted) transition-transform ${isOpen ? "" : "-rotate-90"}`}
        />
      </button>

      {isOpen && (
        <div id={id} className="min-h-0">
          {children}
        </div>
      )}
    </section>
  );
};

export default SidebarSection;
