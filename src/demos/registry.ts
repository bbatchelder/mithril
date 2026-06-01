import type { ComponentType } from "react";

import { ProjectBoard } from "./board/ProjectBoard";
import { MissionControl } from "./mission/MissionControl";
import { SocConsole } from "./soc/SocConsole";

export interface DemoEntry {
    id: string;
    title: string;
    description: string;
    component: ComponentType;
}

/**
 * Registry of full-app demos shown under the "Demos" view. Add new demos here —
 * the App's demos shell renders the list and the selected demo automatically.
 */
export const DEMOS: DemoEntry[] = [
    {
        id: "soc",
        title: "SOC Console",
        description: "Security Operations Center analyst console — triage, investigate, and respond to alerts.",
        component: SocConsole,
    },
    {
        id: "board",
        title: "Project Board",
        description: "Kanban project board — drag tasks across columns, filter, and edit details inline.",
        component: ProjectBoard,
    },
    {
        id: "mission",
        title: "Mission Control",
        description: "Skylark drone-swarm mission control — a live MapLibre map and streaming telemetry powered by a seeded mock-data engine.",
        component: MissionControl,
    },
];
