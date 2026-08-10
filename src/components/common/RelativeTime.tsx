const formatter = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
];

function formatRelative(date: Date): string {
    const diffSeconds = (date.getTime() - Date.now()) / 1000;
    for (const [unit, secondsInUnit] of UNITS) {
        if (Math.abs(diffSeconds) >= secondsInUnit) {
            return formatter.format(
                Math.round(diffSeconds / secondsInUnit),
                unit,
            );
        }
    }
    return formatter.format(Math.round(diffSeconds / 60), "minute");
}

interface RelativeTimeProps {
    date: string;
}

export function RelativeTime({ date }: RelativeTimeProps) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return (
        <time
            dateTime={parsed.toISOString()}
            title={parsed.toLocaleString("ja-JP")}
        >
            {formatRelative(parsed)}
        </time>
    );
}
