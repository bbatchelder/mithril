/**
 * Skylark — detected map "targets" and their AI-derived intelligence.
 *
 * A target is a point of interest the swarm's onboard vision/fusion model has
 * picked out of the sensor feed (a vehicle convoy, a vessel, a heat source …).
 * Each carries a bundle of *AI-classified facts*, and this slice exists to exercise
 * {@link AIExplainability}: every fact records its own provenance — confidence
 * (High / Medium / Low), whether it's been verified, and what (if anything) it's
 * grounded in.
 *
 * Facts are **tiered** (0 = a low-confidence, ungrounded guess … 2 = a verified,
 * grounded, human-reviewed fact). The starting tiers are randomised per fact from a
 * seeded PRNG, so each target reads differently. Tasking a drone to investigate (see
 * `stream/useStream.ts`) *raises* each fact's tier — which is the whole point of the
 * "Task drone to investigate" flow: the intelligence improves and the confidence
 * ratings climb once a drone has actually been there.
 *
 * Stored facts are "raw" (label, value, tier, candidate sources). The display model
 * — chip color, provenance states, confidence block, grounding — is *derived* from
 * the tier via {@link deriveFact}, so mutating a tier re-renders everything for free.
 */
import type {
    AIConfidence,
    AIGroundingSource,
    AIModelContext,
    AIProvenanceState,
} from "@/components/ui/ai-explainability";
import type { IconName } from "@/components/ui/icon";
import type { TagIntent } from "@/components/ui/tag";
import type { Intent } from "@/lib/types";

import { Rng } from "./prng";
import { type LngLat, type SensorKind, MAP_CENTER } from "./data";

// ─── Priority ────────────────────────────────────────────────────────────────

export type TargetPriority = "critical" | "elevated" | "routine";

export interface PriorityMeta {
    label: string;
    intent: TagIntent;
    /** Hex used for the map marker canvas (not token-driven). */
    color: string;
    icon: IconName;
}

export const PRIORITY_META: Record<TargetPriority, PriorityMeta> = {
    critical: { label: "Critical", intent: "danger", color: "#cd4246", icon: "warning-sign" },
    elevated: { label: "Elevated", intent: "warning", color: "#c87619", icon: "flag" },
    routine: { label: "Routine", intent: "primary", color: "#2d72d2", icon: "eye-open" },
};

// ─── Confidence tiers ────────────────────────────────────────────────────────

const MODEL = "skylark-fusion-v3";

interface Tier {
    confidence: string;
    chipIntent: Intent;
    verified: boolean;
    method: AIConfidence["method"];
    tone: AIConfidence["tone"];
    detail: string;
    /** How many of the fact's candidate sources are revealed at this tier. */
    sourceCount: number;
}

/** Index 0 → 2 is increasing trust; investigation bumps a fact's index upward. */
const TIERS: Tier[] = [
    {
        confidence: "Low",
        chipIntent: "warning",
        verified: false,
        method: "self-reported",
        tone: "caution",
        detail: "Model's own estimate — treat as a lead, not a fact",
        sourceCount: 0,
    },
    {
        confidence: "Medium",
        chipIntent: "primary",
        verified: false,
        method: "logprob",
        tone: "neutral",
        detail: "Derived from the classifier's log-probabilities",
        sourceCount: 1,
    },
    {
        confidence: "High",
        chipIntent: "success",
        verified: true,
        method: "human",
        tone: "positive",
        detail: "Confirmed by a close-pass sensor re-acquisition + analyst review",
        sourceCount: 2,
    },
];

export const MAX_TIER = TIERS.length - 1;

// ─── Stored ("raw") + derived fact shapes ────────────────────────────────────

/** The stored fact — only `tier` / `upgraded` / `atMin` mutate over the sim. */
export interface RawFact {
    id: string;
    label: string;
    value: string;
    /** Current confidence tier (0–2). Raised by investigation. */
    tier: number;
    /** True once investigation has bumped this fact above its starting tier. */
    upgraded: boolean;
    /** Candidate grounding sources, revealed as the tier rises. */
    sources: AIGroundingSource[];
    /** Base "minutes ago" for the model footer; reset to 0 ("just now") on upgrade. */
    atMin: number;
}

/** The display model `FactRow` consumes — fully derived from a {@link RawFact}. */
export interface TargetFact {
    id: string;
    label: string;
    value: string;
    confidence: string;
    chipIntent: Intent;
    verified: boolean;
    upgraded: boolean;
    states: AIProvenanceState[];
    confidenceDetail: AIConfidence;
    grounding: AIGroundingSource[];
    model: AIModelContext;
}

/** Project a stored fact into its full explainability display model. */
export function deriveFact(f: RawFact): TargetFact {
    const t = TIERS[f.tier];
    const grounding = f.sources.slice(0, t.sourceCount);
    const grounded = grounding.length > 0;

    const states: AIProvenanceState[] = [
        { label: "AI-classified", tone: "info" },
        t.verified
            ? { label: "verified", tone: "positive", icon: "tick-circle" }
            : { label: "unverified", tone: "caution" },
        grounded ? { label: "grounded", tone: "positive" } : { label: "ungrounded", tone: "neutral" },
    ];

    return {
        id: f.id,
        label: f.label,
        value: f.value,
        confidence: t.confidence,
        chipIntent: t.chipIntent,
        verified: t.verified,
        upgraded: f.upgraded,
        states,
        confidenceDetail: { label: t.confidence, method: t.method, detail: t.detail, tone: t.tone },
        grounding,
        model: { model: MODEL, at: f.atMin === 0 ? "just now" : `${f.atMin}m ago`, retrieval: grounded },
    };
}

// ─── Track lifecycle (fog of war) ────────────────────────────────────────────

/**
 * A target's detection state. Targets spawn `undetected` (hidden — not rendered,
 * not selectable) on a seeded schedule across the shift. A drone whose sensor
 * footprint covers the target detects it → `active`. An active track left with
 * no sensor coverage for too long goes `stale` (last-known position, ghost
 * marker) and must be re-acquired by flying a drone back over it.
 */
export type TrackState = "undetected" | "active" | "stale";

// ─── Investigation state ─────────────────────────────────────────────────────

export type InvestigationStatus = "idle" | "enroute" | "investigating" | "complete";

export interface TargetInvestigation {
    status: InvestigationStatus;
    /** The tasked drone, once one has been dispatched. */
    droneId?: string;
    droneCallsign?: string;
}

// ─── Target ──────────────────────────────────────────────────────────────────

export interface Target {
    id: string;
    /** Phonetic designation, e.g. "TGT-ALPHA". */
    designation: string;
    category: string;
    classification: string;
    icon: IconName;
    priority: TargetPriority;
    /** The sensor that fully resolves this category — any other caps facts at Medium. */
    bestSensor: SensorKind;
    position: LngLat;
    /** Tick the target appears in the world (still undetected until found). */
    spawnTick: number;
    track: TrackState;
    /** Last tick a drone's sensor footprint covered this target. */
    lastSeenTick: number;
    /** Callsign of the drone that first detected it ("" until detected). */
    detectedBy: string;
    /** Mission-elapsed time of first detection, e.g. "T+04:12" ("" until detected). */
    detectedAt: string;
    summary: string;
    facts: RawFact[];
    investigation: TargetInvestigation;
}

/** Roll-up provenance for the whole target, derived from its current facts. */
export function deriveOverall(target: Target): {
    states: AIProvenanceState[];
    confidence: AIConfidence;
    grounding: AIGroundingSource[];
    model: AIModelContext;
} {
    const facts = target.facts;
    const n = facts.length;
    const verifiedCount = facts.filter((f) => TIERS[f.tier].verified).length;
    const groundedCount = facts.filter((f) => TIERS[f.tier].sourceCount > 0).length;
    const tone: AIConfidence["tone"] =
        verifiedCount >= n - 1 ? "positive" : verifiedCount <= 1 ? "caution" : "neutral";

    // Aggregate distinct grounding sources currently revealed across all facts.
    const seen = new Set<string>();
    const grounding: AIGroundingSource[] = [];
    for (const f of facts) {
        for (const s of f.sources.slice(0, TIERS[f.tier].sourceCount)) {
            const key = String(s.title);
            if (!seen.has(key)) {
                seen.add(key);
                grounding.push(s);
            }
        }
    }

    return {
        states: [
            { label: "AI-classified", tone: "info" },
            verifiedCount > 0
                ? { label: `${verifiedCount}/${n} verified`, tone: "positive", icon: "tick-circle" }
                : { label: "unverified", tone: "caution" },
        ],
        confidence: {
            label: verifiedCount >= n - 1 ? "High" : verifiedCount <= 1 ? "Low" : "Mixed",
            method: "llm-judge",
            detail: `Aggregated across ${n} attributes, ${groundedCount} grounded in sensor data`,
            tone,
        },
        grounding: grounding.length > 0 ? grounding.slice(0, 3) : [],
        model: { model: MODEL, at: target.detectedAt, retrieval: groundedCount > 0 },
    };
}

/**
 * Raise every fact's confidence tier — the payload of a completed investigation.
 * Each fact climbs 1–2 tiers, and anything that actually moved is flagged
 * `upgraded` and stamped "just now". The investigating drone's sensor matters:
 * only the category's {@link Target.bestSensor} can take facts to High — any
 * other sensor caps the climb at tier 1 (Medium), and never *lowers* a fact
 * that already sits above the cap. Returns the total tiers raised (the game
 * engine converts this into intel score).
 */
export function upgradeTarget(target: Target, rng: Rng, sensor: SensorKind): number {
    const cap = sensor === target.bestSensor ? MAX_TIER : 1;
    let raised = 0;
    for (const f of target.facts) {
        const next = Math.min(cap, f.tier + rng.int(1, 2));
        if (next > f.tier) {
            raised += next - f.tier;
            f.tier = next;
            f.upgraded = true;
            f.atMin = 0;
        }
    }
    return raised;
}

// ─── Generators ──────────────────────────────────────────────────────────────

const DESIGNATIONS = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HOTEL"];

// Starting tiers — weighted low so investigation has room to raise confidence.
const TIER_DECK = [0, 0, 1, 1, 2];

const SENSOR_SOURCES: { title: string; meta: string }[] = [
    { title: "EO/IR capture", meta: "frame 4821" },
    { title: "LiDAR return", meta: "92% match" },
    { title: "Thermal signature", meta: "ΔT 6.4°C" },
    { title: "SIGINT intercept", meta: "2.41 GHz" },
    { title: "Multispectral pass", meta: "bands 3–7" },
    { title: "Prior detection", meta: "cross-ref" },
];

interface CategorySpec {
    category: string;
    icon: IconName;
    /** The sensor that resolves this category to High confidence. */
    bestSensor: SensorKind;
    classifications: string[];
    facts: (rng: Rng) => { label: string; value: string }[];
}

const CATEGORIES: CategorySpec[] = [
    {
        category: "Vehicle convoy",
        icon: "drive-time",
        bestSensor: "eo-ir",
        classifications: ["3× light utility trucks", "Mixed wheeled column", "2× SUV + cargo truck"],
        facts: (rng) => [
            { label: "Composition", value: `${rng.int(3, 5)} vehicles` },
            { label: "Heading", value: `${rng.int(0, 359)}° ${rng.pick(["NE", "NW", "SE", "SW"])}` },
            { label: "Ground speed", value: `${rng.int(15, 55)} km/h` },
            { label: "Occupancy (est.)", value: `${rng.int(6, 18)} personnel` },
            { label: "Affiliation", value: rng.pick(["Unknown", "Civilian pattern", "Non-cooperative"]) },
        ],
    },
    {
        category: "Surface vessel",
        icon: "ship",
        bestSensor: "eo-ir",
        classifications: ["Coastal fishing trawler", "Fast inshore craft", "Mid-size cargo hull"],
        facts: (rng) => [
            { label: "Hull length", value: `${rng.int(12, 64)} m` },
            { label: "Heading", value: `${rng.int(0, 359)}° true` },
            { label: "Speed", value: `${rng.int(4, 22)} kn` },
            { label: "Registry", value: rng.pick(["AIS silent", "Flag obscured", "Civil registry"]) },
            { label: "Cargo signature", value: rng.pick(["Indeterminate", "Containerized", "Open deck"]) },
        ],
    },
    {
        category: "Fixed structure",
        icon: "office",
        bestSensor: "lidar",
        classifications: ["Warehouse / depot", "Low-rise compound", "Utility substation"],
        facts: (rng) => [
            { label: "Footprint", value: `${rng.int(200, 1800)} m²` },
            { label: "Thermal activity", value: rng.pick(["Elevated", "Nominal", "Cold"]) },
            { label: "Occupancy (est.)", value: rng.pick(["Active", "Sparse", "Vacant"]) },
            { label: "Recent change", value: rng.pick(["New vehicles", "Roof modification", "None detected"]) },
            { label: "Construction", value: rng.pick(["Steel frame", "Masonry", "Prefab panel"]) },
        ],
    },
    {
        category: "Personnel group",
        icon: "people",
        bestSensor: "eo-ir",
        classifications: ["Dismounted group", "Gathering / crowd", "Small foot patrol"],
        facts: (rng) => [
            { label: "Group size", value: `${rng.int(4, 30)} people` },
            { label: "Movement", value: rng.pick(["Stationary", "Dispersing", "Moving north"]) },
            { label: "Posture", value: rng.pick(["Routine", "Coordinated", "Alerted"]) },
            { label: "Equipment", value: rng.pick(["None visible", "Handheld", "Indeterminate"]) },
            { label: "Dwell time", value: `${rng.int(2, 40)} min` },
        ],
    },
    {
        category: "Heat source",
        icon: "flame",
        bestSensor: "thermal",
        classifications: ["Open burn / fire", "Vehicle exhaust plume", "Generator signature"],
        facts: (rng) => [
            { label: "Peak temp", value: `${rng.int(60, 540)} °C` },
            { label: "Trend", value: rng.pick(["Rising", "Steady", "Cooling"]) },
            { label: "Spectral match", value: rng.pick(["Hydrocarbon", "Biomass", "Unclassified"]) },
            { label: "Extent", value: `${rng.int(2, 40)} m across` },
            { label: "Persistence", value: `${rng.int(1, 25)} min` },
        ],
    },
    {
        category: "RF emitter",
        icon: "globe-network",
        bestSensor: "sigint",
        classifications: ["Unknown transmitter", "Mesh radio node", "Burst emitter"],
        facts: (rng) => [
            { label: "Band", value: `${rng.range(0.4, 5.8).toFixed(2)} GHz` },
            { label: "Signal strength", value: `${rng.int(-92, -42)} dBm` },
            { label: "Modulation", value: rng.pick(["FHSS", "QAM-16", "Unclassified"]) },
            { label: "Bearing", value: `${rng.int(0, 359)}° from BASE-01` },
            { label: "Duty cycle", value: rng.pick(["Continuous", "Bursty", "Intermittent"]) },
        ],
    },
];

const PRIORITY_DECK: TargetPriority[] = ["critical", "elevated", "elevated", "routine", "routine"];

const SUMMARY: Record<TargetPriority, (cat: string) => string> = {
    critical: (c) => `${c} flagged for immediate operator review — multiple low-confidence attributes need confirmation.`,
    elevated: (c) => `${c} tracked and partially verified. Recommend a closer pass to resolve open facts.`,
    routine: (c) => `${c} logged for situational awareness. No action required at this time.`,
};

function buildFact(rng: Rng, base: { label: string; value: string }, idx: number, designation: string): RawFact {
    // Two distinct candidate sources, revealed progressively as the tier rises.
    const pool = [...SENSOR_SOURCES];
    const sources: AIGroundingSource[] = [];
    for (let k = 0; k < 2; k++) {
        const s = pool.splice(rng.int(0, pool.length - 1), 1)[0];
        sources.push({ title: s.title, meta: s.meta, href: "#" });
    }
    return {
        id: `${designation}-f${idx}`,
        label: base.label,
        value: base.value,
        tier: rng.pick(TIER_DECK),
        upgraded: false,
        sources,
        atMin: rng.int(1, 9),
    };
}

/**
 * Build the (deterministic, seeded) full target roster for a shift of
 * `shiftTicks` ticks. Every target exists from the start of the sim, but each
 * carries a `spawnTick` — the moment it appears in the world — spread across the
 * shift on an escalation curve (spawns come *faster* as the shift wears on). The
 * first two are live at tick 0 so the opening patrol picture isn't empty. All
 * spawn undetected; detection is the game (see `stream/engine.ts`).
 */
export function makeTargets(shiftTicks: number): Target[] {
    // A dedicated seed, independent of the telemetry stream's.
    const rng = new Rng(0x7a26e7);
    const count = 7;

    return Array.from({ length: count }, (_, i) => {
        const designation = `TGT-${DESIGNATIONS[i]}`;
        const cat = CATEGORIES[i % CATEGORIES.length];
        const priority = rng.pick(PRIORITY_DECK);
        const facts = cat.facts(rng).map((f, idx) => buildFact(rng, f, idx, designation));

        // Escalation curve: the sub-linear exponent shrinks the gap between
        // consecutive spawns, so contacts arrive denser later in the shift.
        // Jittered, but capped at 88% of the shift so the last one is findable.
        const frac = i < 2 ? 0 : 0.85 * Math.pow((i - 1) / (count - 2), 0.7) + rng.range(-0.04, 0.04);
        const spawnTick = Math.round(shiftTicks * Math.min(0.88, Math.max(0, frac)));

        return {
            id: designation.toLowerCase(),
            designation,
            category: cat.category,
            classification: rng.pick(cat.classifications),
            icon: cat.icon,
            priority,
            bestSensor: cat.bestSensor,
            position: [
                MAP_CENTER[0] + rng.range(-0.075, 0.075),
                MAP_CENTER[1] + rng.range(-0.05, 0.05),
            ] as LngLat,
            spawnTick,
            track: "undetected",
            lastSeenTick: 0,
            detectedBy: "",
            detectedAt: "",
            summary: SUMMARY[priority](cat.category),
            facts,
            investigation: { status: "idle" },
        } satisfies Target;
    });
}
