import { View, Text } from "react-native";
import { eachDayOfInterval, subDays, format, startOfYear, endOfYear } from "date-fns";
import { useMemo } from "react";

interface HeatmapProps {
    data: Record<string, number>; // date "YYYY-MM-DD" -> count
    startDate?: string; // "YYYY-MM-DD"
}

export const Heatmap = ({ data, startDate }: HeatmapProps) => {
    const today = new Date();
    // Show last 364 days for a full yearly view
    const daysToRender = eachDayOfInterval({ start: subDays(today, 364), end: today });

    return (
        <View className="bg-surface p-4 rounded-2xl mb-6">
            <Text className="text-secondary text-xs font-bold mb-4 tracking-widest uppercase">Yearly Consistency</Text>
            <View className="flex-row flex-wrap gap-1 justify-center">
                {daysToRender.map((date, index) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const count = data[dateStr] || 0;

                    // Check existence constraint
                    // If startDate is provided and this date is BEFORE startDate, hide it (or dim it)
                    // We treat startDate as day 0 (active).
                    const exists = startDate ? dateStr >= startDate : true;

                    if (!exists) {
                        return (
                            <View
                                key={dateStr}
                                className="w-2 h-2 rounded-sm bg-zinc-800/20" // Very faint/transparent
                            />
                        );
                    }

                    // Color scale
                    let bg = "bg-surfaceHighlight";
                    if (count === 2) bg = "bg-blue-400"; // Frozen
                    else if (count >= 1) bg = "bg-success"; // Logged

                    return (
                        <View
                            key={dateStr}
                            className={`w-2 h-2 rounded-sm ${bg}`}
                        />
                    );
                })}
            </View>
        </View>
    );
};
