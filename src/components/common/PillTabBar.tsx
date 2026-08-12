import { useLayoutEffect, useRef, useState } from "react";

interface PillTabBarOption<T extends string> {
    id: T;
    label: string;
}

interface PillTabBarProps<T extends string> {
    options: PillTabBarOption<T>[];
    selected: T;
    onSelect: (id: T) => void;
    ariaLabel: string;
}

export function PillTabBar<T extends string>({
    options,
    selected,
    onSelect,
    ariaLabel,
}: PillTabBarProps<T>) {
    const buttonRefs = useRef(new Map<T, HTMLButtonElement>());
    const [pillRect, setPillRect] = useState<{ left: number; width: number }>();

    useLayoutEffect(() => {
        const button = buttonRefs.current.get(selected);
        if (button) {
            setPillRect({ left: button.offsetLeft, width: button.offsetWidth });
        }
    }, [selected]);

    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className="relative inline-flex gap-1 rounded-full border border-gray-300 p-1 dark:border-gray-700"
        >
            {pillRect && (
                <div
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 rounded-full bg-blue-600 transition-[left,width] duration-200 ease-out"
                    style={{ left: pillRect.left, width: pillRect.width }}
                />
            )}
            {options.map((option) => (
                <button
                    key={option.id}
                    ref={(el) => {
                        if (el) {
                            buttonRefs.current.set(option.id, el);
                        } else {
                            buttonRefs.current.delete(option.id);
                        }
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected === option.id}
                    onClick={() => onSelect(option.id)}
                    className={`relative z-10 rounded-full px-3 py-1 text-sm transition-colors ${
                        selected === option.id
                            ? "text-white"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
