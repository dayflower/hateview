import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import type { FeedId } from "../../types/entry";
import * as categoryVisibilityStore from "../storage/categoryVisibility";

interface CategoryVisibilityContextValue {
    visibleCategories: FeedId[];
    isCategoryVisible: (id: FeedId) => boolean;
    setCategoryVisible: (id: FeedId, visible: boolean) => void;
}

const CategoryVisibilityContext =
    createContext<CategoryVisibilityContextValue | null>(null);

export function CategoryVisibilityProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [visibleCategories, setVisibleCategories] = useState<FeedId[]>(() =>
        categoryVisibilityStore.listVisibleCategories(),
    );

    const setCategoryVisible = useCallback((id: FeedId, visible: boolean) => {
        categoryVisibilityStore.setCategoryVisible(id, visible);
        setVisibleCategories(categoryVisibilityStore.listVisibleCategories());
    }, []);

    const isCategoryVisible = useCallback(
        (id: FeedId) => visibleCategories.includes(id),
        [visibleCategories],
    );

    const value = useMemo<CategoryVisibilityContextValue>(
        () => ({ visibleCategories, isCategoryVisible, setCategoryVisible }),
        [visibleCategories, isCategoryVisible, setCategoryVisible],
    );

    return (
        <CategoryVisibilityContext.Provider value={value}>
            {children}
        </CategoryVisibilityContext.Provider>
    );
}

export function useCategoryVisibility(): CategoryVisibilityContextValue {
    const ctx = useContext(CategoryVisibilityContext);
    if (!ctx) {
        throw new Error(
            "useCategoryVisibility must be used within CategoryVisibilityProvider",
        );
    }
    return ctx;
}
