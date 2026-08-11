import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    base: "/",
    plugins: [
        react(),
        tailwindcss(),
        // Runs worker/index.ts on workerd during `vite dev`/`vite build`, so
        // the API route and Cache API behave the same as in production.
        cloudflare(),
    ],
    server: {
        port: process.env.PORT ? Number(process.env.PORT) : 5173,
    },
});
