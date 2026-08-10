import { ExternalLink } from "lucide-react";
import { entryPath } from "../../router/routes";
import { navigate } from "../../router/useHashRoute";
import type { Entry } from "../../types/entry";
import { CategoryBadge } from "../common/CategoryBadge";
import { FaviconImg } from "../common/FaviconImg";
import { iconButtonClass } from "../common/IconButton";
import { RelativeTime } from "../common/RelativeTime";

interface EntryRowProps {
    entry: Entry;
}

export function EntryRow({ entry }: EntryRowProps) {
    const domain = new URL(entry.url).hostname;

    return (
        <li className="flex gap-3 border-gray-200 border-b py-3 dark:border-gray-800">
            {entry.imageUrl && (
                <img
                    src={entry.imageUrl}
                    alt=""
                    className="size-20 shrink-0 rounded object-cover"
                    loading="lazy"
                />
            )}
            <div className="min-w-0 flex-1">
                <button
                    type="button"
                    onClick={() => navigate(entryPath(entry.url))}
                    className="block text-left font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                    {entry.title}
                </button>
                {entry.description && (
                    <p className="mt-1 line-clamp-2 text-gray-500 text-sm dark:text-gray-400">
                        {entry.description}
                    </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
                    <span>{entry.bookmarkCount} users</span>
                    <FaviconImg domain={domain} />
                    <span>{domain}</span>
                    {entry.categories.map((category) => (
                        <CategoryBadge key={category} category={category} />
                    ))}
                    <RelativeTime date={entry.date} />
                </div>
            </div>
            <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="元記事を開く"
                className={iconButtonClass}
            >
                <ExternalLink className="size-5" />
            </a>
        </li>
    );
}
