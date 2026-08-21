import { Loader2 } from "lucide-react";

/**
 * Centered loading indicator, used while a page's data is being fetched.
 * Sits in the middle of the content area rather than in the top-left
 * corner, so it reads as "the page is loading" instead of as page content.
 */
export function LoadingIndicator() {
    return (
        <div
            className="flex flex-col items-center justify-center gap-2 py-24 text-gray-500 dark:text-gray-400"
            role="status"
            aria-live="polite"
        >
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            <span className="text-sm">読み込み中...</span>
        </div>
    );
}
