import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';

interface BodyHeatmapProps {
    muscleIntensities: { [muscle: string]: number }; // 0 to 1
    side: 'front' | 'back';
    onMusclePress?: (muscle: string) => void;
    scale?: number;
}

// Color Constants
const COLOR_BASE = '#1C1C1E'; // Dark Grey for un-worked muscles
const COLOR_STROKE = '#000000'; // Separator lines
const GLOW_ID = 'neonGlow';

// Placeholder Paths (Reusing simplified ones for structure, ready for HQ replacement)
// organized by group as requested
const BODY_PATHS = {
    front: {
        torso: {
            Traps: "M65,15 Q75,20,85,25 L85,35 L70,30 Z M35,15 Q25,20,15,25 L15,35 L30,30 Z",
            Chest: "M30,35 L70,35 L75,55 Q50,65,25,55 Z",
            Abs: "M35,55 L65,55 L62,85 L38,85 Z",
            Obliques: "M25,55 L35,55 L38,85 L28,80 Z M75,55 L65,55 L62,85 L72,80 Z",
        },
        arms: {
            Shoulders: "M15,35 Q10,40,10,50 L20,55 L25,40 Z M85,35 Q90,40,90,50 L80,55 L75,40 Z",
            Biceps: "M20,55 L15,70 L25,70 L25,55 Z M80,55 L85,70 L75,70 L75,55 Z",
            Forearms: "M15,70 L10,95 L22,95 L25,70 Z M85,70 L90,95 L78,95 L75,70 Z",
        },
        legs: {
            Quads: "M28,85 L48,85 L46,140 L30,140 Z M52,85 L72,85 L70,140 L54,140 Z",
            Calves: "M30,140 L46,140 L44,175 L32,175 Z M54,140 L70,140 L68,175 L56,175 Z",
            Tibialis: "M38,140 L44,140 L43,170 L39,170 Z M62,140 L56,140 L57,170 L61,170 Z",
        }
    },
    back: {
        torso: {
            Traps: "M35,15 L65,15 L60,40 L40,40 Z",
            Lats: "M25,40 L40,40 L42,75 L30,70 Z M75,40 L60,40 L58,75 L70,70 Z",
            LowerBack: "M42,75 L58,75 L58,85 L42,85 Z",
        },
        arms: {
            Shoulders: "M15,35 Q10,40,10,50 L20,55 L25,40 Z M85,35 Q90,40,90,50 L80,55 L75,40 Z",
            Triceps: "M20,55 L15,70 L25,70 L25,55 Z M80,55 L85,70 L75,70 L75,55 Z",
            Forearms: "M15,70 L10,95 L22,95 L25,70 Z M85,70 L90,95 L78,95 L75,70 Z",
        },
        legs: {
            Glutes: "M30,85 L70,85 L68,105 L32,105 Z",
            Hamstrings: "M32,105 L48,105 L46,140 L30,140 Z M68,105 L52,105 L54,140 L70,140 Z",
            Calves: "M30,140 L46,140 L44,175 L32,175 Z M54,140 L70,140 L68,175 L56,175 Z",
        }
    }
};

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
    legs: ['Quads', 'Hamstrings', 'Calves', 'Glutes', 'Tibialis'],
    quads: ['Quads'],
    quadriceps: ['Quads'],
    hamstrings: ['Hamstrings'],
    calves: ['Calves'],
    glutes: ['Glutes'],
};

export default function BodyHeatmap({ muscleIntensities, side, onMusclePress, scale = 1 }: BodyHeatmapProps) {
    const currentPaths = side === 'front' ? BODY_PATHS.front : BODY_PATHS.back;

    // Helper to find intensity for a specific muscle group
    const getIntensity = (pathKey: string) => {
        let maxInt = 0;
        Object.entries(muscleIntensities).forEach(([muscleName, intensity]) => {
            const targets = NORMALIZE_MAP[muscleName.toLowerCase()];
            if (targets && targets.includes(pathKey)) {
                if (intensity > maxInt) maxInt = intensity;
            } else if (muscleName.toLowerCase() === pathKey.toLowerCase()) {
                if (intensity > maxInt) maxInt = intensity;
            }
        });
        return maxInt;
    };

    // Render a muscle group (Double layer: Base + Glow)
    const renderMuscle = (key: string, d: string) => {
        const intensity = getIntensity(key);

        return (
            <React.Fragment key={key}>
                {/* Base Layer */}
                <Path
                    d={d}
                    fill={COLOR_BASE}
                    stroke={COLOR_STROKE}
                    strokeWidth="0.5"
                    onPress={() => onMusclePress && onMusclePress(key)}
                />

                {/* Glow Layer - Only visible if intensity > 0 */}
                {intensity > 0 && (
                    <Path
                        d={d}
                        fill={`url(#${GLOW_ID})`}
                        fillOpacity={intensity} // Intensity controls opaqueness of the glow
                        onPress={() => onMusclePress && onMusclePress(key)}
                    />
                )}
            </React.Fragment>
        );
    };

    return (
        <View style={{ width: 100 * scale, height: 200 * scale }}>
            <Svg width="100%" height="100%" viewBox="0 0 100 200">
                <Defs>
                    <RadialGradient id={GLOW_ID} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%" gradientUnits="userSpaceOnUse">
                        <Stop offset="0%" stopColor="#FF3B30" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#FF3B30" stopOpacity="0.3" />
                    </RadialGradient>
                </Defs>

                <G>
                    {/* Render Groups Separately (Structure for future expansion) */}
                    <G id="torso">
                        {Object.entries(currentPaths.torso).map(([k, d]) => renderMuscle(k, d))}
                    </G>
                    <G id="arms">
                        {Object.entries(currentPaths.arms).map(([k, d]) => renderMuscle(k, d))}
                    </G>
                    <G id="legs">
                        {Object.entries(currentPaths.legs).map(([k, d]) => renderMuscle(k, d))}
                    </G>
                </G>
            </Svg>
        </View>
    );
}
