/* eslint-disable no-restricted-imports */
/**
 * MissionMap — the live map pane. A demo-local wrapper around MapLibre GL,
 * inspired by mapcn's copy-paste approach (CARTO basemap, no API key).
 *
 * Drones, trails, and uplinks are rendered as GeoJSON sources/layers (so we get
 * native clustering and good perf), updated in place every tick via setData.
 * Heading is shown with per-status arrow icons drawn to a canvas at load time
 * (no glyph/font dependency for the markers themselves).
 */
import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { type BlueUnit, type IsrRequest, BLUE_STATUS_META } from "./blue";
import { type Drone, GROUND_STATION, MAP_CENTER, MAP_ZOOM, SENSOR_META, STATUS_META } from "./data";
import { type FireMission, BLAST_RADIUS, JAM_RADIUS } from "./stream/engine";
import { type Target, type TargetPriority, PRIORITY_META } from "./targets";

const STYLE = {
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

const STATUSES = ["active", "returning", "charging", "idle", "anomaly", "lost"] as const;
const PRIORITIES = ["critical", "elevated", "routine"] as const;
const BLUE_STATUSES = ["moving", "holding", "rerouting", "hit"] as const;
/** Revealed-hostile marker color (red diamond — unit symbology, vs the blue diamonds). */
const HOSTILE_COLOR = "#cd4246";

interface MissionMapProps {
    drones: Drone[];
    targets: Target[];
    blues: BlueUnit[];
    /** ISR requests — active ones draw a coverage ring. */
    isr: IsrRequest[];
    /** External-fire rounds in flight — each draws a blast ring at its aim point. */
    fires: FireMission[];
    selectedId: string | null;
    selectedTargetId: string | null;
    selectedBlueId: string | null;
    onSelect: (id: string | null) => void;
    onSelectTarget: (id: string | null) => void;
    onSelectBlue: (id: string | null) => void;
    autoFollow: boolean;
    /** Rotate the map so the selected drone always faces up (its heading = "up"). */
    matchOrientation: boolean;
    /** Shift run counter — when it changes (restart) the accumulated trails reset. */
    epoch?: number;
    dark: boolean;
    className?: string;
}

// ─── GeoJSON builders ────────────────────────────────────────────────────────

function dronesFC(drones: Drone[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: drones.map((d) => ({
            type: "Feature",
            id: undefined,
            properties: {
                id: d.id,
                callsign: d.callsign,
                status: d.status,
                heading: d.heading,
                battery: Math.round(d.battery),
            },
            geometry: { type: "Point", coordinates: d.position },
        })),
    };
}

/**
 * Real link-state geometry: every linked airborne drone draws a line to its
 * uplink parent (base, or the relay bird it chains through); a severed drone
 * draws a small red dashed ring instead — no path home until it flies clear
 * of the jamming / back into range.
 */
function linksFC(drones: Drone[]): GeoJSON.FeatureCollection {
    const base = GROUND_STATION.position;
    const byId: Record<string, Drone> = {};
    for (const d of drones) byId[d.id] = d;
    return {
        type: "FeatureCollection",
        features: drones
            .filter((d) => d.status === "active" || d.status === "anomaly" || d.status === "returning")
            .map((d) => {
                if (!d.linked) {
                    return {
                        type: "Feature",
                        properties: { state: "severed" },
                        geometry: { type: "LineString", coordinates: ring(d.position, 0.0045) },
                    } satisfies GeoJSON.Feature;
                }
                const parent = d.linkParent && d.linkParent !== "base" ? byId[d.linkParent]?.position ?? base : base;
                return {
                    type: "Feature",
                    properties: { state: "linked" },
                    geometry: { type: "LineString", coordinates: [d.position, parent] },
                } satisfies GeoJSON.Feature;
            }),
    };
}

/**
 * Denial rings around live jammers the operator can see — drawn at the track
 * position (last-known for a stale track), so a moved jammer can jam from
 * outside its drawn ring until the track is re-acquired.
 */
function jamZonesFC(targets: Target[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: targets
            .filter((t) => t.jammer && !t.struck)
            .map((t) => ({
                type: "Feature",
                properties: { designation: t.designation },
                geometry: {
                    type: "Polygon",
                    coordinates: [ring(t.track === "stale" ? t.lastKnownPosition : t.position, JAM_RADIUS)],
                },
            })),
    };
}

function trailsFC(trails: Record<string, [number, number][]>, drones: Drone[]): GeoJSON.FeatureCollection {
    const status: Record<string, string> = {};
    for (const d of drones) status[d.id] = d.status;
    return {
        type: "FeatureCollection",
        features: Object.entries(trails)
            .filter(([, pts]) => pts.length > 1)
            .map(([id, pts]) => ({
                type: "Feature",
                properties: { id, status: status[id] ?? "idle" },
                geometry: { type: "LineString", coordinates: pts },
            })),
    };
}

function targetsFC(targets: Target[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: targets.map((t) => ({
            type: "Feature",
            properties: {
                id: t.id,
                designation: t.designation,
                priority: t.priority,
                track: t.track,
                hostile: t.affiliationKnown && t.affiliation === "hostile",
                struck: t.struck,
            },
            // Hostiles drift — a stale ghost renders where the operator last
            // saw it, not at the live (hidden) position.
            geometry: { type: "Point", coordinates: t.track === "stale" ? t.lastKnownPosition : t.position },
        })),
    };
}

/** Circle in degree space — matching the engine's planar `dist()`. */
function ring(center: [number, number], r: number): [number, number][] {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        pts.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r]);
    }
    return pts;
}

/**
 * Sensor footprints: one circle per airborne drone — the drawn edge IS the
 * detection boundary.
 */
function footprintsFC(drones: Drone[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: drones
            .filter((d) => d.status === "active" || d.status === "anomaly" || d.status === "returning")
            .map((d) => ({
                type: "Feature",
                properties: {},
                geometry: { type: "Polygon", coordinates: [ring(d.position, SENSOR_META[d.sensor].range)] },
            })),
    };
}

function bluesFC(blues: BlueUnit[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: blues.map((b) => ({
            type: "Feature",
            properties: { id: b.id, callsign: b.callsign, status: b.status },
            geometry: { type: "Point", coordinates: b.position },
        })),
    };
}

function blueRoutesFC(blues: BlueUnit[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: blues
            .filter((b) => b.route.length > 1)
            .map((b) => ({
                type: "Feature",
                properties: { id: b.id },
                geometry: { type: "LineString", coordinates: [...b.route, b.route[0]] },
            })),
    };
}

/** Coverage rings for the ISR requests whose window is currently open. */
function isrFC(isr: IsrRequest[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: isr
            .filter((r) => r.status === "active")
            .map((r) => ({
                type: "Feature",
                properties: { from: r.from },
                geometry: { type: "Polygon", coordinates: [ring(r.position, r.radius)] },
            })),
    };
}

/** Blast rings at the aim points of external-fire rounds in flight. */
function firesFC(fires: FireMission[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: fires.map((f) => ({
            type: "Feature",
            properties: { id: f.id },
            geometry: { type: "Polygon", coordinates: [ring(f.position, BLAST_RADIUS)] },
        })),
    };
}

/** Lines from each tasked drone to the target it's investigating. */
function taskingFC(drones: Drone[], targets: Target[]): GeoJSON.FeatureCollection {
    const byId: Record<string, Target> = {};
    for (const t of targets) byId[t.id] = t;
    return {
        type: "FeatureCollection",
        features: drones
            .filter((d) => d.assignment && byId[d.assignment.targetId])
            .map((d) => ({
                type: "Feature",
                properties: { phase: d.assignment!.phase, kind: d.assignment!.kind },
                geometry: {
                    type: "LineString",
                    coordinates: [d.position, byId[d.assignment!.targetId].position],
                },
            })),
    };
}

const statusColorExpr: maplibregl.ExpressionSpecification = [
    "match",
    ["get", "status"],
    "active", STATUS_META.active.color,
    "returning", STATUS_META.returning.color,
    "charging", STATUS_META.charging.color,
    "idle", STATUS_META.idle.color,
    "anomaly", STATUS_META.anomaly.color,
    "lost", STATUS_META.lost.color,
    STATUS_META.idle.color,
];

// ─── Per-status arrow icons (canvas → addImage) ──────────────────────────────

function makeArrowIcon(color: string): ImageData {
    const s = 28;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, s, s);
    // Upward chevron/triangle (north). icon-rotate spins it to heading.
    ctx.beginPath();
    ctx.moveTo(s / 2, 3);
    ctx.lineTo(s - 6, s - 5);
    ctx.lineTo(s / 2, s - 10);
    ctx.lineTo(6, s - 5);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.stroke();
    return ctx.getImageData(0, 0, s, s);
}

// A targeting reticle: four corner brackets + a center dot, in the priority color.
// The bracket shape reads unmistakably as "target" so it can't be confused with the
// drone arrows. Drawn with a white halo first for contrast on either basemap.
function makeTargetIcon(color: string): ImageData {
    const s = 30;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, s, s);
    const m = 4; // margin
    const len = 8; // bracket arm length
    const corners: [number, number, number, number][] = [
        [m, m, 1, 1], // top-left  (dx, dy direction)
        [s - m, m, -1, 1], // top-right
        [m, s - m, 1, -1], // bottom-left
        [s - m, s - m, -1, -1], // bottom-right
    ];
    const drawBrackets = (stroke: string, width: number) => {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        for (const [x, y, dx, dy] of corners) {
            ctx.beginPath();
            ctx.moveTo(x + dx * len, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x, y + dy * len);
            ctx.stroke();
        }
    };
    drawBrackets("rgba(255,255,255,0.9)", 4.5);
    drawBrackets(color, 2.5);
    // Center dot (haloed).
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.stroke();
    return ctx.getImageData(0, 0, s, s);
}

// A struck target: a bold X with a white halo — unmistakably "destroyed", drawn
// where the contact died. One gray ghost regardless of what the strike found.
function makeStruckIcon(color: string): ImageData {
    const s = 26;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, s, s);
    const m = 7;
    const drawX = (stroke: string, width: number) => {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m, m);
        ctx.lineTo(s - m, s - m);
        ctx.moveTo(s - m, m);
        ctx.lineTo(m, s - m);
        ctx.stroke();
    };
    drawX("rgba(255,255,255,0.9)", 6);
    drawX(color, 3.5);
    return ctx.getImageData(0, 0, s, s);
}

// A filled diamond with a white halo — military unit symbology, distinct from
// both the drone arrows and the target reticles. Blue for friendlies (per
// status), red for a revealed hostile.
function makeDiamondIcon(color: string): ImageData {
    const s = 26;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, s, s);
    const half = 8;
    ctx.beginPath();
    ctx.moveTo(s / 2, s / 2 - half);
    ctx.lineTo(s / 2 + half, s / 2);
    ctx.lineTo(s / 2, s / 2 + half);
    ctx.lineTo(s / 2 - half, s / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.stroke();
    return ctx.getImageData(0, 0, s, s);
}

// ─── Component ─────────────────────────────────────────────────────────────

export function MissionMap({ drones, targets, blues, isr, fires, selectedId, selectedTargetId, selectedBlueId, onSelect, onSelectTarget, onSelectBlue, autoFollow, matchOrientation, epoch = 0, dark, className }: MissionMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MlMap | null>(null);
    const readyRef = useRef(false);
    const trailsRef = useRef<Record<string, [number, number][]>>({});
    // Keep the latest world state in refs so the load/styledata handlers can seed it.
    const targetsRef = useRef(targets);
    targetsRef.current = targets;
    const bluesRef = useRef(blues);
    bluesRef.current = blues;
    const isrRef = useRef(isr);
    isrRef.current = isr;
    const firesRef = useRef(fires);
    firesRef.current = fires;

    // Latest props for the once-bound interaction handlers.
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const onSelectTargetRef = useRef(onSelectTarget);
    onSelectTargetRef.current = onSelectTarget;
    const onSelectBlueRef = useRef(onSelectBlue);
    onSelectBlueRef.current = onSelectBlue;

    // ── Mount / unmount ───────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        const map = new maplibregl.Map({
            container: containerRef.current,
            style: dark ? STYLE.dark : STYLE.light,
            center: MAP_CENTER,
            zoom: MAP_ZOOM,
            attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        const onLoad = () => {
            installLayers(map);
            readyRef.current = true;
            updateData(map, drones, trailsRef.current, targetsRef.current, bluesRef.current, isrRef.current, firesRef.current);
        };
        map.on("load", onLoad);

        // Interaction handlers (bound once).
        map.on("click", "drone-arrow", (e) => {
            const f = e.features?.[0];
            if (f) onSelectRef.current(String(f.properties?.id));
        });
        map.on("click", "target-marker", (e) => {
            const f = e.features?.[0];
            if (f) onSelectTargetRef.current(String(f.properties?.id));
        });
        map.on("click", "blue-marker", (e) => {
            const f = e.features?.[0];
            if (f) onSelectBlueRef.current(String(f.properties?.id));
        });
        map.on("click", "clusters", (e) => {
            const f = e.features?.[0];
            const clusterId = f?.properties?.cluster_id;
            const src = map.getSource("drones") as GeoJSONSource | undefined;
            if (clusterId == null || !src) return;
            void src.getClusterExpansionZoom(clusterId).then((zoom) => {
                map.easeTo({ center: (f!.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
            });
        });
        map.on("click", (e) => {
            const hits = map.queryRenderedFeatures(e.point, {
                layers: ["drone-arrow", "clusters", "target-marker", "blue-marker"],
            });
            if (hits.length === 0) {
                onSelectRef.current(null);
                onSelectTargetRef.current(null);
                onSelectBlueRef.current(null);
            }
        });
        for (const layer of ["drone-arrow", "clusters", "target-marker", "blue-marker"]) {
            map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
            map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
        }

        // MapLibre's own CSS forces `position: relative` on the container, so the
        // map must get its height from an explicit `h-full` (not absolute inset-0).
        // A ResizeObserver keeps the canvas in sync as the flex layout settles/changes.
        const ro = new ResizeObserver(() => map.resize());
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            readyRef.current = false;
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Theme change → swap basemap, then reinstall our layers ──────────────
    const firstThemeRun = useRef(true);
    useEffect(() => {
        if (firstThemeRun.current) {
            firstThemeRun.current = false;
            return;
        }
        const map = mapRef.current;
        if (!map) return;
        readyRef.current = false;
        map.setStyle(dark ? STYLE.dark : STYLE.light);
        map.once("styledata", () => {
            installLayers(map);
            readyRef.current = true;
            updateData(map, drones, trailsRef.current, targetsRef.current, bluesRef.current, isrRef.current, firesRef.current);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dark]);

    // ── Restart (epoch change) → drop trails from the previous shift ────────
    const prevEpoch = useRef(epoch);
    useEffect(() => {
        if (prevEpoch.current !== epoch) {
            prevEpoch.current = epoch;
            trailsRef.current = {};
        }
    }, [epoch]);

    // ── Live data → update sources + trails + selection + autofollow ────────
    useEffect(() => {
        // Accumulate position trails (dedupe identical points e.g. while paused).
        const trails = trailsRef.current;
        for (const d of drones) {
            const arr = (trails[d.id] ??= []);
            const last = arr[arr.length - 1];
            if (!last || last[0] !== d.position[0] || last[1] !== d.position[1]) {
                arr.push([d.position[0], d.position[1]]);
                if (arr.length > 24) arr.shift();
            }
        }

        const map = mapRef.current;
        if (!map || !readyRef.current) return;
        updateData(map, drones, trails, targets, blues, isr, fires);

        // Selected ring filters.
        if (map.getLayer("drone-selected")) {
            map.setFilter("drone-selected", ["==", ["get", "id"], selectedId ?? "__none__"]);
        }
        if (map.getLayer("target-selected")) {
            map.setFilter("target-selected", ["==", ["get", "id"], selectedTargetId ?? "__none__"]);
        }
        if (map.getLayer("blue-selected")) {
            map.setFilter("blue-selected", ["==", ["get", "id"], selectedBlueId ?? "__none__"]);
        }

        // Auto-follow and/or rotate the map to the selected drone. Both target the
        // same camera, so fold them into one easeTo: center on follow, set the map
        // bearing to the drone's heading on match-orientation (so it points "up").
        const sel = selectedId ? drones.find((d) => d.id === selectedId) : null;
        if (sel && (autoFollow || matchOrientation)) {
            const camera: maplibregl.EaseToOptions = { duration: 800 };
            if (autoFollow) camera.center = sel.position;
            if (matchOrientation) camera.bearing = sel.heading;
            map.easeTo(camera);
        }
    }, [drones, targets, blues, isr, fires, selectedId, selectedTargetId, selectedBlueId, autoFollow, matchOrientation]);

    // ── Match-orientation toggled off → straighten the map back to north-up ──
    const prevMatch = useRef(matchOrientation);
    useEffect(() => {
        const map = mapRef.current;
        if (map && prevMatch.current && !matchOrientation) {
            map.easeTo({ bearing: 0, duration: 600 });
        }
        prevMatch.current = matchOrientation;
    }, [matchOrientation]);

    return <div ref={containerRef} className={className} />;
}

// ─── Layer installation (idempotent) ─────────────────────────────────────────

function installLayers(map: MlMap) {
    // Register arrow icons.
    for (const s of STATUSES) {
        const name = `arrow-${s}`;
        if (!map.hasImage(name)) map.addImage(name, makeArrowIcon(STATUS_META[s].color));
    }
    // Register target reticle icons (per priority, plus the gray stale ghost).
    for (const p of PRIORITIES) {
        const name = `target-${p}`;
        if (!map.hasImage(name)) map.addImage(name, makeTargetIcon(PRIORITY_META[p as TargetPriority].color));
    }
    if (!map.hasImage("target-stale")) map.addImage("target-stale", makeTargetIcon("#8f99a8"));
    if (!map.hasImage("target-struck")) map.addImage("target-struck", makeStruckIcon("#5f6b7c"));
    // Unit diamonds: one per blue status, plus the revealed-hostile red. A blue
    // status without a registered image silently renders nothing (same gotcha
    // as the drone arrows) — keep BLUE_STATUSES in sync with `BlueStatus`.
    for (const s of BLUE_STATUSES) {
        const name = `blue-${s}`;
        if (!map.hasImage(name)) map.addImage(name, makeDiamondIcon(BLUE_STATUS_META[s].color));
    }
    if (!map.hasImage("target-hostile")) map.addImage("target-hostile", makeDiamondIcon(HOSTILE_COLOR));

    if (!map.getSource("footprints")) {
        map.addSource("footprints", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("jamzones")) {
        map.addSource("jamzones", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("isr")) {
        map.addSource("isr", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("fires")) {
        map.addSource("fires", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("blue-routes")) {
        map.addSource("blue-routes", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("blues")) {
        map.addSource("blues", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("trails")) {
        map.addSource("trails", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("uplinks")) {
        map.addSource("uplinks", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("base")) {
        map.addSource("base", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: GROUND_STATION.position } }],
            },
        });
    }
    if (!map.getSource("drones")) {
        map.addSource("drones", { type: "geojson", data: emptyFC(), cluster: true, clusterRadius: 40, clusterMaxZoom: 10 });
    }
    if (!map.getSource("targets")) {
        map.addSource("targets", { type: "geojson", data: emptyFC() });
    }
    if (!map.getSource("tasking")) {
        map.addSource("tasking", { type: "geojson", data: emptyFC() });
    }

    // Footprints first — they underlay everything else.
    if (!map.getLayer("footprint-fill")) {
        map.addLayer({
            id: "footprint-fill",
            type: "fill",
            source: "footprints",
            paint: { "fill-color": "#2d72d2", "fill-opacity": 0.05 },
        });
    }
    if (!map.getLayer("footprint-line")) {
        map.addLayer({
            id: "footprint-line",
            type: "line",
            source: "footprints",
            paint: { "line-color": "#2d72d2", "line-width": 1, "line-opacity": 0.25, "line-dasharray": [2, 3] },
        });
    }
    // Jammer denial rings — violet, labelled, around every visible live jammer.
    if (!map.getLayer("jam-fill")) {
        map.addLayer({
            id: "jam-fill",
            type: "fill",
            source: "jamzones",
            paint: { "fill-color": "#7961db", "fill-opacity": 0.07 },
        });
    }
    if (!map.getLayer("jam-line")) {
        map.addLayer({
            id: "jam-line",
            type: "line",
            source: "jamzones",
            paint: { "line-color": "#7961db", "line-width": 1.5, "line-opacity": 0.6, "line-dasharray": [3, 2] },
        });
    }
    if (!map.getLayer("jam-label")) {
        map.addLayer({
            id: "jam-label",
            type: "symbol",
            source: "jamzones",
            layout: {
                "text-field": "JAMMING",
                "text-font": ["Open Sans Semibold"],
                "text-size": 10,
            },
            paint: {
                "text-color": "#7961db",
                "text-halo-color": "rgba(255,255,255,0.9)",
                "text-halo-width": 1.2,
            },
        });
    }
    // ISR coverage rings — amber, labelled, only while the window is open.
    if (!map.getLayer("isr-fill")) {
        map.addLayer({
            id: "isr-fill",
            type: "fill",
            source: "isr",
            paint: { "fill-color": "#c87619", "fill-opacity": 0.07 },
        });
    }
    if (!map.getLayer("isr-line")) {
        map.addLayer({
            id: "isr-line",
            type: "line",
            source: "isr",
            paint: { "line-color": "#c87619", "line-width": 1.5, "line-opacity": 0.6, "line-dasharray": [3, 2] },
        });
    }
    if (!map.getLayer("isr-label")) {
        map.addLayer({
            id: "isr-label",
            type: "symbol",
            source: "isr",
            layout: {
                "text-field": ["concat", "ISR · ", ["get", "from"]],
                "text-font": ["Open Sans Semibold"],
                "text-size": 10,
            },
            paint: {
                "text-color": "#c87619",
                "text-halo-color": "rgba(255,255,255,0.9)",
                "text-halo-width": 1.2,
            },
        });
    }
    // Inbound-fires blast rings — red, labelled, while a round is in flight.
    if (!map.getLayer("fires-fill")) {
        map.addLayer({
            id: "fires-fill",
            type: "fill",
            source: "fires",
            paint: { "fill-color": "#cd4246", "fill-opacity": 0.12 },
        });
    }
    if (!map.getLayer("fires-line")) {
        map.addLayer({
            id: "fires-line",
            type: "line",
            source: "fires",
            paint: { "line-color": "#cd4246", "line-width": 2, "line-opacity": 0.8, "line-dasharray": [2, 1.5] },
        });
    }
    if (!map.getLayer("fires-label")) {
        map.addLayer({
            id: "fires-label",
            type: "symbol",
            source: "fires",
            layout: {
                "text-field": "FIRES INBOUND",
                "text-font": ["Open Sans Semibold"],
                "text-size": 10,
            },
            paint: {
                "text-color": "#cd4246",
                "text-halo-color": "rgba(255,255,255,0.9)",
                "text-halo-width": 1.2,
            },
        });
    }
    if (!map.getLayer("blue-route-line")) {
        map.addLayer({
            id: "blue-route-line",
            type: "line",
            source: "blue-routes",
            paint: { "line-color": "#2d72d2", "line-width": 1.5, "line-opacity": 0.25, "line-dasharray": [3, 2] },
        });
    }
    if (!map.getLayer("trail-line")) {
        map.addLayer({
            id: "trail-line",
            type: "line",
            source: "trails",
            paint: { "line-color": statusColorExpr, "line-width": 2, "line-opacity": 0.35 },
            layout: { "line-cap": "round", "line-join": "round" },
        });
    }
    if (!map.getLayer("uplink-line")) {
        map.addLayer({
            id: "uplink-line",
            type: "line",
            source: "uplinks",
            filter: ["==", ["get", "state"], "linked"],
            paint: { "line-color": "#5f6b7c", "line-width": 1, "line-opacity": 0.4, "line-dasharray": [2, 2] },
        });
    }
    // A severed drone has no path home — a red dashed ring marks it (jammed or
    // out of range; the telemetry panel's link tag says which).
    if (!map.getLayer("uplink-severed")) {
        map.addLayer({
            id: "uplink-severed",
            type: "line",
            source: "uplinks",
            filter: ["==", ["get", "state"], "severed"],
            paint: { "line-color": "#cd4246", "line-width": 1.5, "line-opacity": 0.8, "line-dasharray": [2, 1.5] },
        });
    }
    if (!map.getLayer("tasking-line")) {
        map.addLayer({
            id: "tasking-line",
            type: "line",
            source: "tasking",
            paint: {
                // Tasking intent by color: strike runs red, designation amber,
                // investigation the usual blue.
                "line-color": [
                    "match",
                    ["get", "kind"],
                    "strike", "#cd4246",
                    "designate", "#c87619",
                    "#2d72d2",
                ],
                "line-width": 2.5,
                "line-opacity": 0.9,
                "line-dasharray": [1.5, 1.2],
            },
            layout: { "line-cap": "round" },
        });
    }
    if (!map.getLayer("base-dot")) {
        map.addLayer({
            id: "base-dot",
            type: "circle",
            source: "base",
            paint: {
                "circle-radius": 7,
                "circle-color": "#404854",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2,
            },
        });
    }
    // ── Blue units (diamonds) — ground/surface layer, under the drones ──
    if (!map.getLayer("blue-selected")) {
        map.addLayer({
            id: "blue-selected",
            type: "circle",
            source: "blues",
            filter: ["==", ["get", "id"], "__none__"],
            paint: {
                "circle-radius": 15,
                "circle-color": "rgba(45,114,210,0.18)",
                "circle-stroke-color": "#2d72d2",
                "circle-stroke-width": 2,
            },
        });
    }
    if (!map.getLayer("blue-marker")) {
        map.addLayer({
            id: "blue-marker",
            type: "symbol",
            source: "blues",
            layout: {
                "icon-image": ["concat", "blue-", ["get", "status"]],
                "icon-allow-overlap": true,
                "icon-size": 0.85,
            },
        });
    }
    if (!map.getLayer("blue-label")) {
        map.addLayer({
            id: "blue-label",
            type: "symbol",
            source: "blues",
            minzoom: 11.5,
            layout: {
                "text-field": ["get", "callsign"],
                "text-font": ["Open Sans Semibold"],
                "text-size": 10,
                "text-offset": [0, 1.4],
                "text-anchor": "top",
                "text-allow-overlap": false,
            },
            paint: {
                "text-color": "#2d72d2",
                "text-halo-color": "rgba(255,255,255,0.9)",
                "text-halo-width": 1.2,
            },
        });
    }
    if (!map.getLayer("clusters")) {
        map.addLayer({
            id: "clusters",
            type: "circle",
            source: "drones",
            filter: ["has", "point_count"],
            paint: {
                "circle-color": "#2d72d2",
                "circle-opacity": 0.85,
                "circle-radius": ["step", ["get", "point_count"], 16, 4, 20, 8, 26],
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2,
            },
        });
    }
    if (!map.getLayer("cluster-count")) {
        map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "drones",
            filter: ["has", "point_count"],
            layout: {
                "text-field": ["get", "point_count_abbreviated"],
                "text-font": ["Open Sans Semibold"],
                "text-size": 12,
            },
            paint: { "text-color": "#ffffff" },
        });
    }
    if (!map.getLayer("drone-selected")) {
        map.addLayer({
            id: "drone-selected",
            type: "circle",
            source: "drones",
            filter: ["==", ["get", "id"], "__none__"],
            paint: {
                "circle-radius": 16,
                "circle-color": "rgba(45,114,210,0.18)",
                "circle-stroke-color": "#2d72d2",
                "circle-stroke-width": 2,
            },
        });
    }
    if (!map.getLayer("drone-arrow")) {
        map.addLayer({
            id: "drone-arrow",
            type: "symbol",
            source: "drones",
            filter: ["!", ["has", "point_count"]],
            layout: {
                "icon-image": ["concat", "arrow-", ["get", "status"]],
                "icon-rotate": ["get", "heading"],
                "icon-rotation-alignment": "map",
                "icon-allow-overlap": true,
                "icon-size": 0.7,
            },
        });
    }
    if (!map.getLayer("drone-label")) {
        map.addLayer({
            id: "drone-label",
            type: "symbol",
            source: "drones",
            filter: ["!", ["has", "point_count"]],
            minzoom: 12,
            layout: {
                "text-field": ["get", "callsign"],
                "text-font": ["Open Sans Semibold"],
                "text-size": 10,
                "text-offset": [0, 1.4],
                "text-anchor": "top",
                "text-allow-overlap": false,
            },
            paint: {
                "text-color": "#5f6b7c",
                "text-halo-color": "rgba(255,255,255,0.85)",
                "text-halo-width": 1.2,
            },
        });
    }

    // ── Targets (reticles) — drawn above drones so they read as the focus layer ──
    if (!map.getLayer("target-selected")) {
        map.addLayer({
            id: "target-selected",
            type: "circle",
            source: "targets",
            filter: ["==", ["get", "id"], "__none__"],
            paint: {
                "circle-radius": 18,
                "circle-color": "rgba(45,114,210,0.14)",
                "circle-stroke-color": "#2d72d2",
                "circle-stroke-width": 2,
            },
        });
    }
    if (!map.getLayer("target-marker")) {
        map.addLayer({
            id: "target-marker",
            type: "symbol",
            source: "targets",
            layout: {
                // Struck targets render as a gray X where they died; stale tracks
                // as gray ghosts at their last-known position; a revealed hostile
                // trades its reticle for the red unit diamond.
                "icon-image": [
                    "case",
                    ["==", ["get", "struck"], true],
                    "target-struck",
                    ["==", ["get", "track"], "stale"],
                    "target-stale",
                    ["==", ["get", "hostile"], true],
                    "target-hostile",
                    ["concat", "target-", ["get", "priority"]],
                ],
                "icon-allow-overlap": true,
                "icon-size": 0.85,
            },
            paint: {
                "icon-opacity": ["case", ["==", ["get", "track"], "stale"], 0.7, 1],
            },
        });
    }
    if (!map.getLayer("target-label")) {
        map.addLayer({
            id: "target-label",
            type: "symbol",
            source: "targets",
            minzoom: 11.5,
            layout: {
                "text-field": ["get", "designation"],
                "text-font": ["Open Sans Semibold"],
                "text-size": 10,
                "text-offset": [0, 1.5],
                "text-anchor": "top",
                "text-allow-overlap": false,
            },
            paint: {
                "text-color": "#404854",
                "text-halo-color": "rgba(255,255,255,0.9)",
                "text-halo-width": 1.2,
                "text-opacity": ["case", ["==", ["get", "track"], "stale"], 0.6, 1],
            },
        });
    }
}

function updateData(
    map: MlMap,
    drones: Drone[],
    trails: Record<string, [number, number][]>,
    targets: Target[],
    blues: BlueUnit[],
    isr: IsrRequest[],
    fires: FireMission[],
) {
    (map.getSource("drones") as GeoJSONSource | undefined)?.setData(dronesFC(drones));
    (map.getSource("footprints") as GeoJSONSource | undefined)?.setData(footprintsFC(drones));
    (map.getSource("uplinks") as GeoJSONSource | undefined)?.setData(linksFC(drones));
    (map.getSource("jamzones") as GeoJSONSource | undefined)?.setData(jamZonesFC(targets));
    (map.getSource("trails") as GeoJSONSource | undefined)?.setData(trailsFC(trails, drones));
    (map.getSource("targets") as GeoJSONSource | undefined)?.setData(targetsFC(targets));
    (map.getSource("tasking") as GeoJSONSource | undefined)?.setData(taskingFC(drones, targets));
    (map.getSource("blues") as GeoJSONSource | undefined)?.setData(bluesFC(blues));
    (map.getSource("blue-routes") as GeoJSONSource | undefined)?.setData(blueRoutesFC(blues));
    (map.getSource("isr") as GeoJSONSource | undefined)?.setData(isrFC(isr));
    (map.getSource("fires") as GeoJSONSource | undefined)?.setData(firesFC(fires));
}

function emptyFC(): GeoJSON.FeatureCollection {
    return { type: "FeatureCollection", features: [] };
}
