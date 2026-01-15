import React, { useEffect } from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { View, Text } from 'react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
    progress: number; // 0 to 1 (Legacy usage, or Total)
    segments?: { value: number; color: string }[]; // New usage
    size?: number;
    strokeWidth?: number;
    color?: string; // Legacy usage
    showText?: boolean;
}

// Sub-component to handle individual segment animation logic safely
const RingSegment = ({ radius, strokeWidth, color, circumference, value, startAngle, size, progressShared }: any) => {
    const animatedProps = useAnimatedProps(() => {
        // Calculate offset based on the shared 0->1 animation
        const currentVal = value * progressShared.value;
        const offset = circumference * (1 - currentVal);
        return {
            strokeDashoffset: offset,
        };
    }, [circumference, value, progressShared]);

    return (
        <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation={startAngle}
            origin={`${size / 2}, ${size / 2}`}
        />
    );
};

export const ProgressRing = ({
    progress,
    segments,
    size = 120,
    strokeWidth = 10,
    color = "#CCFF00",
    showText = true
}: ProgressRingProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    // Normalize: If segments exist, use them. Else use legacy single progress.
    const data = segments || [{ value: progress, color: color }];
    const totalProgress = segments ? segments.reduce((acc, curr) => acc + curr.value, 0) : progress;

    const progressValue = useSharedValue(0);

    useEffect(() => {
        progressValue.value = withTiming(1, { duration: 1000 });
    }, [segments, progress]); // Re-animate on change

    let accumulated = 0;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    {/* Background Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#27272A" // zinc-800
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />

                    {data.map((seg, i) => {
                        const startAngle = accumulated * 360;
                        accumulated += seg.value;

                        return (
                            <RingSegment
                                key={i}
                                radius={radius}
                                strokeWidth={strokeWidth}
                                color={seg.color}
                                circumference={circumference}
                                value={seg.value}
                                startAngle={startAngle}
                                size={size}
                                progressShared={progressValue}
                            />
                        );
                    })}
                </G>
            </Svg>
            {showText && (
                <View className="absolute items-center justify-center">
                    <Text className="text-white font-bold text-xl">
                        {Math.round(totalProgress * 100)}%
                    </Text>
                </View>
            )}
        </View>
    );
};
