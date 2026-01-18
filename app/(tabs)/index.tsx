import { View, Text, Pressable, Alert } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { HabitService, Habit } from "../../services/HabitService";
import { CalendarStrip } from "../../components/CalendarStrip";
import { Heatmap } from "../../components/Heatmap";
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { DateUtils } from "../../utils/DateUtils";
import { ProgressRing } from "../../components/ProgressRing";
import { LogValueModal } from "../../components/LogValueModal";

export default function HomeScreen() {
    const router = useRouter();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
    const [stats, setStats] = useState({ streak: 0, completionRate: 0, breakdown: { build: 0, quit: 0, frozen: 0, total: 0 } });
    const [logHabit, setLogHabit] = useState<Habit | null>(null);
    const [userMeta, setUserMeta] = useState({ level: 1, xp: 0 });

    const loadData = async () => {
        const dateStr = DateUtils.getDateString(selectedDate);
        const h = await HabitService.getHabits(dateStr);
        setHabits(h);
        const map = await HabitService.getHeatmapData();
        setHeatmapData(map);
        const s = await HabitService.getStats(dateStr);
        setStats({ streak: s.currentStreak, completionRate: s.completionRate, breakdown: s.breakdown });

        const meta = await HabitService.getUserXP();
        setUserMeta(meta);
    };

    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                await HabitService.migrateColors();
                await HabitService.recalculateAllStreaks();
                loadData();
            };
            init();
        }, [selectedDate])
    );

    const toggleHabit = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const dateStr = DateUtils.getDateString(selectedDate);
        await HabitService.logCompletion(id, dateStr, 1);
        loadData();
    };

    const handleLogSave = async (val: number) => {
        if (!logHabit) return;
        const dateStr = DateUtils.getDateString(selectedDate);

        let finalVal = val;
        if (logHabit.health_type === 'sleep') {
            finalVal = Math.round(val * 60);
        }

        await HabitService.logCompletion(logHabit.id, dateStr, finalVal);
        loadData();
        setLogHabit(null);
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
                            <View>
                                <Text className="text-3xl font-bold text-primary tracking-tighter">LOCK-IN</Text>
                                <View className="flex-row items-center gap-2 mt-1">
                                    <View className="bg-surface px-2 py-0.5 rounded-md border border-surfaceHighlight">
                                        <Text className="text-xs text-secondary font-bold">LVL {userMeta.level}</Text>
                                    </View>
                                    <Text className="text-secondary text-xs">{userMeta.xp} XP</Text>
                                    <View className="w-20 h-1 bg-surfaceHighlight rounded-full overflow-hidden">
                                        <View
                                            className="h-full bg-primary"
                                            style={{ width: `${Math.min((userMeta.xp % 100), 100)}%` }}
                                        />
                                    </View>
                                </View>
                            </View>
                            <Pressable
                                onPress={() => router.push(`/create?startDate=${DateUtils.getDateString(selectedDate)}`)}
                                className="bg-primary w-10 h-10 rounded-full items-center justify-center active:opacity-80">
                                <Ionicons name="add" size={24} color="black" />
                            </Pressable>
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
                            onPress={() => router.push(`/habit/${item.id}?viewDate=${DateUtils.getDateString(selectedDate)}`)}
                            disabled={isActive}
                            className={`bg-surface p-4 rounded-2xl mb-3 flex-row justify-between items-center border ${isActive ? 'border-primary' : 'border-surfaceHighlight'}`}
                        >
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
                                    <View className="h-4" />
                                )}

                                <View className="flex-row items-center gap-1 mt-2">
                                    {(item as any).recent_history?.map((val: number, idx: number) => (
                                        <View
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full ${val === 1 ? 'bg-green-500' : (val === 2 ? 'bg-blue-400' : 'bg-zinc-800')}`}
                                        />
                                    ))}
                                    <Text className="text-secondary text-xs ml-2 opacity-50">{item.current_streak} Day Streak</Text>
                                </View>
                            </View>

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
