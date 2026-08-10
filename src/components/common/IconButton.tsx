import type { ButtonHTMLAttributes } from "react";

export const iconButtonClass =
    "flex size-11 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    "aria-label": string;
}

export function IconButton({ className = "", ...props }: IconButtonProps) {
    return (
        <button
            type="button"
            className={`${iconButtonClass} ${className}`}
            {...props}
        />
    );
}
