import { ImageOff } from "lucide-react";
import { useState } from "react";

interface ThumbnailProps {
    src?: string;
}

/** Renders a fixed-size thumbnail, or a matching placeholder when there's no
 *  image (or the image fails to load), so list rows stay visually aligned. */
export function Thumbnail({ src }: ThumbnailProps) {
    const [errored, setErrored] = useState(false);

    if (!src || errored) {
        return (
            <div className="flex size-20 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                <ImageOff className="size-6 text-gray-400 dark:text-gray-600" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt=""
            className="size-20 shrink-0 rounded object-cover"
            loading="lazy"
            onError={() => setErrored(true)}
        />
    );
}
