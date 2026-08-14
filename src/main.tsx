import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { CategoryVisibilityProvider } from "./lib/hooks/useCategoryVisibility.tsx";
import { HideRulesProvider } from "./lib/hooks/useHideRules.tsx";
import { ReadLaterProvider } from "./lib/hooks/useReadLater.tsx";
import { ReadTrackingProvider } from "./lib/hooks/useReadTracking.tsx";
import { RemovedEntriesProvider } from "./lib/hooks/useRemovedEntries.tsx";
import { ThemeProvider } from "./lib/hooks/useTheme.tsx";
import "./styles/index.css";

// biome-ignore lint/style/noNonNullAssertion: index.html always provides #root
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <ReadTrackingProvider>
                <HideRulesProvider>
                    <ReadLaterProvider>
                        <RemovedEntriesProvider>
                            <CategoryVisibilityProvider>
                                <App />
                            </CategoryVisibilityProvider>
                        </RemovedEntriesProvider>
                    </ReadLaterProvider>
                </HideRulesProvider>
            </ReadTrackingProvider>
        </ThemeProvider>
    </StrictMode>,
);
