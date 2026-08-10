import { useEffect } from "react";
import { Header } from "./components/layout/Header";
import { EntryDetailPage } from "./pages/EntryDetailPage";
import { EntryListPage } from "./pages/EntryListPage";
import { ReadLaterPage } from "./pages/ReadLaterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { matchRoute } from "./router/routes";
import { redirect, useHashPath } from "./router/useHashRoute";

function App() {
    const path = useHashPath();
    const route = matchRoute(path);

    useEffect(() => {
        if (route === null) {
            redirect("/");
        }
    }, [route]);

    if (route === null) {
        return null;
    }

    return (
        <div className="min-h-svh">
            <Header route={route} />
            <main>
                {route.name === "list" && <EntryListPage />}
                {route.name === "entry" && <EntryDetailPage url={route.url} />}
                {route.name === "later" && <ReadLaterPage />}
                {route.name === "settings" && <SettingsPage />}
            </main>
        </div>
    );
}

export default App;
