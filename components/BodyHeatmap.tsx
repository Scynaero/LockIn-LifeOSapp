import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, RadialGradient, LinearGradient, Stop } from 'react-native-svg';

// Map of MuscleID -> Intensity (0.0 to 1.0)
export type MuscleIntensityMap = { [muscleId: string]: number };

interface BodyHeatmapProps {
    frontData: MuscleIntensityMap;
    backData: MuscleIntensityMap;
    viewSide: 'front' | 'back';
    // Separate data for primary vs secondary muscles
    frontPrimaryData?: MuscleIntensityMap;
    backPrimaryData?: MuscleIntensityMap;
    frontSecondaryData?: MuscleIntensityMap;
    backSecondaryData?: MuscleIntensityMap;
    primaryColor?: string;
    scale?: number;
    onMusclePress?: (muscleId: string) => void;
}

// ------------------------------------------------------------------
// 1. PLACEHOLDER PATHS (Granular Structure)
// ------------------------------------------------------------------
// Reusing existing paths where they match, placeholders for new granularity.
// User can replace "M0 0 L0 0 Z" with real paths later.

const BODY_PATHS = {
    front: {
        // Torso
        chest_upper: "M30,35 L70,35 L75,45 Q50,55,25,45 Z", // Top half of previous Chest
        chest_lower: "M25,45 L75,45 L75,55 Q50,65,25,55 Z", // Bottom half
        abs_upper: "M35,55 L65,55 L64,70 L36,70 Z",
        abs_lower: "M36,70 L64,70 L62,85 L38,85 Z",
        obliques: "M25,55 L35,55 L38,85 L28,80 Z M75,55 L65,55 L62,85 L72,80 Z", // Combined for now
        traps: "M65,15 Q75,20,85,25 L85,35 L70,30 Z M35,15 Q25,20,15,25 L15,35 L30,30 Z",

        // Arms
        shoulders_front: "M15,35 Q10,40,10,50 L20,55 L25,40 Z", // Left
        shoulders_side: "M85,35 Q90,40,90,50 L80,55 L75,40 Z", // Right (mirrored logic for simplicity in id mapping)
        // Note: Ideally these should be specific. For now mapping existing shoulder paths.

        biceps: "M20,55 L15,70 L25,70 L25,55 Z M80,55 L85,70 L75,70 L75,55 Z",
        forearms_anterior: "M15,70 L10,95 L22,95 L25,70 Z M85,70 L90,95 L78,95 L75,70 Z",

        // Legs
        quads: "M28,85 L48,85 L46,140 L30,140 Z M52,85 L72,85 L70,140 L54,140 Z",
        calves_front: "M38,140 L44,140 L43,170 L39,170 Z M62,140 L56,140 L57,170 L61,170 Z", // Actually Tibialis in old map?
        // Tibialis was separate, but user asked for calves_front.
    },
    back: {
        // Torso
        traps: "M35,15 L65,15 L60,40 L40,40 Z",
        lats: "M25,40 L40,40 L42,75 L30,70 Z M75,40 L60,40 L58,75 L70,70 Z",
        lower_back: "M42,75 L58,75 L58,85 L42,85 Z",

        // Arms
        shoulders_rear: "M15,35 Q10,40,10,50 L20,55 L25,40 Z M85,35 Q90,40,90,50 L80,55 L75,40 Z",
        triceps_long: "M20,55 L15,70 L25,70 L25,55 Z", // Left
        triceps_short: "M80,55 L85,70 L75,70 L75,55 Z", // Right (Split for granularity)

        // Legs
        glutes: "M30,85 L70,85 L68,105 L32,105 Z",
        hamstrings: "M32,105 L48,105 L46,140 L30,140 Z M68,105 L52,105 L54,140 L70,140 Z",
        calves_rear: "M30,140 L46,140 L44,175 L32,175 Z M54,140 L70,140 L68,175 L56,175 Z",
    }
};

// Start with standard map, but this should ideally be handled by parent or a helper
const NORMALIZE_MAP: Record<string, string[]> = {
    // Front
    'chest': ['chest_upper', 'chest_lower'],
    'pectoralis major': ['chest_upper', 'chest_lower'],
    'abs': ['abs_upper', 'abs_lower'],
    'obliques': ['obliques'],
    'core': ['abs_upper', 'abs_lower', 'obliques'],
    'shoulders': ['shoulders_front', 'shoulders_side'],
    'delts': ['shoulders_front', 'shoulders_side'],
    'biceps': ['biceps'],
    'forearms': ['forearms_anterior'],
    'quads': ['quads'],
    'quadriceps': ['quads'],
    'calves': ['calves_front'], // default to front if generic
    'tibialis': ['calves_front'],

    // Back
    'traps': ['traps'],
    'lats': ['lats'],
    'back': ['lats', 'traps', 'lower_back'],
    'lower back': ['lower_back'],
    'triceps': ['triceps_long', 'triceps_short'],
    'glutes': ['glutes'],
    'hamstrings': ['hamstrings'],
};

export default function BodyHeatmap({
    frontData,
    backData,
    viewSide,
    frontPrimaryData,
    backPrimaryData,
    frontSecondaryData,
    backSecondaryData,
    primaryColor = '#00EAFF',
    scale = 1,
    onMusclePress
}: BodyHeatmapProps) {

    const currentPaths = viewSide === 'front' ? BODY_PATHS.front : BODY_PATHS.back;
    const activeData = viewSide === 'front' ? frontData : backData;
    const primaryData = viewSide === 'front' ? (frontPrimaryData || frontData) : (backPrimaryData || backData);
    const secondaryData = viewSide === 'front' ? (frontSecondaryData || {}) : (backSecondaryData || {});

    // Helper to resolve intensity handling mapping
    const getMuscleIntensity = (muscleId: string): number => {
        // 1. Direct match
        if (activeData[muscleId] !== undefined) return activeData[muscleId];

        // 2. Reverse lookup in normalization map (inefficient but works for small sets)
        // If data has 'chest: 1' and muscleId is 'chest_upper', we need to find it.
        let maxInt = 0;

        // Iterate over the DATA (smaller set)
        Object.entries(activeData).forEach(([key, val]) => {
            const normalized = key.toLowerCase();
            const mapped = NORMALIZE_MAP[normalized];

            // Check composite keys logic from previous fix
            const parts = normalized.split(/[,\/]/).map(p => p.trim());
            for (const part of parts) {
                const targets = NORMALIZE_MAP[part] || NORMALIZE_MAP[normalized];
                if (targets && targets.includes(muscleId)) {
                    if (val > maxInt) maxInt = val;
                }
            }
        });

        return maxInt;
    };

    const getMuscleStyle = (muscleId: string) => {
        // Check if muscle is in primary or secondary data
        const primaryIntensity = getMuscleIntensityFromData(muscleId, primaryData);
        const secondaryIntensity = getMuscleIntensityFromData(muscleId, secondaryData);

        // Primary takes precedence
        if (primaryIntensity > 0) {
            return {
                fill: 'url(#neonBlue)', // Bright cyan for primary
                fillOpacity: 0.6 + (primaryIntensity * 0.3), // 0.6-0.9 opacity
                stroke: '#00EAFF',
                strokeWidth: 1.5,
                strokeOpacity: 0.8,
                opacity: 1
            };
        }

        if (secondaryIntensity > 0) {
            return {
                fill: 'url(#neonGreen)', // Dimmer green for secondary
                fillOpacity: 0.3 + (secondaryIntensity * 0.2), // 0.3-0.5 opacity
                stroke: '#00FF88',
                strokeWidth: 1.0,
                strokeOpacity: 0.5,
                opacity: 1
            };
        }

        return { opacity: 0 };
    };

    // Helper to get intensity from specific dataset
    const getMuscleIntensityFromData = (muscleId: string, data: MuscleIntensityMap): number => {
        if (data[muscleId] !== undefined) return data[muscleId];

        let maxInt = 0;
        Object.entries(data).forEach(([key, val]) => {
            const normalized = key.toLowerCase();
            const parts = normalized.split(/[,\/]/).map(p => p.trim());
            for (const part of parts) {
                const targets = NORMALIZE_MAP[part] || NORMALIZE_MAP[normalized];
                if (targets && targets.includes(muscleId)) {
                    if (val > maxInt) maxInt = val;
                }
            }
        });
        return maxInt;
    };

    return (
        <View style={{ width: 100 * scale, height: 200 * scale }}>
            <Svg width="100%" height="100%" viewBox="0 0 100 200">
                <Defs>
                    {/* Layer 1: Lighting & Gradients */}

                    {/* Glass Base: Metallic/Glass look for inactive body */}
                    <LinearGradient id="glassBase" x1="0" y1="0" x2="0" y2="100%">
                        <Stop offset="0%" stopColor="#2C2C2E" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
                    </LinearGradient>

                    {/* Neon Blue (Primary Glow) */}
                    <RadialGradient
                        id="neonBlue"
                        cx="50%" cy="50%" rx="50%" ry="50%"
                        fx="50%" fy="50%"
                        gradientUnits="userSpaceOnUse"
                    >
                        <Stop offset="0%" stopColor="#00EAFF" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#00EAFF" stopOpacity="0" />
                    </RadialGradient>

                    {/* Neon Green (Secondary Glow) */}
                    <RadialGradient
                        id="neonGreen"
                        cx="50%" cy="50%" rx="50%" ry="50%"
                        fx="50%" fy="50%"
                        gradientUnits="userSpaceOnUse"
                    >
                        <Stop offset="0%" stopColor="#00FF88" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* Layer 2: The Base Silhouette */}
                <G id="base_body">
                    {/* Render ALL paths as base glass structure */}
                    {Object.entries(currentPaths).map(([key, d]) => (
                        <Path
                            key={`${key}-base`}
                            d={d}
                            fill="url(#glassBase)"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="0.5"
                            onPress={() => onMusclePress && onMusclePress(key)}
                        />
                    ))}
                </G>

                {/* Layer 3: The Active Glow Layer */}
                <G id="active_muscles">
                    {/* Loop through same paths, but apply glow style */}
                    {Object.entries(currentPaths).map(([key, d]) => {
                        const style = getMuscleStyle(key);
                        return (
                            <Path
                                key={`${key}-glow`}
                                d={d}
                                fill={style.fill}
                                fillOpacity={style.fillOpacity}
                                stroke={style.stroke}
                                strokeWidth={style.strokeWidth}
                                strokeOpacity={style.strokeOpacity}
                                opacity={style.opacity}
                                onPress={() => onMusclePress && onMusclePress(key)}
                            />
                        );
                    })}
                </G>

            </Svg>
        </View>
    );
}
