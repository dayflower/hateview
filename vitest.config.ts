import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Separate from vite.config.ts because the Cloudflare Vite plugin there sets
// `resolve.external` in a way that's incompatible with Vitest's own
// environment setup.
export default defineConfig({
    plugins: [react(), tailwindcss()],
    test: {
        environment: "jsdom",
    },
});
