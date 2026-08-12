import { useEffect, useRef, useState } from "react";

interface UseConfirmActionResult {
    confirming: boolean;
    /** Arms the confirm window on the first call; runs `action` and returns
     *  `true` on a call made while already armed (and `false` otherwise). */
    trigger: () => boolean;
}

/**
 * A two-click confirm: the first `trigger()` call arms a `timeoutMs` window
 * (after which it disarms itself) instead of running `action`; a second call
 * made within that window runs `action` and reports it via the return value,
 * so callers can react only to the click that actually fired.
 */
export function useConfirmAction(
    action: () => void,
    timeoutMs: number,
): UseConfirmActionResult {
    const [confirming, setConfirming] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    const trigger = (): boolean => {
        if (confirming) {
            clearTimeout(timeoutRef.current);
            action();
            return true;
        }
        setConfirming(true);
        timeoutRef.current = setTimeout(() => setConfirming(false), timeoutMs);
        return false;
    };

    return { confirming, trigger };
}
