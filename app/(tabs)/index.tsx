import { View, Text, Pressable, Alert, Dimensions } from "react-native";
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
import { CalendarService } from "../../services/CalendarService";
import { HealthKitService } from '../../services/HealthKitService';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 220;
const CHART_WIDTH = SCREEN_WIDTH - 48;

function CalendarWidget() {
    const [events, setEvents] = useState<any[]>([]);
    const [hasPermission, setHasPermission] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const loadEvents = async () => {
                const granted = await CalendarService.requestPermissions();
                setHasPermission(granted);
                if (granted) {
                    const evs = await CalendarService.getEventsForToday();
                    setEvents(evs);
                }
            };
            loadEvents();
        }, [])
    );

    if (!hasPermission) {
        return (
            <View className="bg-surface p-4 rounded-xl border border-surfaceHighlight items-center">
                <Text className="text-secondary text-sm">Calendar access required to show schedule.</Text>
                <Pressable onPress={() => CalendarService.requestPermissions()} className="mt-2">
                    <Text className="text-primary font-bold">Grant Permission</Text>
                </Pressable>
            </View>
        );
    }

    if (events.length === 0) {
        return (
            <View className="bg-surface p-4 rounded-xl border border-surfaceHighlight">
                <Text className="text-zinc-500 italic text-center">No events scheduled for today.</Text>
            </View>
        );
    }

    return (
        <View className="gap-2">
            {events.map((e, i) => (
                <View key={e.id || i} className="bg-surface p-3 rounded-xl border border-surfaceHighlight flex-row items-center gap-3">
                    <View className="w-1 h-8 bg-blue-500 rounded-full" />
                    <View className="flex-1">
                        <Text className="text-white font-bold text-sm" numberOfLines={1}>{e.title}</Text>
                        <Text className="text-zinc-500 text-xs">
                            {new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
    const [stats, setStats] = useState({ streak: 0, completionRate: 0, breakdown: { build: 0, quit: 0, frozen: 0, total: 0 } });
    const [logHabit, setLogHabit] = useState<Habit | null>(null);
    const [userMeta, setUserMeta] = useState({ level: 1, xp: 0 });

    // Data Room State
    const [trendData, setTrendData] = useState<{ date: string, rate: number }[]>([]);
    const [bestStreaks, setBestStreaks] = useState<Habit[]>([]);
    const [healthMetrics, setHealthMetrics] = useState({ heartRate: 0, calories: 0, distance: 0, mindMinutes: 0 });

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

        // --- Data Room Loading Logic ---

        // 1. Trend Data (Last 14 days)
        const dates = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(DateUtils.getDateString(d));
        }

        const statsPromises = dates.map(d => HabitService.getStats(d));
        const statsResults = await Promise.all(statsPromises);

        const trend = dates.map((date, idx) => ({
            date: new Date(date).getDate().toString(), // Day number
            rate: statsResults[idx].completionRate
        }));
        setTrendData(trend);

        // 2. Best Streaks (Active habits sorted by streak)
        // using 'h' (habits for selected date) might be enough if it includes all habits, 
        // but 'getHabits(dateStr)' might filter? Assuming it returns all relevant habits for the day.
        // The original code called 'HabitService.getHabits()' (no args) which usually gets all.
        // Let's call it explicitly to be safe like the original stats page.
        const allHabits = await HabitService.getHabits();
        const sortedService = allHabits.sort((a, b) => b.current_streak - a.current_streak).slice(0, 5);
        setBestStreaks(sortedService);

        // 3. Health Metrics
        if (HealthKitService.isAvailable) {
            const now = new Date();
            const todayStr = DateUtils.getDateString(now);
            const [hr, cal, min, dist] = await Promise.all([
                HealthKitService.getHeartRate(todayStr),
                HealthKitService.getActiveCalories(todayStr),
                HealthKitService.getMindfulMinutes(todayStr),
                HealthKitService.getDistance(todayStr)
            ]);
            setHealthMetrics({ heartRate: hr, calories: cal, mindMinutes: min, distance: dist || 0 });
        }
    };

    // --- Chart Helpers ---
    const getCoordinates = (index: number, value: number) => {
        const x = (index / (trendData.length - 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - (value / 100) * CHART_HEIGHT;
        return { x, y };
    };

    const buildPath = () => {
        if (trendData.length === 0) return '';
        let path = `M ${getCoordinates(0, trendData[0].rate).x} ${getCoordinates(0, trendData[0].rate).y}`;
        for (let i = 1; i < trendData.length; i++) {
            const { x, y } = getCoordinates(i, trendData[i].rate);
            path += ` L ${x} ${y}`;
        }
        return path;
    };

    const buildAreaPath = () => {
        if (trendData.length === 0) return '';
        const line = buildPath();
        const lastX = getCoordinates(trendData.length - 1, 0).x;
        return `${line} L ${lastX} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;
    };

    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                await HabitService.migrateColors();
                await HabitService.recalculateAllStreaks();

                // Auto-sync HealthKit data
                await HabitService.syncHealthKitData();

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
                ListFooterComponent={
                    <>
                        <Heatmap data={heatmapData} />

                        {/* Calendar Events Widget */}
                        <View className="mb-20 px-1 mt-6">
                            <Text className="text-secondary text-xs font-bold tracking-widest mb-4 uppercase">Device Calendar</Text>
                            <CalendarWidget />
                        </View>

                        <LogValueModal
                            visible={!!logHabit}
                            habit={logHabit}
                            onClose={() => setLogHabit(null)}
                            onSave={handleLogSave}
                        />

                        {/* --- DATA ROOM SECTIONS --- */}
                        <View className="mt-8 mb-20 px-1">
                            <Text className="text-3xl font-bold text-primary mb-6 tracking-tighter">DATA ROOM</Text>

                            {/* --- TREND CHART --- */}
                            <View className="mb-8">
                                <Text className="text-secondary text-xs font-bold tracking-widest mb-4 uppercase">14-Day Consistency</Text>
                                <View className="bg-surface p-4 rounded-3xl border border-surfaceHighlight items-center justify-center">
                                    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
                                        {/* Grid Lines */}
                                        {[0, 25, 50, 75, 100].map(v => (
                                            <Line
                                                key={v}
                                                x1="0"
                                                y1={CHART_HEIGHT - (v / 100) * CHART_HEIGHT}
                                                x2={CHART_WIDTH}
                                                y2={CHART_HEIGHT - (v / 100) * CHART_HEIGHT}
                                                stroke="#333"
                                                strokeWidth="1"
                                                strokeDasharray="4"
                                            />
                                        ))}

                                        {/* Area Fill */}
                                        <Path d={buildAreaPath()} fill="rgba(204, 255, 0, 0.1)" />

                                        {/* Line */}
                                        <Path d={buildPath()} stroke="#CCFF00" strokeWidth="3" fill="none" />

                                        {/* Dots */}
                                        {trendData.map((d, i) => {
                                            const { x, y } = getCoordinates(i, d.rate);
                                            return (
                                                <Circle key={i} cx={x} cy={y} r="4" fill="#000" stroke="#CCFF00" strokeWidth="2" />
                                            );
                                        })}

                                        {/* X-Axis Labels */}
                                        {trendData.map((d, i) => {
                                            if (i % 2 !== 0) return null; // Skip every other label
                                            const { x } = getCoordinates(i, 0);
                                            return (
                                                <SvgText key={i} x={x} y={CHART_HEIGHT + 20} fontSize="10" fill="#71717A" textAnchor="middle">
                                                    {d.date}
                                                </SvgText>
                                            );
                                        })}
                                    </Svg>
                                </View>
                            </View>

                            {/* --- LEADERBOARD --- */}
                            <View className="mb-8">
                                <Text className="text-secondary text-xs font-bold tracking-widest mb-4 uppercase">Hall of Fame (Best Streaks)</Text>
                                {bestStreaks.map((h, idx) => (
                                    <View key={h.id} className="bg-surface p-4 rounded-2xl mb-2 flex-row items-center border border-surfaceHighlight">
                                        <Text className={`text-lg font-bold w-8 ${idx === 0 ? 'text-yellow-400' : (idx === 1 ? 'text-gray-300' : (idx === 2 ? 'text-amber-600' : 'text-gray-600'))}`}>
                                            #{idx + 1}
                                        </Text>
                                        <View className="flex-1">
                                            <Text className="text-white font-bold">{h.name}</Text>
                                        </View>
                                        <View className="bg-zinc-800 px-3 py-1 rounded-full">
                                            <Text className="text-primary font-bold">{h.current_streak} days</Text>
                                        </View>
                                    </View>
                                ))}
                                {bestStreaks.length === 0 && <Text className="text-secondary opacity-50">No active habits to rank.</Text>}
                            </View>

                            {/* --- BREAKDOWN (War Chest) --- */}
                            <View className="mb-8">
                                <Text className="text-secondary text-xs font-bold tracking-widest mb-4 uppercase">War Chest</Text>
                                <View className="flex-row gap-4">
                                    <View className="flex-1 bg-surface p-5 rounded-3xl border border-surfaceHighlight items-center">
                                        <Text className="text-4xl font-bold text-green-400">{stats.breakdown.build}</Text>
                                        <Text className="text-white text-sm font-bold mt-1">BUILD</Text>
                                        <Text className="text-secondary text-xs text-center mt-2">Habits you are forging.</Text>
                                    </View>
                                    <View className="flex-1 bg-surface p-5 rounded-3xl border border-surfaceHighlight items-center">
                                        <Text className="text-4xl font-bold text-red-500">{stats.breakdown.quit}</Text>
                                        <Text className="text-white text-sm font-bold mt-1">QUIT</Text>
                                        <Text className="text-secondary text-xs text-center mt-2">Vices you are destroying.</Text>
                                    </View>
                                </View>
                            </View>

                            {/* --- BIO-METRICS (HealthKit) --- */}
                            <View className="mb-20">
                                <Text className="text-secondary text-xs font-bold tracking-widest mb-4 uppercase">Bio-Metrics (Today)</Text>
                                <View className="flex-row gap-3 mb-3">
                                    <View className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                        <Text className="text-red-500 font-bold mb-1">Heart</Text>
                                        <Text className="text-white text-2xl font-bold">{healthMetrics.heartRate} <Text className="text-sm text-zinc-500">bpm</Text></Text>
                                    </View>
                                    <View className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                        <Text className="text-orange-500 font-bold mb-1">Energy</Text>
                                        <Text className="text-white text-2xl font-bold">{healthMetrics.calories} <Text className="text-sm text-zinc-500">kcal</Text></Text>
                                    </View>
                                </View>
                                <View className="flex-row gap-3">
                                    <View className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                        <Text className="text-blue-500 font-bold mb-1">Distance</Text>
                                        <Text className="text-white text-2xl font-bold">{(healthMetrics.distance / 1000).toFixed(1)} <Text className="text-sm text-zinc-500">km</Text></Text>
                                    </View>
                                    <View className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                        <Text className="text-purple-500 font-bold mb-1">Mindful</Text>
                                        <Text className="text-white text-2xl font-bold">{healthMetrics.mindMinutes} <Text className="text-sm text-zinc-500">min</Text></Text>
                                    </View>
                                </View>
                            </View>
                        </View>
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
