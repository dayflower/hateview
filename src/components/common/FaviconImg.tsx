import { useState } from "react";

interface FaviconImgProps {
    domain: string;
}

export function FaviconImg({ domain }: FaviconImgProps) {
    const [hidden, setHidden] = useState(false);

    if (hidden) {
        return null;
    }

    return (
        <img
            src={`https://${domain}/favicon.ico`}
            alt=""
            className="size-4 shrink-0"
            onError={() => setHidden(true)}
        />
    );
}
