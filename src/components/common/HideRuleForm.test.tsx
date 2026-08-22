import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HideRulesProvider } from "../../lib/hooks/useHideRules.tsx";
import { HideRuleForm } from "./HideRuleForm";

const SERIAL_TITLE = "[第62話]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋";
const SERIAL_GLOB = "[*]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋";

function renderForm(initialTitleGlob: string) {
    render(
        <HideRulesProvider>
            <HideRuleForm
                initialTitleGlob={initialTitleGlob}
                descriptionClassName=""
                formClassName=""
                labelClassName=""
                inputClassName=""
                onSubmitted={() => {}}
                footer={<button type="submit">登録</button>}
            />
        </HideRulesProvider>,
    );
    return screen.getByLabelText("タイトル(glob パターン)") as HTMLInputElement;
}

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe("HideRuleForm", () => {
    it("rewrites a serialized-manga title into a glob", async () => {
        const user = userEvent.setup();
        const input = renderForm(SERIAL_TITLE);

        await user.click(
            screen.getByRole("button", { name: "連載パターンにまとめる" }),
        );

        expect(input.value).toBe(SERIAL_GLOB);
    });

    it("restores the original title after generalizing", async () => {
        const user = userEvent.setup();
        const input = renderForm(SERIAL_TITLE);

        await user.click(
            screen.getByRole("button", { name: "連載パターンにまとめる" }),
        );
        await user.click(
            screen.getByRole("button", { name: "元のタイトルに戻す" }),
        );

        expect(input.value).toBe(SERIAL_TITLE);
    });

    it("offers no button for a title without an episode marker", () => {
        renderForm("理想のラーメン店を目指す経営シミュレーションゲーム発表");

        expect(
            screen.queryByRole("button", { name: "連載パターンにまとめる" }),
        ).toBeNull();
    });

    it("drops the stashed original once the field is edited by hand", async () => {
        const user = userEvent.setup();
        const input = renderForm(SERIAL_TITLE);

        await user.click(
            screen.getByRole("button", { name: "連載パターンにまとめる" }),
        );
        await user.type(input, "!");

        expect(
            screen.queryByRole("button", { name: "元のタイトルに戻す" }),
        ).toBeNull();
    });
});
