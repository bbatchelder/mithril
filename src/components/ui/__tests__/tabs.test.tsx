import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Tab, Tabs } from "../tabs";

/**
 * Behavior + ARIA tests for Tabs (built on @radix-ui/react-tabs). The visual harness
 * cannot see keyboard handling or ARIA wiring, so this is the regression net.
 *
 * Default activation is "automatic": arrow keys move focus AND select. "manual" mode
 * moves focus only; Enter/Space selects. Arrows are orientation-specific (Left/Right for
 * horizontal, Up/Down for vertical), per WAI-ARIA / Radix.
 */

function renderTabs(props?: {
    vertical?: boolean;
    activationMode?: "automatic" | "manual";
    onChange?: (id: string | number, prev: string | number | undefined) => void;
}) {
    return render(
        <Tabs
            id="t"
            defaultSelectedTabId="alpha"
            vertical={props?.vertical}
            activationMode={props?.activationMode}
            onChange={props?.onChange}
        >
            <Tab id="alpha" title="Alpha" panel={<p>Panel Alpha</p>} />
            <Tab id="beta" title="Beta" panel={<p>Panel Beta</p>} />
            <Tab id="gamma" title="Gamma" disabled panel={<p>Panel Gamma</p>} />
            <Tab id="delta" title="Delta" panel={<p>Panel Delta</p>} />
        </Tabs>,
    );
}

const tab = (name: string) => screen.getByRole("tab", { name });

describe("Tabs — ARIA structure", () => {
    it("exposes a tablist with horizontal orientation by default", () => {
        renderTabs();
        expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
    });

    it("marks vertical tablists aria-orientation=vertical", () => {
        renderTabs({ vertical: true });
        expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    });

    it("wires aria-selected and links each tab to its panel", () => {
        renderTabs();
        const alpha = tab("Alpha");
        const beta = tab("Beta");

        expect(alpha).toHaveAttribute("aria-selected", "true");
        expect(beta).toHaveAttribute("aria-selected", "false");

        // The active tab controls a tabpanel that is labelled back by the tab.
        const panelId = alpha.getAttribute("aria-controls")!;
        const panel = document.getElementById(panelId)!;
        expect(panel).toHaveAttribute("role", "tabpanel");
        expect(panel).toHaveAttribute("aria-labelledby", alpha.id);
    });

    it("uses Radix's roving-focus model: the tablist is the single tab stop", () => {
        renderTabs();
        // The tablist container carries tabindex=0 (Tab reaches it); the individual
        // tabs rove at -1 until focus enters and arrows move between them.
        expect(screen.getByRole("tablist")).toHaveAttribute("tabindex", "0");
        expect(tab("Alpha")).toHaveAttribute("tabindex", "-1");
        expect(tab("Beta")).toHaveAttribute("tabindex", "-1");
    });

    it("renders only the selected tab's panel (inactive panels unmount)", () => {
        renderTabs();
        expect(screen.getByText("Panel Alpha")).toBeVisible();
        expect(screen.queryByText("Panel Beta")).not.toBeInTheDocument();
    });

    it("disables the gamma tab", () => {
        renderTabs();
        expect(tab("Gamma")).toBeDisabled();
    });
});

describe("Tabs — mouse activation", () => {
    it("selects a tab on click and fires onChange", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderTabs({ onChange });

        await user.click(tab("Beta"));

        expect(tab("Beta")).toHaveAttribute("aria-selected", "true");
        expect(tab("Alpha")).toHaveAttribute("aria-selected", "false");
        expect(onChange).toHaveBeenCalledWith("beta", "alpha");
        expect(screen.getByText("Panel Beta")).toBeVisible();
    });

    it("does not select a disabled tab on click", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderTabs({ onChange });

        await user.click(tab("Gamma"));

        expect(tab("Gamma")).toHaveAttribute("aria-selected", "false");
        expect(onChange).not.toHaveBeenCalled();
    });

    it("after activation the roving tabindex follows the selection", async () => {
        const user = userEvent.setup();
        renderTabs();

        await user.click(tab("Beta"));
        expect(tab("Beta")).toHaveAttribute("tabindex", "0");
        expect(tab("Alpha")).toHaveAttribute("tabindex", "-1");
    });
});

describe("Tabs — keyboard navigation (automatic activation, default)", () => {
    it("ArrowRight moves focus to the next enabled tab AND selects it", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderTabs({ onChange });

        tab("Alpha").focus();
        await user.keyboard("{ArrowRight}");

        expect(tab("Beta")).toHaveFocus();
        expect(tab("Beta")).toHaveAttribute("aria-selected", "true");
        expect(onChange).toHaveBeenCalledWith("beta", "alpha");
    });

    it("skips disabled tabs when navigating", async () => {
        const user = userEvent.setup();
        renderTabs();

        tab("Beta").focus();
        await user.keyboard("{ArrowRight}");

        // Gamma is disabled → focus + selection land on Delta.
        expect(tab("Delta")).toHaveFocus();
        expect(tab("Delta")).toHaveAttribute("aria-selected", "true");
    });

    it("wraps around at both ends", async () => {
        const user = userEvent.setup();
        renderTabs();

        tab("Delta").focus();
        await user.keyboard("{ArrowRight}");
        expect(tab("Alpha")).toHaveFocus();

        await user.keyboard("{ArrowLeft}");
        expect(tab("Delta")).toHaveFocus();
    });

    it("Home/End jump to the first/last enabled tab", async () => {
        const user = userEvent.setup();
        renderTabs();

        tab("Beta").focus();
        await user.keyboard("{End}");
        expect(tab("Delta")).toHaveFocus();

        await user.keyboard("{Home}");
        expect(tab("Alpha")).toHaveFocus();
    });

    it("uses Up/Down (not Left/Right) for vertical tabs", async () => {
        const user = userEvent.setup();
        renderTabs({ vertical: true });

        tab("Alpha").focus();
        await user.keyboard("{ArrowDown}");
        expect(tab("Beta")).toHaveFocus();
        expect(tab("Beta")).toHaveAttribute("aria-selected", "true");
    });
});

describe("Tabs — keyboard navigation (manual activation)", () => {
    it("arrows move focus only; Enter selects", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderTabs({ activationMode: "manual", onChange });

        tab("Alpha").focus();
        await user.keyboard("{ArrowRight}");

        // Focus moved, selection unchanged.
        expect(tab("Beta")).toHaveFocus();
        expect(tab("Alpha")).toHaveAttribute("aria-selected", "true");
        expect(onChange).not.toHaveBeenCalled();

        await user.keyboard("{Enter}");
        expect(tab("Beta")).toHaveAttribute("aria-selected", "true");
        expect(onChange).toHaveBeenCalledWith("beta", "alpha");
    });

    it("Space selects the focused tab in manual mode", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderTabs({ activationMode: "manual", onChange });

        tab("Alpha").focus();
        await user.keyboard("{ArrowRight}{ArrowRight}"); // Beta → Delta (skip disabled Gamma)
        await user.keyboard(" ");

        expect(tab("Delta")).toHaveAttribute("aria-selected", "true");
        expect(onChange).toHaveBeenCalledWith("delta", "alpha");
    });
});

describe("Tabs — controlled mode", () => {
    it("defers selection to the controller (does not self-update)", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Tabs id="c" selectedTabId="alpha" onChange={onChange}>
                <Tab id="alpha" title="Alpha" panel={<p>A</p>} />
                <Tab id="beta" title="Beta" panel={<p>B</p>} />
            </Tabs>,
        );

        await user.click(screen.getByRole("tab", { name: "Beta" }));

        expect(onChange).toHaveBeenCalledWith("beta", "alpha");
        expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
    });
});
