import { AIExplainabilityDetails } from "@/components/ui/ai-explainability";
import { Button } from "@/components/ui/button";

/**
 * Shared demo content for the AIExplainability explainability popover.
 *
 * The Component Showcase surfaces this provenance panel in two different framings: the
 * overview **preview tile** (`previews.tsx`) mocks it inside a static panel, because
 * overlays can't portal into a clipped tile, while the **playground** (`playground.tsx`)
 * feeds the very same content to a real `Popover`. Keeping the sample data — provenance
 * states, confidence, grounding, model, copy + actions — here means both surfaces stay
 * in sync: edit the example once and it changes in both places.
 */
export function AIExplainabilityDemoDetails() {
    return (
        <AIExplainabilityDetails
            states={[
                { label: "AI-authored", tone: "info" },
                { label: "human-edited", tone: "neutral", icon: "edit" },
                { label: "grounded", tone: "positive", icon: "tick-circle" },
                { label: "unverified", tone: "caution" },
            ]}
            confidence={{
                label: "High",
                method: "llm-judge",
                detail: "claude-opus-4-8, against retrieved sources",
                tone: "positive",
            }}
            grounding={[
                { title: "Q3 Financial Report.pdf", href: "#", meta: "p. 12" },
                { title: "CRM export 2026-05.csv", href: "#", meta: "rows 1–40" },
            ]}
            model={{ model: "claude-opus-4-8", at: "2h ago", retrieval: true }}
            actions={
                <>
                    <Button variant="minimal" size="small">
                        View details
                    </Button>
                    <Button intent="primary" size="small">
                        Regenerate
                    </Button>
                </>
            }
        >
            This summary was drafted by AI, then edited by an analyst. Review before relying on it.
        </AIExplainabilityDetails>
    );
}
