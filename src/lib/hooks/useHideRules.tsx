import { createContext, type ReactNode, useContext, useState } from "react";
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

    const addRule = (input: HideRuleInput) => {
        hideRulesStore.addRule(input);
        setRules(hideRulesStore.listRules());
    };

    const removeRule = (id: string) => {
        hideRulesStore.removeRule(id);
        setRules(hideRulesStore.listRules());
    };

    const isHidden = (entry: HideableEntry) =>
        hideRulesStore.isHidden(entry, rules);

    return (
        <HideRulesContext.Provider
            value={{ rules, addRule, removeRule, isHidden }}
        >
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
