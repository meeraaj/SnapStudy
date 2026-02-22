"use client";

interface ProgressRingProps {
    /** 0-100 */
    percent: number;
    /** Ring size in px */
    size?: number;
    /** Stroke width in px */
    strokeWidth?: number;
    /** Ring color */
    color?: string;
}

export default function ProgressRing({
    percent,
    size = 80,
    strokeWidth = 6,
    color = "var(--color-brand-500)",
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-surface-border)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <span className="absolute text-sm font-bold text-text-primary">
                {Math.round(percent)}%
            </span>
        </div>
    );
}
