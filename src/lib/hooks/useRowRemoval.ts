import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

const SWIPE_THRESHOLD = 80;
const DRAG_TRIGGER = 5;
const SLIDE_AWAY_MS = 200;
const COLLAPSE_MS = 220;

type Phase = "idle" | "sliding" | "measuring" | "collapsing";

interface UseRowRemovalOptions {
    onRemove: () => void;
}

interface UseRowRemovalResult {
    liRef: (el: HTMLLIElement | null) => void;
    liStyle: CSSProperties | undefined;
    dragX: number;
    dragging: boolean;
    removing: boolean;
    wasDragged: () => boolean;
    dragHandlers: {
        onPointerDown: (event: PointerEvent) => void;
        onPointerMove: (event: PointerEvent) => void;
        onPointerUp: (event: PointerEvent) => void;
        onPointerCancel: (event: PointerEvent) => void;
    };
    triggerRemoval: () => void;
}

/**
 * Owns a row's full removal lifecycle:
 * - Gmail-style swipe-left-to-delete via pointer events (drag past a distance
 *   threshold, release to confirm, snap back otherwise).
 * - A `triggerRemoval` escape hatch for non-drag removal (e.g. a confirm button).
 * - A height-collapse animation shared by both paths, so sibling rows visibly
 *   slide up to fill the gap instead of the list just snapping shorter.
 */
export function useRowRemoval({
    onRemove,
}: UseRowRemovalOptions): UseRowRemovalResult {
    const [dragX, setDragX] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [phase, setPhase] = useState<Phase>("idle");
    const [measuredHeight, setMeasuredHeight] = useState(0);

    const draggingRef = useRef(false);
    const draggedRef = useRef(false);
    const startXRef = useRef(0);
    const pointerIdRef = useRef<number | null>(null);
    const elRef = useRef<HTMLLIElement | null>(null);

    function beginCollapse() {
        const height = elRef.current?.getBoundingClientRect().height ?? 0;
        setMeasuredHeight(height);
        setPhase("measuring");
    }

    function handlePointerDown(event: PointerEvent) {
        if (phase !== "idle") {
            return;
        }
        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }
        draggingRef.current = true;
        draggedRef.current = false;
        startXRef.current = event.clientX;
        pointerIdRef.current = event.pointerId;
        setDragging(true);
    }

    function handlePointerMove(event: PointerEvent) {
        if (!draggingRef.current || event.pointerId !== pointerIdRef.current) {
            return;
        }
        const delta = event.clientX - startXRef.current;
        if (Math.abs(delta) > DRAG_TRIGGER) {
            draggedRef.current = true;
        }
        setDragX(Math.min(0, delta));
    }

    function endDrag() {
        if (!draggingRef.current) {
            return;
        }
        draggingRef.current = false;
        setDragging(false);
        if (dragX < -SWIPE_THRESHOLD) {
            setDragX(-9999);
            setPhase("sliding");
        } else {
            setDragX(0);
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: onRemove intentionally excluded — it's a fresh closure each render but always calls removeEntry with the same stable url, so re-running this effect on its identity change would only harmlessly reschedule the same timeout
    useEffect(() => {
        if (phase === "sliding") {
            const timeoutId = setTimeout(beginCollapse, SLIDE_AWAY_MS);
            return () => clearTimeout(timeoutId);
        }
        if (phase === "measuring") {
            const raf = requestAnimationFrame(() => setPhase("collapsing"));
            return () => cancelAnimationFrame(raf);
        }
        if (phase === "collapsing") {
            const timeoutId = setTimeout(onRemove, COLLAPSE_MS);
            return () => clearTimeout(timeoutId);
        }
    }, [phase]);

    function triggerRemoval() {
        if (phase === "idle") {
            beginCollapse();
        }
    }

    const liStyle: CSSProperties | undefined =
        phase === "measuring"
            ? { height: measuredHeight, overflow: "hidden" }
            : phase === "collapsing"
              ? {
                    height: 0,
                    opacity: 0,
                    overflow: "hidden",
                    borderBottomWidth: 0,
                    transition: `height ${COLLAPSE_MS}ms ease, opacity ${COLLAPSE_MS}ms ease, border-bottom-width ${COLLAPSE_MS}ms ease`,
                }
              : undefined;

    return {
        liRef: (el) => {
            elRef.current = el;
        },
        liStyle,
        dragX,
        dragging,
        removing: phase !== "idle",
        wasDragged: () => draggedRef.current,
        dragHandlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
        },
        triggerRemoval,
    };
}
