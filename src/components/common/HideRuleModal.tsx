import { type FormEvent, useEffect, useRef, useState } from "react";
import { useHideRules } from "../../lib/hooks/useHideRules.tsx";

interface HideRuleModalProps {
    initialDomain: string;
    initialTitle: string;
    onClose: () => void;
}

export function HideRuleModal({
    initialDomain,
    initialTitle,
    onClose,
}: HideRuleModalProps) {
    const { addRule } = useHideRules();
    const [domain, setDomain] = useState(initialDomain);
    const [titleGlob, setTitleGlob] = useState(initialTitle);
    const domainInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        domainInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const trimmedDomain = domain.trim();
        const trimmedGlob = titleGlob.trim();
        if (!trimmedDomain && !trimmedGlob) {
            return;
        }
        addRule({
            domain: trimmedDomain || undefined,
            titleGlob: trimmedGlob || undefined,
        });
        onClose();
    };

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: overlay click-to-close is a mouse convenience; Escape key and the cancel button provide keyboard-accessible equivalents
        // biome-ignore lint/a11y/useKeyWithClickEvents: same as above
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops the overlay's click-to-close from firing when clicking inside the dialog; not itself an interactive control */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="hide-rule-modal-title"
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900"
            >
                <h2
                    id="hide-rule-modal-title"
                    className="font-semibold text-lg"
                >
                    非表示条件を登録
                </h2>
                <p className="mt-1 text-gray-500 text-sm">
                    ドメインとタイトルの glob
                    パターン(両方指定した場合は両方一致で非表示)。
                </p>
                <form
                    onSubmit={handleSubmit}
                    className="mt-3 flex flex-col gap-2"
                >
                    <label className="flex flex-col gap-1 text-sm">
                        ドメイン
                        <input
                            ref={domainInputRef}
                            type="text"
                            value={domain}
                            onChange={(event) => setDomain(event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-950"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                        タイトル(glob パターン)
                        <input
                            type="text"
                            value={titleGlob}
                            onChange={(event) =>
                                setTitleGlob(event.target.value)
                            }
                            className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-950"
                        />
                    </label>
                    <div className="mt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                        >
                            登録
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
