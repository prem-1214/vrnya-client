import "@testing-library/jest-dom";
import { createElement } from "react";
import { vi } from "vitest";

// Mock window.electronAPI so component tests don't need Electron
Object.defineProperty(window, "electronAPI", {
  value: {
    openPath: vi.fn().mockResolvedValue(null),
    showInFolder: vi.fn().mockResolvedValue(null),
  },
  writable: true,
});

// Silence framer-motion in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => createElement("div", props, children),
  },
}));
