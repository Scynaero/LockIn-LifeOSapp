import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface RingProps {
    radius: number;
    stroke: number;
    color: string;
    progress: number; // 0 to 1
}

const Ring = ({ radius, stroke, color, progress, hasBg = true, cx, cy }: RingProps & { hasBg?: boolean, cx: number, cy: number }) => {
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <G rotation="-90" origin={`${cx}, ${cy}`}>
            {hasBg && (
                <Circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    stroke={color}
                    strokeWidth={stroke}
                    strokeOpacity={0.2}
                />
            )}
            <Circle
                cx={cx}
                cy={cy}
                r={radius} // Use actual radius
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
            />
        </G>
    );
};

interface Props {
    move: number; // e.g., 0.7
    exercise: number;
    stand: number;
    size?: number;
}

export default function ActivityRings({ move, exercise, stand, size = 150 }: Props) {
    const center = size / 2;
    const strokeWidth = size * 0.12;
    const gap = size * 0.015; // Reduced gap for tighter rings

    // Radii
    // Radii - Increased safety buffer (-6) to fix clipping
    const r1 = size / 2 - strokeWidth / 2 - 6;
    const r2 = size / 2 - strokeWidth * 1.5 - gap - 6;
    const r3 = size / 2 - strokeWidth * 2.5 - gap * 2 - 6;

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                <G>
                    {/* Move Ring (Outer) */}
                    <Ring
                        cx={center} cy={center}
                        radius={r1}
                        stroke={strokeWidth}
                        color="#FA114F"
                        progress={move}
                    />
                    {/* Exercise Ring (Middle) */}
                    <Ring
                        cx={center} cy={center}
                        radius={r2}
                        stroke={strokeWidth}
                        color="#4EFE2F"
                        progress={exercise}
                    />
                    {/* Stand Ring (Inner) */}
                    <Ring
                        cx={center} cy={center}
                        radius={r3}
                        stroke={strokeWidth}
                        color="#00D7FE"
                        progress={stand}
                    />
                </G>
            </Svg>
        </View>
    );
}
