import { ExternalLink, X } from "lucide-react";
import { CategoryBadge } from "../components/common/CategoryBadge";
import { EntrySummary } from "../components/common/EntrySummary";
import { iconButtonClass } from "../components/common/IconButton";
import { useReadLater } from "../lib/hooks/useReadLater.tsx";
import { safeExternalUrl } from "../lib/url/externalUrl";
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
                        <EntrySummary
                            title={entry.title}
                            description={entry.description}
                            imageUrl={entry.imageUrl}
                            onTitleClick={() => navigate(entryPath(entry.url))}
                            metaRow={
                                <>
                                    {entry.bookmarkCount !== undefined && (
                                        <span>{entry.bookmarkCount} users</span>
                                    )}
                                    {entry.category && (
                                        <CategoryBadge
                                            category={entry.category}
                                        />
                                    )}
                                </>
                            }
                        />
                        <div className="flex w-full justify-end gap-1 sm:w-auto">
                            <a
                                href={safeExternalUrl(entry.url)}
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
