import { View, Text } from "react-native";

interface StatsProps {
    streak: number;
    completionRate: number;
}

export const StatsDashboard = ({ streak, completionRate }: StatsProps) => {
    return (
        <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-surface p-4 rounded-2xl">
                <Text className="text-secondary text-xs font-bold mb-1 tracking-widest uppercase">Current Streak</Text>
                <Text className="text-3xl font-bold text-primary">{streak} <Text className="text-base font-medium text-secondary">Days</Text></Text>
            </View>
            <View className="flex-1 bg-surface p-4 rounded-2xl">
                <Text className="text-secondary text-xs font-bold mb-1 tracking-widest uppercase">Completion</Text>
                <Text className="text-3xl font-bold text-primary">{completionRate}%</Text>
            </View>
        </View>
    );
}
