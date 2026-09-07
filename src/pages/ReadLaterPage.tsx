import { ExternalLink, X } from "lucide-react";
import type { MouseEvent } from "react";
import { CategoryBadge } from "../components/common/CategoryBadge";
import { EntrySummary } from "../components/common/EntrySummary";
import { iconButtonClass } from "../components/common/IconButton";
import { useCardActivation } from "../lib/hooks/useCardActivation";
import { useOpenEntryDetail } from "../lib/hooks/useOpenEntryDetail";
import { useReadLater } from "../lib/hooks/useReadLater.tsx";
import type { ReadLaterEntry } from "../lib/storage/readLater";
import { safeExternalUrl } from "../lib/url/externalUrl";

export function ReadLaterPage() {
    const { entries, remove } = useReadLater();

    if (entries.length === 0) {
        return (
            <div className="mx-auto max-w-4xl p-4">
                <p className="text-gray-500">
                    あとで読む に追加したエントリーはまだありません。
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl p-4">
            <ul>
                {entries.map((entry) => (
                    <ReadLaterRow
                        key={entry.url}
                        entry={entry}
                        onRemove={() => remove(entry.url)}
                    />
                ))}
            </ul>
        </div>
    );
}

function ReadLaterRow({
    entry,
    onRemove,
}: {
    entry: ReadLaterEntry;
    onRemove: () => void;
}) {
    const openDetail = useOpenEntryDetail();
    const { handleClick, handleDoubleClick } = useCardActivation({
        url: entry.url,
    });
    const stop = (event: MouseEvent) => event.stopPropagation();

    return (
        <li className="border-gray-200 border-b dark:border-gray-800">
            {/* biome-ignore lint/a11y/noStaticElementInteractions: the title button below provides an equivalent keyboard/screen-reader accessible action; this is a mouse/touch convenience layer */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: same as above */}
            <div
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                className="flex w-full cursor-pointer flex-wrap items-start gap-3 py-3 touch-manipulation hover:bg-gray-50 dark:hover:bg-gray-900"
            >
                <EntrySummary
                    title={entry.title}
                    description={entry.description}
                    imageUrl={entry.imageUrl}
                    onTitleClick={() => openDetail(entry.url)}
                    metaRow={
                        <>
                            {entry.bookmarkCount !== undefined && (
                                <span className="font-bold text-rose-500 dark:text-rose-400">
                                    {entry.bookmarkCount} users
                                </span>
                            )}
                            {entry.category && (
                                <CategoryBadge category={entry.category} />
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
                        onClick={stop}
                    >
                        <ExternalLink className="size-5" />
                    </a>
                    <button
                        type="button"
                        aria-label="あとで読むから外す"
                        onClick={(event) => {
                            stop(event);
                            onRemove();
                        }}
                        className={iconButtonClass}
                    >
                        <X className="size-5" />
                    </button>
                </div>
            </div>
        </li>
    );
}
