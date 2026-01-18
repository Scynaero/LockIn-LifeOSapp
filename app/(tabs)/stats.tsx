import { View, Text, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { HabitService, Habit } from '../../services/HabitService';
import { DateUtils } from '../../utils/DateUtils';
import Svg, { Path, Line, Circle, Text as SvgText, Rect } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 220;
const CHART_WIDTH = SCREEN_WIDTH - 48;

export default function StatsScreen() {
    const [trendData, setTrendData] = useState<{ date: string, rate: number }[]>([]);
    const [bestStreaks, setBestStreaks] = useState<Habit[]>([]);
    const [breakdown, setBreakdown] = useState({ build: 0, quit: 0 });

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [])
    );

    const loadStats = async () => {
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
        const habits = await HabitService.getHabits();
        const sortedService = habits.sort((a, b) => b.current_streak - a.current_streak).slice(0, 5);
        setBestStreaks(sortedService);

        // 3. Breakdown
        const s = statsResults[statsResults.length - 1]; // Today's stats
        setBreakdown({ build: s.breakdown.build, quit: s.breakdown.quit });
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

    return (
        <SafeAreaView className="flex-1 bg-black p-6">
            <ScrollView showsVerticalScrollIndicator={false}>
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

                {/* --- BREAKDOWN --- */}
                <View className="mb-20">
                    <Text className="text-secondary text-xs font-bold tracking-widest mb-4 uppercase">War Chest</Text>
                    <View className="flex-row gap-4">
                        <View className="flex-1 bg-surface p-5 rounded-3xl border border-surfaceHighlight items-center">
                            <Text className="text-4xl font-bold text-green-400">{breakdown.build}</Text>
                            <Text className="text-white text-sm font-bold mt-1">BUILD</Text>
                            <Text className="text-secondary text-xs text-center mt-2">Habits you are forging.</Text>
                        </View>
                        <View className="flex-1 bg-surface p-5 rounded-3xl border border-surfaceHighlight items-center">
                            <Text className="text-4xl font-bold text-red-500">{breakdown.quit}</Text>
                            <Text className="text-white text-sm font-bold mt-1">QUIT</Text>
                            <Text className="text-secondary text-xs text-center mt-2">Vices you are destroying.</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
