import { useEffect, useRef } from "react";
import { useEscapeKey } from "../../lib/hooks/useEscapeKey";
import { HideRuleForm } from "./HideRuleForm";

interface HideRuleModalProps {
    /** When set, submitting edits this existing rule instead of adding a new one. */
    ruleId?: string;
    initialDomain: string;
    initialTitle: string;
    onClose: () => void;
}

export function HideRuleModal({
    ruleId,
    initialDomain,
    initialTitle,
    onClose,
}: HideRuleModalProps) {
    const domainInputRef = useRef<HTMLInputElement>(null);
    const pointerDownOnOverlayRef = useRef(false);

    useEffect(() => {
        domainInputRef.current?.focus();
    }, []);

    useEscapeKey(onClose);

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: overlay click-to-close is a mouse convenience; Escape key and the cancel button provide keyboard-accessible equivalents
        // biome-ignore lint/a11y/useKeyWithClickEvents: same as above
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onPointerDown={(event) => {
                // Close only on a click that both starts and ends on the overlay,
                // so dragging out of the dialog (e.g. selecting text) keeps it open.
                pointerDownOnOverlayRef.current =
                    event.target === event.currentTarget;
            }}
            onClick={(event) => {
                const startedOnOverlay = pointerDownOnOverlayRef.current;
                pointerDownOnOverlayRef.current = false;
                if (startedOnOverlay && event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="hide-rule-modal-title"
                className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900"
            >
                <h2
                    id="hide-rule-modal-title"
                    className="font-semibold text-gray-900 text-lg dark:text-gray-100"
                >
                    {ruleId ? "非表示条件を編集" : "非表示条件を登録"}
                </h2>
                <HideRuleForm
                    ruleId={ruleId}
                    initialDomain={initialDomain}
                    initialTitleGlob={initialTitle}
                    domainInputRef={domainInputRef}
                    descriptionClassName="mt-1 text-gray-500 text-sm dark:text-gray-400"
                    formClassName="mt-3 flex flex-col gap-2"
                    labelClassName="flex flex-col gap-1 text-gray-700 text-sm dark:text-gray-300"
                    inputClassName="rounded border border-gray-300 px-2 py-1 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    onSubmitted={onClose}
                    footer={
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
                                {ruleId ? "保存" : "登録"}
                            </button>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
