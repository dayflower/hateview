import { GripVertical } from "lucide-react";
import {
    type KeyboardEvent,
    type PointerEvent,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { categoryLabel } from "../../lib/categories";
import { useCategoryVisibility } from "../../lib/hooks/useCategoryVisibility.tsx";
import { dropIndex, moveItem, type RowRect, rowShift } from "../../lib/reorder";
import type { FeedId } from "../../types/entry";

interface DragState {
    pointerId: number;
    from: number;
    startY: number;
    delta: number;
    /** Row positions measured when the drag started, in list order. */
    rects: RowRect[];
}

/** Category visibility checkboxes plus drag-to-reorder. Dragging is done
 *  with Pointer Events on a grip handle, so mouse, pen and touch share one
 *  code path; the handle also moves its row with the arrow keys. While a
 *  drag is in progress the DOM order is left alone and rows are only
 *  translated, so the committed order changes once, on drop. */
export function CategorySettingsList() {
    const {
        orderedCategories,
        visibleCategories,
        isCategoryVisible,
        setCategoryVisible,
        setCategoryOrder,
        resetCategoryOrder,
    } = useCategoryVisibility();
    const [drag, setDrag] = useState<DragState | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const rowRefs = useRef(new Map<FeedId, HTMLLIElement>());
    const handleRefs = useRef(new Map<FeedId, HTMLButtonElement>());
    const refocusRef = useRef<FeedId | null>(null);

    // Reordering moves DOM nodes, which can drop focus from the handle that
    // was just used; put it back so repeated arrow presses keep working.
    // Runs after every render but only acts when a keyboard move is pending.
    useLayoutEffect(() => {
        const id = refocusRef.current;
        if (id !== null) {
            refocusRef.current = null;
            handleRefs.current.get(id)?.focus();
        }
    });

    const target =
        drag === null ? -1 : dropIndex(drag.rects, drag.from, drag.delta);

    const commitMove = (from: number, to: number) => {
        if (from === to) {
            return;
        }
        const id = orderedCategories[from];
        setCategoryOrder(moveItem(orderedCategories, from, to));
        setAnnouncement(`${categoryLabel(id)}を${to + 1}番目に移動しました`);
    };

    const handlePointerDown = (
        event: PointerEvent<HTMLButtonElement>,
        index: number,
    ) => {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const rects = orderedCategories.map((id) => {
            const rect = rowRefs.current.get(id)?.getBoundingClientRect();
            return { top: rect?.top ?? 0, height: rect?.height ?? 0 };
        });
        setDrag({
            pointerId: event.pointerId,
            from: index,
            startY: event.clientY,
            delta: 0,
            rects,
        });
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        if (drag === null || event.pointerId !== drag.pointerId) {
            return;
        }
        const delta = event.clientY - drag.startY;
        setDrag((current) => (current ? { ...current, delta } : current));
    };

    const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
        if (drag === null || event.pointerId !== drag.pointerId) {
            return;
        }
        setDrag(null);
        commitMove(drag.from, target);
    };

    const cancelDrag = () => setDrag(null);

    const handleKeyDown = (
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) => {
        let to: number;
        if (event.key === "ArrowUp") {
            to = index - 1;
        } else if (event.key === "ArrowDown") {
            to = index + 1;
        } else {
            return;
        }
        event.preventDefault();
        if (to < 0 || to >= orderedCategories.length) {
            return;
        }
        refocusRef.current = orderedCategories[index];
        commitMove(index, to);
    };

    const handleReset = () => {
        resetCategoryOrder();
        setAnnouncement("初期の並び順に戻しました");
    };

    return (
        <>
            <ul className="mt-4">
                {orderedCategories.map((id, index) => {
                    const checked = isCategoryVisible(id);
                    const disabled = checked && visibleCategories.length <= 1;
                    const isDragged = drag !== null && drag.from === index;
                    const offset =
                        drag === null
                            ? 0
                            : isDragged
                              ? drag.delta
                              : rowShift(
                                    index,
                                    drag.from,
                                    target,
                                    drag.rects[drag.from]?.height ?? 0,
                                );
                    const label = categoryLabel(id);
                    return (
                        <li
                            key={id}
                            ref={(element) => {
                                if (element) {
                                    rowRefs.current.set(id, element);
                                } else {
                                    rowRefs.current.delete(id);
                                }
                            }}
                            style={
                                offset === 0
                                    ? undefined
                                    : { transform: `translateY(${offset}px)` }
                            }
                            className={[
                                "relative flex items-center gap-2 border-gray-200 border-b bg-white py-2 text-sm dark:border-gray-800 dark:bg-gray-950",
                                drag !== null && !isDragged
                                    ? "transition-transform duration-150"
                                    : "",
                                isDragged
                                    ? "z-10 rounded shadow-lg ring-1 ring-gray-300 dark:ring-gray-700"
                                    : "",
                            ].join(" ")}
                        >
                            <button
                                type="button"
                                ref={(element) => {
                                    if (element) {
                                        handleRefs.current.set(id, element);
                                    } else {
                                        handleRefs.current.delete(id);
                                    }
                                }}
                                aria-label={`${label}の並び順を変更`}
                                aria-describedby="category-reorder-hint"
                                onPointerDown={(event) =>
                                    handlePointerDown(event, index)
                                }
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={cancelDrag}
                                onLostPointerCapture={cancelDrag}
                                onKeyDown={(event) =>
                                    handleKeyDown(event, index)
                                }
                                className={[
                                    "touch-none rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                                    isDragged
                                        ? "cursor-grabbing"
                                        : "cursor-grab",
                                ].join(" ")}
                            >
                                <GripVertical className="size-4" />
                            </button>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={(event) =>
                                        setCategoryVisible(
                                            id,
                                            event.target.checked,
                                        )
                                    }
                                    className="size-4 rounded border-gray-300 dark:border-gray-700"
                                />
                                {label}
                            </label>
                        </li>
                    );
                })}
            </ul>
            <p id="category-reorder-hint" className="sr-only">
                ドラッグするか、矢印キーの上下で並び順を変更できます。
            </p>
            <p aria-live="polite" className="sr-only">
                {announcement}
            </p>
            <button
                type="button"
                onClick={handleReset}
                className="mt-3 rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
                初期の並び順に戻す
            </button>
        </>
    );
}
