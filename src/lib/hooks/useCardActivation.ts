import { useEffect, useRef } from "react";
import { safeExternalUrl } from "../url/externalUrl";
import { useOpenEntryDetail } from "./useOpenEntryDetail";

const DOUBLE_CLICK_GUARD_MS = 300;

interface UseCardActivationOptions {
    url: string;
    /** Skip activation, e.g. right after a swipe-to-delete drag released. */
    wasDragged?: () => boolean;
}

interface UseCardActivationResult {
    handleClick: () => void;
    handleDoubleClick: () => void;
}

/**
 * Shared "click the row to open its detail page, double-click to open the
 * original article" behavior for an entry card, so the whole row (not just
 * its title) acts as the hit area. A click schedules the detail navigation
 * after a short delay instead of firing it immediately, so that a dblclick
 * landing shortly after (browsers always fire click, click, dblclick in that
 * order) can still cancel it in favor of opening the original article.
 */
export function useCardActivation({
    url,
    wasDragged,
}: UseCardActivationOptions): UseCardActivationResult {
    const openDetail = useOpenEntryDetail();
    const pendingNavigateRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    useEffect(() => {
        return () => {
            if (pendingNavigateRef.current) {
                clearTimeout(pendingNavigateRef.current);
            }
        };
    }, []);

    const handleClick = () => {
        if (wasDragged?.()) {
            return;
        }
        if (pendingNavigateRef.current) {
            clearTimeout(pendingNavigateRef.current);
        }
        pendingNavigateRef.current = setTimeout(() => {
            pendingNavigateRef.current = null;
            openDetail(url);
        }, DOUBLE_CLICK_GUARD_MS);
    };

    const handleDoubleClick = () => {
        if (wasDragged?.()) {
            return;
        }
        if (pendingNavigateRef.current) {
            clearTimeout(pendingNavigateRef.current);
            pendingNavigateRef.current = null;
        }
        const href = safeExternalUrl(url);
        if (href) {
            window.open(href, "_blank", "noopener,noreferrer");
        }
    };

    return { handleClick, handleDoubleClick };
}
