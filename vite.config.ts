import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { hatenaDevPlugin } from "./pipeline/vite-plugin-hatena-dev.ts";

// https://vite.dev/config/
export default defineConfig({
    base: "/hateview/",
    plugins: [react(), tailwindcss(), hatenaDevPlugin()],
    test: {
        environment: "jsdom",
    },
});
