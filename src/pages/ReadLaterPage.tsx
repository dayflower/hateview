import { ExternalLink, X } from "lucide-react";
import { CategoryBadge } from "../components/common/CategoryBadge";
import { iconButtonClass } from "../components/common/IconButton";
import { Thumbnail } from "../components/common/Thumbnail";
import { useReadLater } from "../lib/hooks/useReadLater.tsx";
import { entryPath } from "../router/routes";
import { navigate } from "../router/useHashRoute";

export function ReadLaterPage() {
    const { entries, remove } = useReadLater();

    if (entries.length === 0) {
        return (
            <div className="mx-auto max-w-2xl p-4">
                <p className="text-gray-500">
                    あとで読む に追加したエントリーはまだありません。
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <ul>
                {entries.map((entry) => (
                    <li
                        key={entry.url}
                        className="flex flex-wrap items-start gap-3 border-gray-200 border-b py-3 dark:border-gray-800"
                    >
                        <Thumbnail src={entry.imageUrl} />
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
                                {entry.bookmarkCount !== undefined && (
                                    <span>{entry.bookmarkCount} users</span>
                                )}
                                {entry.categories?.map((category) => (
                                    <CategoryBadge
                                        key={category}
                                        category={category}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex w-full justify-end gap-1 sm:w-auto">
                            <a
                                href={entry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="元記事を開く"
                                className={iconButtonClass}
                            >
                                <ExternalLink className="size-5" />
                            </a>
                            <button
                                type="button"
                                aria-label="あとで読むから外す"
                                onClick={() => remove(entry.url)}
                                className={iconButtonClass}
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
