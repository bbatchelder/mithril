import type { ComponentType } from "react";

import type { IconName } from "@/components/ui/icon";
import { ProjectBoard } from "./board/ProjectBoard";
import { MissionControl } from "./mission/MissionControl";
import { SocConsole } from "./soc/SocConsole";

export interface DemoEntry {
    id: string;
    title: string;
    description: string;
    /** Glyph shown on the demo's landing-page card. */
    icon: IconName;
    component: ComponentType;
}

/**
 * Registry of full-app demos. The landing app gallery renders one card per entry
 * (alongside the Component Showcase) and the router renders the selected demo
 * full-bleed. Add new demos here.
 */
export const DEMOS: DemoEntry[] = [
    {
        id: "soc",
        title: "Sentinel SOC",
        description: "Security operations console — triage, investigate, and respond to alerts.",
        icon: "shield",
        component: SocConsole,
    },
    {
        id: "board",
        title: "Orbit Board",
        description: "Kanban project board — drag tasks across columns, filter, and edit details inline.",
        icon: "list-columns",
        component: ProjectBoard,
    },
    {
        id: "mission",
        title: "Skylark",
        description: "Drone-swarm mission control — a live MapLibre map and streaming telemetry from a seeded mock-data engine.",
        icon: "satellite",
        component: MissionControl,
    },
];
