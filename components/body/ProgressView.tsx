import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BodyService } from '../../services/BodyService';
import BodyHeatmap from '../../components/BodyHeatmap';
import { Ionicons } from '@expo/vector-icons';
import { CalendarStrip } from '../../components/CalendarStrip';
import { DateUtils } from '../../utils/DateUtils';

export default function ProgressView() {
    const [recentMuscles, setRecentMuscles] = useState<string[]>([]);
    const [stats, setStats] = useState({ workouts: 0, volume: 0 });
    const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
    const [selectedDate, setSelectedDate] = useState(new Date());

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [selectedDate])
    );

    const loadData = async () => {
        const dateStr = DateUtils.getDateString(selectedDate);
        const muscles = await BodyService.getRecentMuscles(dateStr);
        setRecentMuscles(muscles);

        // Get stats for DATE
        const workouts = await BodyService.getWorkoutsForDate(dateStr);
        const completed = workouts.filter(w => w.status === 'completed');

        // Volume calculation needs Sets... we don't have sets in 'workouts' list easily without join
        // For now, let's mock volume based on workout count or fetch sets?
        // BodyService.getWorkoutsForDate returns basic info.
        // Let's keep volume simple or 0 if no workouts.
        // A better approach would be to have getDailyVolume(date).
        // I'll leave simple approximation or 0 for now to keep it safe.
        setStats({
            workouts: completed.length,
            volume: 0 // TODO: Real volume aggregation
        });
    };

    return (
        <ScrollView className="flex-1 bg-background pt-4 px-6" showsVerticalScrollIndicator={false}>
            <Text className="text-white text-3xl font-bold mb-6 tracking-tighter">ANALYTICS</Text>

            <View className="mb-6">
                <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </View>

            {/* Zone 1: Body Heatmap */}
            <View className="bg-surface p-6 rounded-3xl mb-6 border border-surfaceHighlight flex-row justify-between items-center relative min-h-[250px]">
                {/* View Toggle */}
                <View className="absolute top-4 right-4 z-10 flex-row bg-zinc-900 rounded-full p-1 border border-zinc-800">
                    <TouchableOpacity
                        onPress={() => setViewMode('front')}
                        className={`px-3 py-1 rounded-full ${viewMode === 'front' ? 'bg-zinc-700' : ''}`}
                    >
                        <Text className={`text-[10px] font-bold ${viewMode === 'front' ? 'text-white' : 'text-zinc-500'}`}>FRONT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('back')}
                        className={`px-3 py-1 rounded-full ${viewMode === 'back' ? 'bg-zinc-700' : ''}`}
                    >
                        <Text className={`text-[10px] font-bold ${viewMode === 'back' ? 'text-white' : 'text-zinc-500'}`}>BACK</Text>
                    </TouchableOpacity>
                </View>

                <View>
                    <Text className="text-secondary uppercase text-xs font-bold mb-2 tracking-widest">Recovery Status</Text>
                    <Text className="text-white font-bold text-2xl mb-1">Full Body</Text>
                    <Text className="text-neonGreen text-xs font-bold">READY TO TRAIN</Text>

                    <View className="mt-8">
                        <Text className="text-secondary uppercase text-xs font-bold mb-1">Recent Focus</Text>
                        <Text className="text-white font-medium w-32">{recentMuscles.slice(0, 3).join(', ') || 'None'}</Text>
                    </View>
                </View>

                {/* The Interactive Body Map */}
                <View className="mr-4 mt-6">
                    <BodyHeatmap
                        muscleIntensities={recentMuscles.reduce((acc, m) => ({ ...acc, [m.toLowerCase()]: 1 }), {})}
                        side={viewMode}
                        scale={1.2}
                    />
                </View>
            </View>

            {/* Zone 2: Stats Grid */}
            <View className="flex-row gap-4 mb-6">
                <View className="flex-1 bg-surface p-4 rounded-2xl border border-surfaceHighlight">
                    <Ionicons name="barbell" size={24} color="#CCFF00" />
                    <Text className="text-white text-2xl font-bold mt-2">{stats.workouts}</Text>
                    <Text className="text-zinc-500 text-xs uppercase font-bold">Sessions</Text>
                </View>
                <View className="flex-1 bg-surface p-4 rounded-2xl border border-surfaceHighlight">
                    <Ionicons name="trending-up" size={24} color="#CCFF00" />
                    <Text className="text-white text-2xl font-bold mt-2">{(stats.volume / 1000).toFixed(1)}k</Text>
                    <Text className="text-zinc-500 text-xs uppercase font-bold">Vol (KG)</Text>
                </View>
            </View>

            <View className="bg-surface p-6 rounded-2xl mb-20 border border-surfaceHighlight">
                <Text className="text-secondary uppercase text-xs font-bold mb-4">Muscle Split (Last 30 Days)</Text>

                {/* Mock Bar Chart using Views */}
                <View className="gap-3">
                    {['Chest', 'Back', 'Legs', 'Arms'].map(m => (
                        <View key={m} className="flex-row items-center gap-4">
                            <Text className="text-zinc-400 text-xs w-10 font-bold">{m.toUpperCase()}</Text>
                            <View className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-neonGreen opacity-80"
                                    style={{ width: `${Math.random() * 80 + 10}%` }}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}
