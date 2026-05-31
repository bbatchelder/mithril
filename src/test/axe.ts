// Lightweight axe-core integration for Vitest.
//
// Why a local helper instead of `vitest-axe`: `axe-core` is already a dev dep (added for
// the chrome MCP sweep in handoff 0070), and the published matcher package is a thin
// wrapper around exactly this. Rolling our own avoids a redundant dependency.
//
// SCOPE: jsdom has no layout engine and no real rendering, so this catches *role / name /
// ARIA / structure* regressions only — NOT color-contrast (1.4.3) or tap-target (2.5.8)
// rules, which need a real browser. This complements, and does not replace, the chrome
// axe sweep documented in handoff 0070. We disable the layout-dependent rule sets so they
// don't emit noise that masks the wiring regressions we actually want to lock in.
import axeCore, { type AxeResults, type RunOptions, type Result } from "axe-core";
import { expect } from "vitest";

// Rules that cannot be meaningfully evaluated in jsdom (no layout / paint) or that judge
// page-level structure rather than the component's own ARIA/role/name wiring this layer
// protects. Turning them off keeps results focused on the wiring we actually want to lock in.
const JSDOM_DISABLED_RULES = [
    "color-contrast", // no computed color/layout in jsdom
    "target-size", // no geometry in jsdom
    // Best-practice landmark rule: "all page content should be contained by landmarks". A bare
    // test document has no <main>/landmarks, and a portaled overlay (Radix renders the popover
    // panel at document.body) sits outside any landmark by design — so it fires here for the
    // combobox family even though the real-browser sweep (handoff 0070, real app shell with
    // landmarks) does not flag it. It judges page composition, not a component's ARIA wiring;
    // same class of dev-harness artifact as page-has-heading-one / heading-order.
    "region",
] as const;

const DEFAULT_OPTIONS: RunOptions = {
    rules: Object.fromEntries(JSDOM_DISABLED_RULES.map((id) => [id, { enabled: false }])),
};

/** Run axe-core against a container (defaults to document.body) and return the results. */
export async function axe(
    container: Element | Document = document.body,
    options: RunOptions = {},
): Promise<AxeResults> {
    return axeCore.run(container as axeCore.ElementContext, {
        ...DEFAULT_OPTIONS,
        ...options,
        rules: { ...DEFAULT_OPTIONS.rules, ...options.rules },
    });
}

function formatViolations(violations: Result[]): string {
    return violations
        .map((v) => {
            const targets = v.nodes
                .map((n) => `      • ${n.target.join(" ")}\n        ${n.failureSummary ?? ""}`)
                .join("\n");
            return `  [${v.impact ?? "?"}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${targets}`;
        })
        .join("\n\n");
}

expect.extend({
    toHaveNoViolations(received: AxeResults) {
        const { violations } = received;
        const pass = violations.length === 0;
        return {
            pass,
            message: () =>
                pass
                    ? "expected accessibility violations, but found none"
                    : `expected no accessibility violations, but found ${violations.length}:\n\n${formatViolations(
                          violations,
                      )}`,
        };
    },
});

interface AxeMatchers<R = unknown> {
    toHaveNoViolations(): R;
}

declare module "vitest" {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Assertion<T = any> extends AxeMatchers<T> {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface AsymmetricMatchersContaining extends AxeMatchers {}
}
