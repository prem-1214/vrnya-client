import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            )
              return "react-vendor";
            if (id.includes("framer-motion")) return "framer";
            if (id.includes("docx-preview")) return "docx";
            if (id.includes("react-markdown") || id.includes("remark"))
              return "markdown";
            if (id.includes("lucide")) return "icons";
            return "vendor";
          }
        },
      },
    },
  },
});
