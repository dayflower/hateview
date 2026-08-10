import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useHideRules } from "../lib/hooks/useHideRules.tsx";

export function SettingsPage() {
    const { rules, addRule, removeRule } = useHideRules();
    const [domain, setDomain] = useState("");
    const [titleGlob, setTitleGlob] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const trimmedDomain = domain.trim();
        const trimmedGlob = titleGlob.trim();
        if (!trimmedDomain && !trimmedGlob) {
            setError(
                "ドメインまたはタイトルパターンのいずれかを入力してください。",
            );
            return;
        }
        addRule({
            domain: trimmedDomain || undefined,
            titleGlob: trimmedGlob || undefined,
        });
        setDomain("");
        setTitleGlob("");
        setError(null);
    };

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="font-semibold text-lg">非表示フィルタ設定</h1>
            <p className="mt-1 text-gray-500 text-sm">
                ドメインとタイトルの glob
                パターン(両方指定した場合は両方一致で非表示)。
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
                <label className="flex flex-col gap-1 text-sm">
                    ドメイン
                    <input
                        type="text"
                        value={domain}
                        onChange={(event) => setDomain(event.target.value)}
                        placeholder="shonenjumpplus.com"
                        className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    タイトル(glob パターン)
                    <input
                        type="text"
                        value={titleGlob}
                        onChange={(event) => setTitleGlob(event.target.value)}
                        placeholder="*ネタバレ*"
                        className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
                    />
                </label>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="mt-1 self-start rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                    ルールを追加
                </button>
            </form>

            <ul className="mt-6">
                {rules.length === 0 && (
                    <p className="text-gray-500 text-sm">
                        登録済みのルールはありません。
                    </p>
                )}
                {rules.map((rule) => (
                    <li
                        key={rule.id}
                        className="flex items-center justify-between border-gray-200 border-b py-2 text-sm dark:border-gray-800"
                    >
                        <span>
                            {rule.domain && (
                                <span className="mr-2">
                                    domain: {rule.domain}
                                </span>
                            )}
                            {rule.titleGlob && (
                                <span>title: {rule.titleGlob}</span>
                            )}
                        </span>
                        <button
                            type="button"
                            aria-label="ルールを削除"
                            onClick={() => removeRule(rule.id)}
                            className="text-gray-500 hover:text-red-600"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
