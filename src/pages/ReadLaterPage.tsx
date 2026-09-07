import { ExternalLink, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { CategoryBadge } from "../components/common/CategoryBadge";
import { EntrySummary } from "../components/common/EntrySummary";
import { FaviconImg } from "../components/common/FaviconImg";
import { IconButton, iconButtonClass } from "../components/common/IconButton";
import { useCardActivation } from "../lib/hooks/useCardActivation";
import { useConfirmAction } from "../lib/hooks/useConfirmAction";
import { useOpenEntryDetail } from "../lib/hooks/useOpenEntryDetail";
import { useReadLater } from "../lib/hooks/useReadLater.tsx";
import { useRowRemoval } from "../lib/hooks/useRowRemoval";
import type { ReadLaterEntry } from "../lib/storage/readLater";
import { safeExternalUrl } from "../lib/url/externalUrl";

const CONFIRM_TIMEOUT_MS = 3000;

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
    const domain = new URL(entry.url).hostname;
    const stop = (event: MouseEvent) => event.stopPropagation();

    const {
        liRef,
        liStyle,
        dragX,
        dragging,
        removing,
        wasDragged,
        dragHandlers,
        triggerRemoval,
    } = useRowRemoval({ onRemove });

    const { handleClick, handleDoubleClick } = useCardActivation({
        url: entry.url,
        wasDragged,
    });

    const { confirming: confirmingDelete, trigger: triggerDeleteConfirm } =
        useConfirmAction(triggerRemoval, CONFIRM_TIMEOUT_MS);

    const removeLabel = confirmingDelete
        ? "もう一度クリックして「あとで読むから外す」を確定"
        : "あとで読むから外す";

    return (
        <li
            ref={liRef}
            style={liStyle}
            className="relative overflow-hidden border-gray-200 border-b dark:border-gray-800"
        >
            <div
                className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500"
                style={{ width: Math.abs(dragX) }}
            >
                <Trash2 className="size-6 text-white" />
            </div>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: the title button below provides an equivalent keyboard/screen-reader accessible action; this is a mouse/touch convenience layer */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: same as above */}
            <div
                {...dragHandlers}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                style={{
                    transform: `translateX(${dragX}px)`,
                    transition: dragging ? "none" : "transform 0.2s ease-out",
                }}
                className={`flex w-full flex-wrap items-start gap-3 py-3 transition-opacity duration-300 touch-manipulation hover:bg-gray-50 dark:hover:bg-gray-900 ${
                    removing ? "" : "cursor-pointer"
                }`}
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
                            <FaviconImg domain={domain} />
                            <span>{domain}</span>
                            {entry.category && (
                                <CategoryBadge category={entry.category} />
                            )}
                        </>
                    }
                />
                <div className="flex w-full justify-end gap-1 sm:w-auto sm:flex-col">
                    <a
                        href={safeExternalUrl(entry.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="元記事を開く"
                        title="元記事を開く"
                        className={`${iconButtonClass} sm:size-9`}
                        onClick={stop}
                    >
                        <ExternalLink className="size-5" />
                    </a>
                    <IconButton
                        aria-label={removeLabel}
                        title={removeLabel}
                        onClick={(event) => {
                            stop(event);
                            triggerDeleteConfirm();
                        }}
                        className={
                            confirmingDelete
                                ? "sm:size-9 !bg-red-500 !text-white hover:!bg-red-600"
                                : "sm:size-9"
                        }
                    >
                        <Trash2 className="size-5" />
                    </IconButton>
                </div>
            </div>
        </li>
    );
}
