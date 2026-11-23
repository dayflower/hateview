import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import type { HiddenUser } from "../storage/hiddenUsers";
import * as hiddenUsersStore from "../storage/hiddenUsers";

interface HiddenUsersContextValue {
    hiddenUsers: HiddenUser[];
    addHiddenUser: (user: string) => void;
    removeHiddenUser: (user: string) => void;
    /** Exact (case-sensitive) match against the hidden list. */
    isUserHidden: (user: string) => boolean;
}

const HiddenUsersContext = createContext<HiddenUsersContextValue | null>(null);

export function HiddenUsersProvider({ children }: { children: ReactNode }) {
    const [hiddenUsers, setHiddenUsers] = useState<HiddenUser[]>(() =>
        hiddenUsersStore.listHiddenUsers(),
    );

    const addHiddenUser = useCallback((user: string) => {
        hiddenUsersStore.addHiddenUser(user);
        setHiddenUsers(hiddenUsersStore.listHiddenUsers());
    }, []);

    const removeHiddenUser = useCallback((user: string) => {
        hiddenUsersStore.removeHiddenUser(user);
        setHiddenUsers(hiddenUsersStore.listHiddenUsers());
    }, []);

    // Checked once per bookmark on every render of a comment list, which can
    // run to hundreds of rows, so look up in a Set rather than the array.
    const hiddenSet = useMemo(
        () => new Set(hiddenUsers.map((hidden) => hidden.user)),
        [hiddenUsers],
    );
    const isUserHidden = useCallback(
        (user: string) => hiddenSet.has(user),
        [hiddenSet],
    );

    const value = useMemo<HiddenUsersContextValue>(
        () => ({ hiddenUsers, addHiddenUser, removeHiddenUser, isUserHidden }),
        [hiddenUsers, addHiddenUser, removeHiddenUser, isUserHidden],
    );

    return (
        <HiddenUsersContext.Provider value={value}>
            {children}
        </HiddenUsersContext.Provider>
    );
}

export function useHiddenUsers(): HiddenUsersContextValue {
    const ctx = useContext(HiddenUsersContext);
    if (!ctx) {
        throw new Error(
            "useHiddenUsers must be used within HiddenUsersProvider",
        );
    }
    return ctx;
}
