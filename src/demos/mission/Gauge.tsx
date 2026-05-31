/**
 * Gauge — a small radial SVG gauge (270° sweep). Demo-local primitive.
 *
 * `value` is 0–1. Track + arc use `currentColor` for the value arc (set via a
 * text-* class) and a muted token colour for the track.
 */
interface GaugeProps {
    /** 0–1 */
    value: number;
    /** Big number shown in the centre (already formatted). */
    display: string;
    /** Small caption under the number. */
    caption?: string;
    size?: number;
    className?: string;
}

const SWEEP = 270; // degrees
const START = 135; // start angle (bottom-left), clockwise

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
    const a = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
    const [sx, sy] = polar(cx, cy, r, startDeg);
    const [ex, ey] = polar(cx, cy, r, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

export function Gauge({ value, display, caption, size = 84, className }: GaugeProps) {
    const v = Math.max(0, Math.min(1, value));
    const r = size / 2 - 8;
    const cx = size / 2;
    const cy = size / 2;
    const track = arcPath(cx, cy, r, START, START + SWEEP);
    const arc = arcPath(cx, cy, r, START, START + SWEEP * v);

    return (
        <div className={className} style={{ width: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <path d={track} fill="none" strokeWidth={7} strokeLinecap="round" className="stroke-divider" />
                {v > 0.001 && (
                    <path d={arc} fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
                )}
                <text
                    x={cx}
                    y={cy - 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground"
                    style={{ fontSize: 16, fontWeight: 600 }}
                >
                    {display}
                </text>
                {caption && (
                    <text
                        x={cx}
                        y={cy + 15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground-muted"
                        style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                        {caption}
                    </text>
                )}
            </svg>
        </div>
    );
}
