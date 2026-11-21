import { useEffect } from "react";
import { isTextEntryFocused } from "./useKeyboardNav";

/** `z` alone, or Ctrl/Cmd+Z; Shift is left alone since Shift+Ctrl/Cmd+Z is
 *  conventionally redo. */
export function isUndoReadKey(event: KeyboardEvent): boolean {
    if (event.key.toLowerCase() !== "z" || event.shiftKey || event.altKey) {
        return false;
    }
    return !(event.ctrlKey && event.metaKey);
}

/**
 * Binds the undo-read shortcut for as long as the calling page is mounted.
 * Kept apart from useKeyboardNav because undo must still work when the list
 * is empty, which is exactly what marking the last visible entry read under
 * "hide read" leaves behind.
 */
export function useUndoReadShortcut(onUndo: () => void): void {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (
                event.isComposing ||
                isTextEntryFocused() ||
                !isUndoReadKey(event)
            ) {
                return;
            }
            event.preventDefault();
            onUndo();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onUndo]);
}
