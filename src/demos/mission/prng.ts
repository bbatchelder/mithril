/**
 * mulberry32 — a tiny, fast, seedable PRNG.
 *
 * The Skylark demo seeds this once and advances it one step per simulation tick,
 * so the entire "live" stream is **deterministic across reloads** (same seed →
 * same sequence of drone movements, telemetry, and events). This keeps the demo
 * reproducible and screenshot-stable while still feeling live. The map *tiles*
 * come from the network, but the data layered on top does not.
 */
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return function next(): number {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** A small seeded RNG with convenience helpers used by the stream generators. */
export class Rng {
    private next: () => number;

    constructor(seed: number) {
        this.next = mulberry32(seed);
    }

    /** Float in [0, 1). */
    float(): number {
        return this.next();
    }

    /** Float in [min, max). */
    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    /** Integer in [min, max] inclusive. */
    int(min: number, max: number): number {
        return Math.floor(this.range(min, max + 1));
    }

    /** True with probability p. */
    chance(p: number): boolean {
        return this.next() < p;
    }

    /** Pick a random element. */
    pick<T>(arr: readonly T[]): T {
        return arr[Math.floor(this.next() * arr.length)];
    }
}
