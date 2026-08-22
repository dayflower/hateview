import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import {
    type DetailTarget,
    readDetailTarget,
    writeDetailTarget,
} from "../storage/detailTarget";

interface DetailTargetContextValue {
    detailTarget: DetailTarget;
    setDetailTarget: (target: DetailTarget) => void;
}

const DetailTargetContext = createContext<DetailTargetContextValue | null>(
    null,
);

export function DetailTargetProvider({ children }: { children: ReactNode }) {
    const [detailTarget, setDetailTargetState] = useState<DetailTarget>(() =>
        readDetailTarget(),
    );

    const setDetailTarget = useCallback((next: DetailTarget) => {
        writeDetailTarget(next);
        setDetailTargetState(next);
    }, []);

    const value = useMemo<DetailTargetContextValue>(
        () => ({ detailTarget, setDetailTarget }),
        [detailTarget, setDetailTarget],
    );

    return (
        <DetailTargetContext.Provider value={value}>
            {children}
        </DetailTargetContext.Provider>
    );
}

export function useDetailTarget(): DetailTargetContextValue {
    const ctx = useContext(DetailTargetContext);
    if (!ctx) {
        throw new Error(
            "useDetailTarget must be used within DetailTargetProvider",
        );
    }
    return ctx;
}
