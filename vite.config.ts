import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    base: "/",
    clearScreen: false,
    plugins: [
        react(),
        tailwindcss(),
        // Runs worker/index.ts on workerd during `vite dev`/`vite build`, so
        // the API route and Cache API behave the same as in production.
        cloudflare(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "apple-touch-icon.png"],
            // /api/* is left uncached: the worker already caches upstream
            // responses (see worker/index.ts), and hot entries are meant to
            // stay fresh rather than be served from a stale SW cache.
            workbox: {
                navigateFallbackDenylist: [/^\/api\//],
            },
            manifest: {
                name: "hateview",
                short_name: "hateview",
                description:
                    "はてなブックマークの人気エントリを閲覧するためのビューア",
                lang: "ja",
                start_url: "/",
                scope: "/",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#1d4ed8",
                icons: [
                    {
                        src: "/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
        }),
    ],
    server: {
        port: process.env.PORT ? Number(process.env.PORT) : 5173,
    },
});
