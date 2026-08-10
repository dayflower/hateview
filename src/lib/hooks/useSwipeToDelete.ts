import type { PointerEvent } from "react";
import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 80;
const DRAG_TRIGGER = 5;
const EXIT_ANIMATION_MS = 200;

interface UseSwipeToDeleteOptions {
    onDelete: () => void;
}

interface UseSwipeToDeleteResult {
    dragX: number;
    dragging: boolean;
    removing: boolean;
    wasDragged: () => boolean;
    handlers: {
        onPointerDown: (event: PointerEvent) => void;
        onPointerMove: (event: PointerEvent) => void;
        onPointerUp: (event: PointerEvent) => void;
        onPointerCancel: (event: PointerEvent) => void;
    };
}

/** Gmail-style swipe-left-to-delete: drags the row left, reveals a delete panel
 *  behind it, and — past a distance threshold — slides it fully away before
 *  calling `onDelete`. Tracks pointer events, so it works for touch and mouse drag. */
export function useSwipeToDelete({
    onDelete,
}: UseSwipeToDeleteOptions): UseSwipeToDeleteResult {
    const [dragX, setDragX] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [removing, setRemoving] = useState(false);
    const draggingRef = useRef(false);
    const draggedRef = useRef(false);
    const startXRef = useRef(0);
    const pointerIdRef = useRef<number | null>(null);

    function handlePointerDown(event: PointerEvent) {
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
            setRemoving(true);
            setDragX(-9999);
            setTimeout(onDelete, EXIT_ANIMATION_MS);
        } else {
            setDragX(0);
        }
    }

    return {
        dragX,
        dragging,
        removing,
        wasDragged: () => draggedRef.current,
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
        },
    };
}
