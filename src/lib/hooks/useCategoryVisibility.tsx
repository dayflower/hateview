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
    /** Every category, hidden ones included, in the user's chosen order. */
    orderedCategories: FeedId[];
    /** Visible categories in the user's chosen order. */
    visibleCategories: FeedId[];
    isCategoryVisible: (id: FeedId) => boolean;
    setCategoryVisible: (id: FeedId, visible: boolean) => void;
    setCategoryOrder: (order: FeedId[]) => void;
    resetCategoryOrder: () => void;
}

const CategoryVisibilityContext =
    createContext<CategoryVisibilityContextValue | null>(null);

function readState() {
    return {
        ordered: categoryVisibilityStore.listOrderedCategories(),
        visible: categoryVisibilityStore.listVisibleCategories(),
    };
}

export function CategoryVisibilityProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [state, setState] = useState(readState);

    const setCategoryVisible = useCallback((id: FeedId, visible: boolean) => {
        categoryVisibilityStore.setCategoryVisible(id, visible);
        setState(readState());
    }, []);

    const setCategoryOrder = useCallback((order: FeedId[]) => {
        categoryVisibilityStore.setCategoryOrder(order);
        setState(readState());
    }, []);

    const resetCategoryOrder = useCallback(() => {
        categoryVisibilityStore.resetCategoryOrder();
        setState(readState());
    }, []);

    const isCategoryVisible = useCallback(
        (id: FeedId) => state.visible.includes(id),
        [state.visible],
    );

    const value = useMemo<CategoryVisibilityContextValue>(
        () => ({
            orderedCategories: state.ordered,
            visibleCategories: state.visible,
            isCategoryVisible,
            setCategoryVisible,
            setCategoryOrder,
            resetCategoryOrder,
        }),
        [
            state,
            isCategoryVisible,
            setCategoryVisible,
            setCategoryOrder,
            resetCategoryOrder,
        ],
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
