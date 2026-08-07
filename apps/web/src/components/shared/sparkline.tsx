/**
 * Sparkline — a pure SVG polyline chart.
 * No charting library. Accepts an array of numbers and renders a responsive
 * line that fills the available width, with a gradient fill beneath it.
 */

import * as React from "react";

export interface SparklineProps {
    /** Data points, oldest first. */
    data: number[];
    /** SVG height in px. Defaults to 48. */
    height?: number;
    /** Line stroke colour. Defaults to current white (for use on dark cards). */
    stroke?: string;
    /** Fill gradient start colour (top, more opaque). */
    fillFrom?: string;
    /** Fill gradient end colour (bottom, transparent). */
    fillTo?: string;
    className?: string;
}

function normalize(data: number[]): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map((v) => (v - min) / range);
}

export function Sparkline({
    data,
    height = 48,
    stroke = "rgba(255,255,255,0.8)",
    fillFrom = "rgba(255,255,255,0.15)",
    fillTo = "rgba(255,255,255,0)",
    className,
}: SparklineProps) {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [width, setWidth] = React.useState(300);
    // Must be called unconditionally (rules-of-hooks), even if data is short
    const gradientId = React.useId().replace(/:/g, "");

    // Observe the SVG's rendered width for true responsiveness
    React.useLayoutEffect(() => {
        if (!svgRef.current) return;
        const ro = new ResizeObserver(([entry]) => {
            if (entry) setWidth(entry.contentRect.width);
        });
        ro.observe(svgRef.current);
        return () => ro.disconnect();
    }, []);

    if (data.length < 2) return null;

    const pad = 4;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    const normalised = normalize(data);
    const stepX = innerW / (normalised.length - 1);

    const points = normalised.map((v, i) => ({
        x: pad + i * stepX,
        // Invert Y: 0 = bottom, 1 = top
        y: pad + (1 - v) * innerH,
    }));

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

    // Closed path for the gradient fill area
    const fillPath = [
        `M ${points[0]!.x},${points[0]!.y}`,
        ...points.slice(1).map((p) => `L ${p.x},${p.y}`),
        `L ${points[points.length - 1]!.x},${height}`,
        `L ${points[0]!.x},${height}`,
        "Z",
    ].join(" ");

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height={height}
            className={className}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fillFrom} />
                    <stop offset="100%" stopColor={fillTo} />
                </linearGradient>
            </defs>

            {/* Gradient fill */}
            <path d={fillPath} fill={`url(#${gradientId})`} />

            {/* Line */}
            <polyline
                points={polylinePoints}
                fill="none"
                stroke={stroke}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* End dot */}
            <circle
                cx={points[points.length - 1]!.x}
                cy={points[points.length - 1]!.y}
                r={3}
                fill={stroke}
            />
        </svg>
    );
}
