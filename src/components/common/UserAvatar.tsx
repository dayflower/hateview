import { UserRound } from "lucide-react";
import { useState } from "react";

interface UserAvatarProps {
    user: string;
}

export function UserAvatar({ user }: UserAvatarProps) {
    const [errored, setErrored] = useState(false);

    if (errored) {
        return (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <UserRound className="size-4 text-gray-400 dark:text-gray-600" />
            </div>
        );
    }

    return (
        <img
            src={`https://cdn.profile-image.st-hatena.com/users/${encodeURIComponent(user)}/profile.gif`}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
            loading="lazy"
            onError={() => setErrored(true)}
        />
    );
}
