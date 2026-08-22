import {
    type FormEvent,
    type ReactNode,
    type RefObject,
    useState,
} from "react";
import { useHideRules } from "../../lib/hooks/useHideRules.tsx";
import { toSerialTitleGlob } from "../../lib/text/serialTitleGlob";

interface HideRuleFormProps {
    /** When set, submitting edits this existing rule instead of adding a new one. */
    ruleId?: string;
    initialDomain?: string;
    initialTitleGlob?: string;
    domainInputRef?: RefObject<HTMLInputElement | null>;
    domainPlaceholder?: string;
    titleGlobPlaceholder?: string;
    descriptionClassName: string;
    labelClassName: string;
    inputClassName: string;
    formClassName: string;
    /** Whether an empty submit shows an inline validation message (the
     *  settings page) or just silently does nothing (the modal, where the
     *  cancel button is the obvious way out). */
    showValidationError?: boolean;
    /** Called after a rule was actually added; the settings page stays put
     *  (fields are cleared below), the modal closes itself. */
    onSubmitted: () => void;
    /** The submit (and, for the modal, cancel) controls, rendered inside the
     *  `<form>` so a submit button here triggers the same handleSubmit. */
    footer: ReactNode;
}

const DESCRIPTION =
    "ドメインとタイトルの glob パターン(両方指定した場合は両方一致で非表示)。";
const VALIDATION_MESSAGE =
    "ドメインまたはタイトルパターンのいずれかを入力してください。";
const SERIALIZE_LABEL = "連載パターンにまとめる";
const RESTORE_LABEL = "元のタイトルに戻す";

export function HideRuleForm({
    ruleId,
    initialDomain = "",
    initialTitleGlob = "",
    domainInputRef,
    domainPlaceholder,
    titleGlobPlaceholder,
    descriptionClassName,
    labelClassName,
    inputClassName,
    formClassName,
    showValidationError = false,
    onSubmitted,
    footer,
}: HideRuleFormProps) {
    const { addRule, updateRule } = useHideRules();
    const [domain, setDomain] = useState(initialDomain);
    const [titleGlob, setTitleGlob] = useState(initialTitleGlob);
    /** Pre-generalization value, so the button can undo itself. */
    const [titleBeforeSerialize, setTitleBeforeSerialize] = useState<
        string | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    const serialGlob = toSerialTitleGlob(titleGlob);
    const canSerialize = serialGlob !== null && serialGlob !== titleGlob;

    const handleTitleGlobChange = (value: string) => {
        setTitleGlob(value);
        // A hand edit makes the stashed original stale.
        setTitleBeforeSerialize(null);
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const trimmedDomain = domain.trim();
        const trimmedGlob = titleGlob.trim();
        if (!trimmedDomain && !trimmedGlob) {
            if (showValidationError) {
                setError(VALIDATION_MESSAGE);
            }
            return;
        }
        const input = {
            domain: trimmedDomain || undefined,
            titleGlob: trimmedGlob || undefined,
        };
        if (ruleId) {
            updateRule(ruleId, input);
        } else {
            addRule(input);
            setDomain("");
            setTitleGlob("");
            setTitleBeforeSerialize(null);
        }
        setError(null);
        onSubmitted();
    };

    return (
        <>
            <p className={descriptionClassName}>{DESCRIPTION}</p>
            <form onSubmit={handleSubmit} className={formClassName}>
                <label className={labelClassName}>
                    ドメイン
                    <input
                        ref={domainInputRef}
                        type="text"
                        value={domain}
                        onChange={(event) => setDomain(event.target.value)}
                        placeholder={domainPlaceholder}
                        className={inputClassName}
                    />
                </label>
                <label className={labelClassName}>
                    タイトル(glob パターン)
                    <input
                        type="text"
                        value={titleGlob}
                        onChange={(event) =>
                            handleTitleGlobChange(event.target.value)
                        }
                        placeholder={titleGlobPlaceholder}
                        className={inputClassName}
                    />
                </label>
                {(canSerialize || titleBeforeSerialize !== null) && (
                    <button
                        type="button"
                        onClick={() => {
                            if (titleBeforeSerialize !== null) {
                                setTitleGlob(titleBeforeSerialize);
                                setTitleBeforeSerialize(null);
                            } else if (serialGlob !== null) {
                                setTitleBeforeSerialize(titleGlob);
                                setTitleGlob(serialGlob);
                            }
                        }}
                        className="self-start text-blue-600 text-sm hover:underline dark:text-blue-400"
                    >
                        {titleBeforeSerialize !== null
                            ? RESTORE_LABEL
                            : SERIALIZE_LABEL}
                    </button>
                )}
                {error && <p className="text-red-600 text-sm">{error}</p>}
                {footer}
            </form>
        </>
    );
}
