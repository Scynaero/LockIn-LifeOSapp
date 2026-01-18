import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface BodyPartProps {
    data: { [muscle: string]: number }; // 0 to 1
    side: 'front' | 'back';
    onMusclePress?: (muscle: string) => void;
    scale?: number;
}

// Colors
const COLOR_INACTIVE = '#27272A'; // Zinc 800
const COLOR_ACTIVE = '#CCFF00';   // Neon Green

// Helper to get color based on intensity
const getColor = (intensity: number = 0) => {
    if (intensity <= 0) return COLOR_INACTIVE;
    // Simple logic: if > 0, use active color. 
    // Opacity could be handled via 'fillOpacity' or distinct colors.
    // user asked for 0-1 range, let's allow opacity.
    return COLOR_ACTIVE;
};

const getOpacity = (intensity: number = 0) => {
    if (intensity <= 0) return 1;
    // Map 0.1-1.0 intensity to 0.4-1.0 opacity for better visibility
    // If it's 1 (active), fully opaque.
    return Math.max(intensity, 0.3); // Minimum visibility for active muscles
};

// Muscle Paths (Simplified Anatomical Representation)
// Note: These are simplified geometric approximations for the purpose of the demo. 
// In a real production app like Hevy, these would be artist-drawn SVGs exported to code.

const PATHS_FRONT = {
    // Upper Body
    Traps: "M65,15 Q75,20,85,25 L85,35 L70,30 Z M35,15 Q25,20,15,25 L15,35 L30,30 Z",
    Shoulders: "M15,35 Q10,40,10,50 L20,55 L25,40 Z M85,35 Q90,40,90,50 L80,55 L75,40 Z", // Deltoids
    Chest: "M30,35 L70,35 L75,55 Q50,65,25,55 Z", // Pecs
    Biceps: "M20,55 L15,70 L25,70 L25,55 Z M80,55 L85,70 L75,70 L75,55 Z",
    Forearms: "M15,70 L10,95 L22,95 L25,70 Z M85,70 L90,95 L78,95 L75,70 Z",
    Abs: "M35,55 L65,55 L62,85 L38,85 Z", // Rectus Abdominis
    Obliques: "M25,55 L35,55 L38,85 L28,80 Z M75,55 L65,55 L62,85 L72,80 Z",

    // Lower Body
    Quads: "M28,85 L48,85 L46,140 L30,140 Z M52,85 L72,85 L70,140 L54,140 Z",
    Calves: "M30,140 L46,140 L44,175 L32,175 Z M54,140 L70,140 L68,175 L56,175 Z",
    Tibialis: "M38,140 L44,140 L43,170 L39,170 Z M62,140 L56,140 L57,170 L61,170 Z", // Shin muscle highlight
};

const PATHS_BACK = {
    // Upper Body
    Traps: "M35,15 L65,15 L60,40 L40,40 Z", // Upper/Mid Traps
    Lats: "M25,40 L40,40 L42,75 L30,70 Z M75,40 L60,40 L58,75 L70,70 Z",
    Shoulders: "M15,35 Q10,40,10,50 L20,55 L25,40 Z M85,35 Q90,40,90,50 L80,55 L75,40 Z", // Rear Delts
    Triceps: "M20,55 L15,70 L25,70 L25,55 Z M80,55 L85,70 L75,70 L75,55 Z",
    Forearms: "M15,70 L10,95 L22,95 L25,70 Z M85,70 L90,95 L78,95 L75,70 Z",
    LowerBack: "M42,75 L58,75 L58,85 L42,85 Z", // Erectors

    // Lower Body
    Glutes: "M30,85 L70,85 L68,105 L32,105 Z",
    Hamstrings: "M32,105 L48,105 L46,140 L30,140 Z M68,105 L52,105 L54,140 L70,140 Z",
    Calves: "M30,140 L46,140 L44,175 L32,175 Z M54,140 L70,140 L68,175 L56,175 Z",
};

// Muscle Key Mapping: Map generic keys to component specific keys
// The 'data' prop keys might be 'chest', 'back', etc. We need to match efficiently.
const NORMALIZE_MAP: Record<string, string[]> = {
    chest: ['Chest'],
    abs: ['Abs'],
    core: ['Abs', 'Obliques'],
    obliques: ['Obliques'],
    shoulders: ['Shoulders'],
    delts: ['Shoulders'],
    biceps: ['Biceps'],
    triceps: ['Triceps'],
    arms: ['Biceps', 'Triceps', 'Forearms'],
    forearms: ['Forearms'],
    back: ['Traps', 'Lats', 'LowerBack'],
    lats: ['Lats'],
    traps: ['Traps'],
    legs: ['Quads', 'Hamstrings', 'Calves', 'Glutes'],
    quads: ['Quads'],
    quadriceps: ['Quads'],
    hamstrings: ['Hamstrings'],
    calves: ['Calves'],
    glutes: ['Glutes'],
};

export default function BodyAnatomy({ data, side, onMusclePress, scale = 1 }: BodyPartProps) {
    const paths = side === 'front' ? PATHS_FRONT : PATHS_BACK;

    // Helper to find intensity for a specific muscle group path (e.g., 'Chest')
    // We scan the data keys (e.g. 'chest': 1) and see if they map to this path.
    const getIntensity = (pathKey: string) => {
        let maxInt = 0;

        // Iterate over data entries
        Object.entries(data).forEach(([muscleName, intensity]) => {
            const targets = NORMALIZE_MAP[muscleName.toLowerCase()];
            if (targets && targets.includes(pathKey)) {
                if (intensity > maxInt) maxInt = intensity;
            } else if (muscleName.toLowerCase() === pathKey.toLowerCase()) {
                if (intensity > maxInt) maxInt = intensity;
            }
        });
        return maxInt;
    };

    return (
        <View style={{ width: 100 * scale, height: 200 * scale }}>
            <Svg width="100%" height="100%" viewBox="0 0 100 200">
                <G>
                    {/* Render all paths */}
                    {Object.entries(paths).map(([key, d]) => {
                        const intensity = getIntensity(key);
                        const color = getColor(intensity);
                        const opacity = getOpacity(intensity);

                        return (
                            <Path
                                key={key}
                                d={d}
                                fill={color}
                                fillOpacity={opacity}
                                stroke="#18181B" // Outline color (background) to separate muscles
                                strokeWidth="1"
                                onPress={() => onMusclePress && onMusclePress(key)}
                            />
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
}
