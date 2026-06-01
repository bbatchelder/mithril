/* eslint-disable no-restricted-imports */
import { Icon } from "@/components/ui/icon";

import { MEMBER_BY_ID } from "./data";

const SIZE_PX = { sm: 20, md: 24, lg: 32 } as const;
const FONT_PX = { sm: 9, md: 10, lg: 13 } as const;

export interface AvatarProps {
    /** Member id; when null, renders an "unassigned" placeholder. */
    memberId: string | null;
    size?: keyof typeof SIZE_PX;
    className?: string;
}

/**
 * Small circular initials avatar. Background color comes from the member record
 * (literal hex via inline style — not a Tailwind class — so it's tree-shake safe).
 * Unassigned renders a dashed gray circle with a person glyph.
 */
export function Avatar({ memberId, size = "md", className }: AvatarProps) {
    const px = SIZE_PX[size];
    const member = memberId != null ? MEMBER_BY_ID[memberId] : undefined;

    if (!member) {
        return (
            <span
                className={
                    "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-divider text-foreground-muted " +
                    (className ?? "")
                }
                style={{ width: px, height: px }}
                aria-label="Unassigned"
                title="Unassigned"
            >
                <Icon icon="person" size={Math.round(px * 0.5)} className="!text-current" />
            </span>
        );
    }

    return (
        <span
            className={
                "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white " +
                (className ?? "")
            }
            style={{ width: px, height: px, backgroundColor: member.color, fontSize: FONT_PX[size] }}
            aria-label={member.name}
            title={`${member.name} · ${member.role}`}
        >
            {member.initials}
        </span>
    );
}
