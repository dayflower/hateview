import { splitTextWithLinks } from "../../lib/text/linkify";

interface LinkifiedTextProps {
    text: string;
}

export function LinkifiedText({ text }: LinkifiedTextProps) {
    const segments = splitTextWithLinks(text);
    return (
        <>
            {segments.map((segment, index) =>
                segment.url ? (
                    <a
                        // biome-ignore lint/suspicious/noArrayIndexKey: segments are derived once per render from stable text
                        key={index}
                        href={segment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline dark:text-blue-400"
                    >
                        {segment.text}
                    </a>
                ) : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: segments are derived once per render from stable text
                    <span key={index}>{segment.text}</span>
                ),
            )}
        </>
    );
}
