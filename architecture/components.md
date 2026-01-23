# Atomic Component Patterns

## Overview

This document outlines the standard patterns for building individual "atomic" components in the codebase. These components are designed to be reusable, focused, and visually consistent with the app's design system.

## General Principles

1. **Functional Components**: All components are React Function Components.
2. **TypeScript**: Props are strongly typed using interfaces.
3. **Styling**:
    - Primary: **Tailwind CSS** (via `nativewind`) using the `className` prop.
    - Dynamic/Complex: Inline `style` or `react-native-svg` props, especially when interacting with `react-native-reanimated`.
    - Colors: Use semantic names from Tailwind config (e.g., `bg-surface`, `text-primary`, `border-surfaceHighlight`) when possible, or hex codes for specific visualizations only.
4. **Animations**: Use `react-native-reanimated` for smooth, native-driver-compatible animations.
5. **Interactivity**: Use `Pressable` or `TouchableOpacity` with `expo-haptics` for tactile feedback.

## Template: Basic Interactive Component

```tsx
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

interface MyComponentProps {
    label: string;
    isActive?: boolean;
    onPress: () => void;
}

export function MyComponent({ label, isActive = false, onPress }: MyComponentProps) {
    const handlePress = () => {
        Haptics.selectionAsync(); // Standard haptic feedback
        onPress();
    };

    return (
        <Pressable
            onPress={handlePress}
            className={`flex-row items-center p-4 rounded-xl border ${
                isActive ? 'bg-surfaceHighlight border-primary' : 'bg-surface border-transparent'
            }`}
        >
            <Ionicons
                name={isActive ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={isActive ? "#CCFF00" : "#A1A1AA"} // Hex fallback or theme color
            />
            <Text className={`ml-3 font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {label}
            </Text>
        </Pressable>
    );
}
```

## Template: Visual/Animated Component

```tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressProps {
    value: number; // 0 to 1
    color?: string;
    size?: number;
}

export const ProgressIndicator = ({ value, color = "#CCFF00", size = 60 }: ProgressProps) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(value, { duration: 800 });
    }, [value]);

    const animatedProps = useAnimatedProps(() => {
        // Animation logic...
        return { strokeDashoffset: ... };
    });

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {/* SVG implementation */}
                <AnimatedCircle {...animatedProps} fill={color} />
            </Svg>
        </View>
    );
};
```

## Icons

Use `@expo/vector-icons` (typically `Ionicons` or `MaterialCommunityIcons`). Color should typically mirror the text color or be explicitly generic (e.g., "gray").

## Haptics

Always trigger `Haptics.selectionAsync()` on standard buttons/toggles to enhance the "premium" feel.
