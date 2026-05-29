/**
 * Sparkline — a tiny inline SVG line chart. Demo-local (not part of the shared
 * component library), the same way `board/Avatar` lives only in its demo.
 *
 * Colour comes from `currentColor`, so set it with a Tailwind text-* class on a
 * parent or via `className`.
 */
interface SparklineProps {
    data: number[];
    /** Fixed value range. Omit to auto-scale to the data. */
    min?: number;
    max?: number;
    width?: number;
    height?: number;
    /** Fill the area under the line at low opacity. */
    fill?: boolean;
    className?: string;
}

export function Sparkline({
    data,
    min,
    max,
    width = 120,
    height = 32,
    fill = true,
    className,
}: SparklineProps) {
    const pad = 2;
    const lo = min ?? Math.min(...(data.length ? data : [0]));
    const hi = max ?? Math.max(...(data.length ? data : [1]));
    const span = hi - lo || 1;

    const n = data.length;
    const x = (i: number) => (n <= 1 ? pad : pad + (i / (n - 1)) * (width - pad * 2));
    const y = (v: number) => pad + (1 - (v - lo) / span) * (height - pad * 2);

    if (n === 0) {
        return <svg width={width} height={height} className={className} aria-hidden />;
    }

    const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const area = `${line} L${x(n - 1).toFixed(1)},${height - pad} L${x(0).toFixed(1)},${height - pad} Z`;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={className}
            preserveAspectRatio="none"
            aria-hidden
        >
            {fill && <path d={area} fill="currentColor" opacity={0.12} />}
            <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
