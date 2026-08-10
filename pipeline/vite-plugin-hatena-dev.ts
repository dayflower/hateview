import type { Plugin } from "vite";
import { buildEntries } from "./build-entries.ts";
import type { EntriesFile } from "./lib/types.ts";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cached: { data: EntriesFile; fetchedAt: number } | null = null;

async function getEntries(): Promise<EntriesFile> {
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
    }
    const data = await buildEntries();
    cached = { data, fetchedAt: Date.now() };
    return data;
}

/** Serves live hotentry data at `${base}entries.json` during `vite dev`, so the dev SPA
 *  never needs a stale, manually-regenerated file. Not applied during `vite build`. */
export function hatenaDevPlugin(): Plugin {
    return {
        name: "hatena-dev-entries",
        apply: "serve",
        configureServer(server) {
            const path = `${server.config.base}entries.json`;
            server.middlewares.use(path, (_req, res) => {
                getEntries()
                    .then((data) => {
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(data));
                    })
                    .catch((err: unknown) => {
                        res.statusCode = 502;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({ error: String(err) }));
                    });
            });
        },
    };
}
