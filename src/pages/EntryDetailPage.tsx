interface EntryDetailPageProps {
    url: string;
}

export function EntryDetailPage({ url }: EntryDetailPageProps) {
    return (
        <div className="mx-auto max-w-2xl p-4">
            <p className="text-gray-500">詳細画面(実装予定): {url}</p>
        </div>
    );
}
