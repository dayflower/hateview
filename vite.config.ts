import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { hatenaDevPlugin } from "./pipeline/vite-plugin-hatena-dev.ts";

// https://vite.dev/config/
export default defineConfig({
    base: "/",
    plugins: [react(), tailwindcss(), hatenaDevPlugin()],
    server: {
        port: process.env.PORT ? Number(process.env.PORT) : 5173,
    },
    test: {
        environment: "jsdom",
    },
});
