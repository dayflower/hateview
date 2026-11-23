import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useHiddenUsers } from "../../lib/hooks/useHiddenUsers.tsx";
import { isValidHatenaId } from "../../lib/storage/hiddenUsers";
import { UserAvatar } from "../common/UserAvatar";

export function HiddenUsersSettings() {
    const { hiddenUsers, addHiddenUser, removeHiddenUser } = useHiddenUsers();
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const user = input.trim();
        if (!isValidHatenaId(user)) {
            setError("はてなIDの形式が正しくありません。");
            return;
        }
        addHiddenUser(user);
        setInput("");
        setError(null);
    };

    return (
        <>
            <p className="mt-1 text-gray-500 text-sm">
                登録したユーザーのブックマークは、詳細画面のコメント一覧に表示されません。IDは大文字小文字を区別して完全一致で照合します。
            </p>
            <form
                onSubmit={handleSubmit}
                className="mt-4 flex flex-col gap-2"
                noValidate
            >
                <label className="flex flex-col gap-1 text-sm">
                    はてなID
                    <input
                        type="text"
                        value={input}
                        onChange={(event) => {
                            setInput(event.target.value);
                            setError(null);
                        }}
                        placeholder="hatena"
                        autoComplete="off"
                        className="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
                    />
                </label>
                {error && (
                    <p className="text-red-600 text-sm dark:text-red-400">
                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    className="mt-1 self-start rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                    ユーザーを追加
                </button>
            </form>

            <ul className="mt-6">
                {hiddenUsers.length === 0 && (
                    <p className="text-gray-500 text-sm">
                        非表示にしているユーザーはいません。
                    </p>
                )}
                {hiddenUsers.map((hidden) => (
                    <li
                        key={hidden.user}
                        className="flex items-center justify-between gap-2 border-gray-200 border-b py-2 text-sm dark:border-gray-800"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <UserAvatar user={hidden.user} />
                            <span className="truncate">{hidden.user}</span>
                            <span className="shrink-0 text-gray-500 text-xs dark:text-gray-400">
                                {new Date(
                                    hidden.createdAt,
                                ).toLocaleDateString()}
                            </span>
                        </span>
                        <button
                            type="button"
                            aria-label={`${hidden.user} の非表示を解除`}
                            onClick={() => removeHiddenUser(hidden.user)}
                            className="text-gray-500 hover:text-red-600"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );
}
