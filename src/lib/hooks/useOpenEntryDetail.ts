import { useCallback } from "react";
import { entryPath } from "../../router/routes";
import { navigate } from "../../router/useHashRoute";
import { bookmarkEntryPageUrl } from "../api/hatenaBookmarkApi";
import { safeExternalUrl } from "../url/externalUrl";
import { navigateExternal } from "../url/navigateExternal";
import { useDetailTarget } from "./useDetailTarget.tsx";
import { useReadTracking } from "./useReadTracking.tsx";

/**
 * Returns the "open this entry" action every list shares, so that the
 * detail-target setting is honoured identically from a row tap, a title
 * click and keyboard selection.
 */
export function useOpenEntryDetail(): (url: string) => void {
    const { detailTarget } = useDetailTarget();
    const { markRead } = useReadTracking();

    return useCallback(
        (url: string) => {
            if (detailTarget !== "official") {
                navigate(entryPath(url));
                return;
            }
            const href = safeExternalUrl(bookmarkEntryPageUrl(url));
            if (!href) {
                return;
            }
            // The in-app detail page marks an entry read once its bookmarks
            // load; leaving for the official page never gets there, so mark
            // it here instead.
            markRead(url);
            navigateExternal(href);
        },
        [detailTarget, markRead],
    );
}
