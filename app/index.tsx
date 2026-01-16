import { View, Text, Pressable, Alert } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { HabitService, Habit } from "../services/HabitService";
import { CalendarStrip } from "../components/CalendarStrip";
import { StatsDashboard } from "../components/StatsDashboard";
import { Heatmap } from "../components/Heatmap";
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { DateUtils } from "../utils/DateUtils";
import { ProgressRing } from "../components/ProgressRing";
import { LogValueModal } from "../components/LogValueModal";

export default function HomeScreen() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
    const [stats, setStats] = useState({ streak: 0, completionRate: 0, breakdown: { build: 0, quit: 0, frozen: 0, total: 0 } });
    const [logHabit, setLogHabit] = useState<Habit | null>(null);

    // ...

    const loadData = async () => {
        const dateStr = DateUtils.getDateString(selectedDate);
        // Pass the selected date to get status for THAT day
        const h = await HabitService.getHabits(dateStr);
        setHabits(h);
        const map = await HabitService.getHeatmapData();
        setHeatmapData(map);
        const s = await HabitService.getStats(dateStr);
        console.log('STATS DEBUG:', JSON.stringify(s, null, 2));
        setStats({ streak: s.currentStreak, completionRate: s.completionRate, breakdown: s.breakdown });
    };

    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                await HabitService.migrateColors();
                await HabitService.recalculateAllStreaks();
                loadData();
            };
            init();
        }, [selectedDate]) // Reload when date changes
    );

    const toggleHabit = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const dateStr = DateUtils.getDateString(selectedDate);
        await HabitService.logCompletion(id, dateStr, 1);
        loadData(); // Refresh UI
    };

    const handleLogSave = async (val: number) => {
        if (!logHabit) return;
        const dateStr = DateUtils.getDateString(selectedDate);

        let finalVal = val;
        // Convert Hours to Min for Sleep
        if (logHabit.health_type === 'sleep') {
            finalVal = Math.round(val * 60);
        }

        await HabitService.logCompletion(logHabit.id, dateStr, finalVal);
        loadData();
        setLogHabit(null);
    };

    const confirmDelete = (habit: Habit) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Delete Protocol",
            `Are you sure you want to delete "${habit.name}"? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await HabitService.deleteHabit(habit.id);
                        loadData();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-4">
            <DraggableFlatList
                data={habits}
                onDragEnd={({ data }) => {
                    setHabits(data);
                    HabitService.updateHabitOrders(data);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-3xl font-bold text-primary tracking-tighter">LOCK-IN</Text>
                            <Link href="/create" asChild>
                                <Pressable className="bg-primary w-10 h-10 rounded-full items-center justify-center active:opacity-80">
                                    <Ionicons name="add" size={24} color="black" />
                                </Pressable>
                            </Link>
                        </View>

                        <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />


                        {/* Daily Progress Widget */}
                        <View className="flex-row items-center justify-between mb-8 bg-surface p-6 rounded-3xl border border-surfaceHighlight">
                            <View>
                                <Text className="text-secondary text-xs font-bold tracking-widest mb-1 uppercase">Daily Goal</Text>
                                <Text className="text-4xl font-bold text-white mb-1 tracking-tight">
                                    {Math.round(stats.completionRate)}%
                                </Text>
                                <Text className="text-secondary text-sm font-medium">
                                    {stats.streak} Day Global Streak
                                </Text>
                            </View>
                            <ProgressRing
                                progress={stats.completionRate / 100}
                                segments={stats.breakdown.total > 0 ? [
                                    { value: stats.breakdown.build / stats.breakdown.total, color: '#CCFF00' },
                                    { value: stats.breakdown.quit / stats.breakdown.total, color: '#FF4545' },
                                    { value: stats.breakdown.frozen / stats.breakdown.total, color: '#60A5FA' }
                                ].filter(s => s.value > 0) : []}
                                size={80}
                                strokeWidth={8}
                                showText={false}
                            />
                        </View>

                        <Text className="text-secondary text-xs font-bold mb-4 tracking-widest uppercase">Today's Protocol</Text>
                    </>
                }
                ListEmptyComponent={
                    <View className="items-center justify-center py-10">
                        <Text className="text-secondary text-lg">No active protocols.</Text>
                        <Text className="text-secondary opacity-50 text-sm mt-2">Initialize a habit to begin.</Text>
                    </View>
                }
                ListFooterComponent={
                    <>
                        <Heatmap data={heatmapData} />
                        <LogValueModal
                            visible={!!logHabit}
                            habit={logHabit}
                            onClose={() => setLogHabit(null)}
                            onSave={handleLogSave}
                        />
                    </>
                }
                renderItem={({ item, drag, isActive }) => (
                    <ScaleDecorator>
                        <Pressable
                            onLongPress={() => {
                                Haptics.selectionAsync();
                                drag();
                            }}
                            onPress={() => router.push(`/habit/${item.id}`)}
                            disabled={isActive}
                            className={`bg-surface p-4 rounded-2xl mb-3 flex-row justify-between items-center border ${isActive ? 'border-primary' : 'border-surfaceHighlight'}`}
                        >
                            {/* Deep Dive Interaction */}
                            <View className="flex-1">
                                <Text className="text-primary font-bold text-lg">{item.name}</Text>

                                {item.target_value > 1 ? (
                                    <Text className="text-primary font-bold text-base mt-0.5">
                                        {item.health_type === 'sleep'
                                            ? ((item.completed_value || 0) / 60).toFixed(1)
                                            : (item.completed_value?.toLocaleString() || 0)}
                                        <Text className="text-secondary font-medium text-xs"> / {
                                            item.health_type === 'sleep'
                                                ? `${(item.target_value / 60).toFixed(1)} hrs`
                                                : `${item.target_value.toLocaleString()} ${item.unit}`
                                        }</Text>
                                    </Text>
                                ) : (
                                    item.description ? <Text className="text-secondary text-sm" numberOfLines={1}>{item.description}</Text> : null
                                )}

                                <Text className="text-secondary text-xs mt-1">{item.current_streak} Day Streak</Text>
                            </View>

                            {/* Completion Interaction */}
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    if (item.target_value > 1) {
                                        setLogHabit(item);
                                    } else {
                                        toggleHabit(item.id);
                                    }
                                }}
                                className={`w-10 h-10 rounded-full border-2 items-center justify-center ml-4`}
                                style={{
                                    borderColor: item.completed_today ? item.color : (item.frozen_today ? '#60A5FA' : '#3F3F46'),
                                    backgroundColor: item.completed_today ? item.color : (item.frozen_today ? 'rgba(96, 165, 250, 0.2)' : 'transparent')
                                }}
                            >
                                {item.completed_today && <View className="w-5 h-5 rounded-full bg-black" />}
                                {!item.completed_today && item.frozen_today && <Ionicons name="snow" size={16} color="#60A5FA" />}
                            </Pressable>
                        </Pressable>
                    </ScaleDecorator>
                )}
            />
        </SafeAreaView>
    );
}
