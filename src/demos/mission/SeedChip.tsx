/* eslint-disable no-restricted-imports */
/**
 * SeedChip — the shareable scenario seed, shown in the briefing and the debrief.
 * Renders the seed as 8-digit hex with a copy-to-clipboard affordance; replaying
 * a copied seed replays the exact shift (see seed.ts / stream/engine.ts).
 */
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

import { formatSeed } from "./seed";

export function SeedChip({ seed }: { seed: number }) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(timer.current), []);

    const copy = () => {
        void navigator.clipboard?.writeText(formatSeed(seed));
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-body-sm text-foreground-muted">Scenario seed</span>
            <code className="rounded-mithril border border-divider bg-surface px-2 py-0.5 font-mono text-body-sm tabular-nums text-foreground">
                {formatSeed(seed)}
            </code>
            <Button
                variant="minimal"
                size="small"
                aria-label="Copy seed"
                icon={<Icon icon={copied ? "tick" : "duplicate"} className="!text-current" />}
                onClick={copy}
            >
                {copied ? "Copied" : "Copy"}
            </Button>
        </div>
    );
}
