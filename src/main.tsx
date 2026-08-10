import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { HideRulesProvider } from "./lib/hooks/useHideRules.tsx";
import { ReadTrackingProvider } from "./lib/hooks/useReadTracking.tsx";
import "./styles/index.css";

// biome-ignore lint/style/noNonNullAssertion: index.html always provides #root
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ReadTrackingProvider>
            <HideRulesProvider>
                <App />
            </HideRulesProvider>
        </ReadTrackingProvider>
    </StrictMode>,
);
