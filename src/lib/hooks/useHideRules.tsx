import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useState,
} from "react";
import type {
    HideableEntry,
    HideRule,
    HideRuleInput,
} from "../storage/hideRules";
import * as hideRulesStore from "../storage/hideRules";

interface HideRulesContextValue {
    rules: HideRule[];
    addRule: (input: HideRuleInput) => void;
    removeRule: (id: string) => void;
    isHidden: (entry: HideableEntry) => boolean;
}

const HideRulesContext = createContext<HideRulesContextValue | null>(null);

export function HideRulesProvider({ children }: { children: ReactNode }) {
    const [rules, setRules] = useState<HideRule[]>(() =>
        hideRulesStore.listRules(),
    );

    // Stable identities (empty deps): `rules` changing already gives the context `value`
    // object below a new identity, which is what makes consumers re-render.
    const addRule = useCallback((input: HideRuleInput) => {
        hideRulesStore.addRule(input);
        setRules(hideRulesStore.listRules());
    }, []);

    const removeRule = useCallback((id: string) => {
        hideRulesStore.removeRule(id);
        setRules(hideRulesStore.listRules());
    }, []);

    const isHidden = useCallback(
        (entry: HideableEntry) =>
            hideRulesStore.isHidden(entry, hideRulesStore.listRules()),
        [],
    );

    const value: HideRulesContextValue = {
        rules,
        addRule,
        removeRule,
        isHidden,
    };

    return (
        <HideRulesContext.Provider value={value}>
            {children}
        </HideRulesContext.Provider>
    );
}

export function useHideRules(): HideRulesContextValue {
    const ctx = useContext(HideRulesContext);
    if (!ctx) {
        throw new Error("useHideRules must be used within HideRulesProvider");
    }
    return ctx;
}
