import { Trash2 } from "lucide-react";
import { HideRuleForm } from "../components/common/HideRuleForm";
import { useHideRules } from "../lib/hooks/useHideRules.tsx";

export function SettingsPage() {
    const { rules, removeRule } = useHideRules();

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="font-semibold text-lg">非表示フィルタ設定</h1>
            <HideRuleForm
                descriptionClassName="mt-1 text-gray-500 text-sm"
                formClassName="mt-4 flex flex-col gap-2"
                labelClassName="flex flex-col gap-1 text-sm"
                inputClassName="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
                domainPlaceholder="shonenjumpplus.com"
                titleGlobPlaceholder="*ネタバレ*"
                showValidationError
                onSubmitted={() => {}}
                footer={
                    <button
                        type="submit"
                        className="mt-1 self-start rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                        ルールを追加
                    </button>
                }
            />

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
