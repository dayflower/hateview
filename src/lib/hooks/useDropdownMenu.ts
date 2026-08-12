import {
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useEscapeKey } from "./useEscapeKey";

interface MenuPosition {
    top: number;
    right: number;
}

interface UseDropdownMenuResult {
    open: boolean;
    position: MenuPosition | null;
    buttonRef: RefObject<HTMLButtonElement | null>;
    contentRef: RefObject<HTMLDivElement | null>;
    toggle: () => void;
    close: () => void;
}

/**
 * Owns a button-triggered dropdown's open state and fixed position (computed
 * from the trigger button's rect, so the dropdown can be portaled outside an
 * `overflow: hidden` ancestor). Closes itself on an outside click, Escape, or
 * scroll.
 */
export function useDropdownMenu(): UseDropdownMenuResult {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<MenuPosition | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setOpen(false), []);

    const toggle = useCallback(() => {
        if (open) {
            close();
            return;
        }
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
            setPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
            });
        }
        setOpen(true);
    }, [open, close]);

    useEscapeKey(close, open);

    useEffect(() => {
        if (!open) {
            return;
        }
        const closeOnOutsideEvent = (event: Event) => {
            const target = event.target as Node;
            if (buttonRef.current?.contains(target)) {
                return;
            }
            if (contentRef.current?.contains(target)) {
                return;
            }
            close();
        };
        document.addEventListener("mousedown", closeOnOutsideEvent);
        window.addEventListener("scroll", closeOnOutsideEvent, true);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideEvent);
            window.removeEventListener("scroll", closeOnOutsideEvent, true);
        };
    }, [open, close]);

    return { open, position, buttonRef, contentRef, toggle, close };
}
