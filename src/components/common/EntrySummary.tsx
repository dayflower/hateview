import type { ReactNode } from "react";
import { Thumbnail } from "./Thumbnail";

interface EntrySummaryProps {
    title: string;
    description?: string;
    imageUrl?: string;
    onTitleClick: () => void;
    /** Rendered as the row of small meta badges below the description, if given. */
    metaRow?: ReactNode;
}

/** The thumbnail + title + description + meta-row block shared by the hot-entry
 *  list and the read-later list. Returns its two root elements as siblings
 *  (not wrapped in a container), so callers can lay them out in their own
 *  flex row alongside their own action buttons. */
export function EntrySummary({
    title,
    description,
    imageUrl,
    onTitleClick,
    metaRow,
}: EntrySummaryProps) {
    return (
        <>
            <Thumbnail src={imageUrl} />
            <div className="min-w-0 flex-1">
                <button
                    type="button"
                    onClick={onTitleClick}
                    className="block text-left font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                    {title}
                </button>
                {description && (
                    <p className="mt-1 line-clamp-2 text-gray-500 text-sm dark:text-gray-400">
                        {description}
                    </p>
                )}
                {metaRow && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
                        {metaRow}
                    </div>
                )}
            </div>
        </>
    );
}
