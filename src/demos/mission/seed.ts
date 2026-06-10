/**
 * Seed plumbing for Skylark — the React-layer half of "deterministic by seed".
 *
 * The engine never touches the URL, the wall clock, or `Math.random` (it must
 * stay replayable — see `stream/engine.ts`), so everything non-deterministic
 * lives here: parsing a seed out of the URL (`#mission/<seed>` or `?seed=`),
 * deriving the shared "daily" seed from today's date, and minting a fresh
 * random one. Seeds display and share as 8-digit uppercase hex.
 */

/** Format a seed for display/sharing (8-digit uppercase hex). */
export function formatSeed(seed: number): string {
    return (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/** Parse a shared seed string: hex (with or without 0x), or the word "daily". */
export function parseSeed(text: string): number | null {
    const t = text.trim().toLowerCase();
    if (t === "daily") return dailySeed();
    if (/^(0x)?[0-9a-f]{1,8}$/.test(t)) return parseInt(t.replace(/^0x/, ""), 16) >>> 0;
    return null;
}

/** Today's shared scenario — a deterministic seed derived from the local date string. */
export function dailySeed(date: Date = new Date()): number {
    const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
    // FNV-1a over the date string — stable across sessions, varies daily.
    let h = 0x811c9dc5;
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/** Mint a fresh random seed (the "new shift" button). */
export function randomSeed(): number {
    return (Math.random() * 0x1_0000_0000) >>> 0;
}

/** Read a seed from the URL — `#mission/<seed>` first, then a `?seed=` query. */
export function seedFromUrl(): number | null {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (hash.startsWith("mission/")) {
        const parsed = parseSeed(hash.slice("mission/".length));
        if (parsed !== null) return parsed;
    }
    const query = new URLSearchParams(window.location.search).get("seed");
    return query !== null ? parseSeed(query) : null;
}

/** Reflect the current seed into the URL so the scenario is shareable. */
export function writeSeedToUrl(seed: number): void {
    // replaceState fires no hashchange, so the gallery router doesn't re-route.
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#mission/${formatSeed(seed)}`);
}
