export interface RowRect {
    top: number;
    height: number;
}

/** Returns a copy of `items` with the element at `from` moved to `to`. */
export function moveItem<T>(
    items: readonly T[],
    from: number,
    to: number,
): T[] {
    const next = items.slice();
    if (from < 0 || from >= next.length) {
        return next;
    }
    const [item] = next.splice(from, 1);
    const clamped = Math.max(0, Math.min(to, next.length));
    next.splice(clamped, 0, item);
    return next;
}

/** Index the row at `from` would land on if dropped after being dragged by
 *  `delta` pixels: the number of other rows whose vertical center the
 *  dragged row's center has passed. `rects` are measured at drag start. */
export function dropIndex(
    rects: readonly RowRect[],
    from: number,
    delta: number,
): number {
    const dragged = rects[from];
    if (!dragged) {
        return from;
    }
    const center = dragged.top + dragged.height / 2 + delta;
    let index = 0;
    rects.forEach((rect, i) => {
        if (i !== from && rect.top + rect.height / 2 < center) {
            index += 1;
        }
    });
    return index;
}

/** How far a non-dragged row at `index` must shift to open a gap at
 *  `target` for the row dragged from `from`. */
export function rowShift(
    index: number,
    from: number,
    target: number,
    draggedHeight: number,
): number {
    if (index === from) {
        return 0;
    }
    if (from < index && index <= target) {
        return -draggedHeight;
    }
    if (target <= index && index < from) {
        return draggedHeight;
    }
    return 0;
}
