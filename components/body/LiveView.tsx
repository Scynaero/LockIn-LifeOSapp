import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActivityRings from './ActivityRings';
import { BodyService } from '../../services/BodyService';
import { Svg, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { CalendarStrip } from '../CalendarStrip';

const SPORTS = [
    { name: 'Badminton', icon: 'tennisball', met: 7.0 },
    { name: 'Running', icon: 'walk', met: 9.8 },
    { name: 'Cycling', icon: 'bicycle', met: 7.5 },
    { name: 'Cricket', icon: 'baseball', met: 5.0 },
    { name: 'Tennis', icon: 'tennisball-outline', met: 7.3 },
    { name: 'Yoga', icon: 'body', met: 3.0 },
    { name: 'Other', icon: 'add-circle-outline', met: 5.0 },
];

export default function LiveView() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSport, setSelectedSport] = useState<typeof SPORTS[0] | null>(null);
    const [customName, setCustomName] = useState('');
    const [duration, setDuration] = useState('');
    const [sportsLogs, setSportsLogs] = useState<any[]>([]);

    const [metrics, setMetrics] = useState({ height: 175, weight: 70 });
    const [weightHistory, setWeightHistory] = useState<{ date: string, weight: number }[]>([]);
    const [editMetrics, setEditMetrics] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());

    const [dailyStats, setDailyStats] = useState({
        calories: 0,
        exerciseMin: 0,
        standHr: 10, // Mock for now
        goals: {
            calories: 600,
            exercise: 30,
            stand: 12
        }
    });

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [selectedDate])
    );

    const loadData = async () => {
        const h = await BodyService.getHeight();
        const dateStr = selectedDate.toISOString().split('T')[0];

        // Get history first
        const wHist = await BodyService.getWeightHistory();
        setWeightHistory(wHist);

        // Check if we have a weight for selectedDate
        const historyEntry = wHist.find(w => w.date === dateStr);
        // Default to latest weight if nothing on selected date, or just keep previous?
        // User wants "track down date-wise". If I select older date, I should see THAT date's weight.
        // If not exists, maybe show 0 or latest? Let's show latest as placeholder but differentiate?
        // Actually best UI: show existing if any, else latest.
        const latestW = await BodyService.getLatestWeight();

        if (h) setMetrics(prev => ({ ...prev, height: h }));
        setMetrics(prev => ({ ...prev, weight: historyEntry ? historyEntry.weight : latestW }));

        const sLogs = await BodyService.getSportsLogs();
        setSportsLogs(sLogs);

        // Calculate Daily Stats
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysLogs = sLogs.filter(l => l.start_time.startsWith(todayStr));

        const totalCals = todaysLogs.reduce((acc, curr) => acc + curr.calories, 0);
        const totalDuration = todaysLogs.reduce((acc, curr) => acc + curr.duration_min, 0);

        setDailyStats(prev => ({
            ...prev,
            calories: totalCals,
            exerciseMin: totalDuration
        }));
    };

    const handleSportPress = (sport: typeof SPORTS[0]) => {
        setSelectedSport(sport);
        setDuration('');
        setCustomName('');
        setModalVisible(true);
    };

    const handleDeleteLog = (id: string) => {
        Alert.alert(
            "Delete Activity",
            "Are you sure you want to remove this activity?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await BodyService.deleteSportLog(id);
                        loadData();
                    }
                }
            ]
        );
    };

    const handleLogSport = async () => {
        if (!selectedSport || !duration) return;

        const min = parseInt(duration);
        if (isNaN(min)) return;

        const name = selectedSport.name === 'Other' && customName ? customName : selectedSport.name;

        // Simple Calorie Formula: Calories = (MET * 3.5 * weight) / 200 * duration
        const calories = Math.round((selectedSport.met * 3.5 * metrics.weight) / 200 * min);

        // Uses today's date implicitly in Service or defaults to now
        await BodyService.logSport(name, min, calories, selectedSport.met);

        setModalVisible(false); // No Alert
        loadData();
    };

    const handleSaveMetrics = async () => {
        await BodyService.updateHeight(metrics.height);
        const dateStr = selectedDate.toISOString().split('T')[0];
        await BodyService.logWeight(metrics.weight, dateStr);
        setEditMetrics(false);
        loadData();
    };

    const getBMI = () => {
        const hM = metrics.height / 100;
        return (metrics.weight / (hM * hM)).toFixed(1);
    };

    const renderWeightGraph = () => {
        if (weightHistory.length < 2) return (
            <View className="h-40 items-center justify-center border border-zinc-800 rounded-xl bg-black/40 mb-6">
                <Text className="text-zinc-500 text-xs">Log more weight data to see a trend graph.</Text>
            </View>
        );

        const width = Dimensions.get('window').width - 64; // padding
        const height = 160;
        const weights = weightHistory.map(w => w.weight);
        const minW = Math.min(...weights) - 2;
        const maxW = Math.max(...weights) + 2;
        const range = maxW - minW;

        const points = weightHistory.map((d, i) => {
            const x = (i / (weightHistory.length - 1)) * width;
            const y = height - ((d.weight - minW) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <View className="mb-6">
                <Text className="text-zinc-500 text-xs uppercase font-bold mb-4">Weight Trend (Last 30 Entries)</Text>
                <View className="h-40 border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
                    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                        {/* Grid Lines */}
                        <Line x1="0" y1="0" x2={width} y2="0" stroke="#333" strokeDasharray="5,5" />
                        <Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#333" strokeDasharray="5,5" />
                        <Line x1="0" y1={height} x2={width} y2={height} stroke="#333" strokeDasharray="5,5" />

                        {/* The Line */}
                        <Path d={`M ${points}`} fill="none" stroke="#CCFF00" strokeWidth="3" />

                        {/* Dots */}
                        {weightHistory.map((d, i) => {
                            const x = (i / (weightHistory.length - 1)) * width;
                            const y = height - ((d.weight - minW) / range) * height;
                            return <Circle key={i} cx={x} cy={y} r="4" fill="#000" stroke="#CCFF00" strokeWidth="2" />;
                        })}
                    </Svg>
                </View>
            </View>
        );
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <ScrollView className="flex-1 bg-background p-6">
            {/* Health Dashboard Header */}
            <View className="mb-6 flex-row items-center justify-between">
                <View>
                    <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Activity</Text>
                    <Text className="text-white text-4xl font-bold tracking-tighter">{dailyStats.calories} <Text className="text-sm text-zinc-500 font-normal">KCAL</Text></Text>
                    <View className="mt-4 flex-row gap-3">
                        <View>
                            <Text className="text-neonRed font-bold text-[10px] uppercase mb-0.5">Move (KCAL)</Text>
                            <Text className="text-white font-bold text-lg">{dailyStats.calories}<Text className="text-zinc-600 text-xs">/{dailyStats.goals.calories}</Text></Text>
                        </View>
                        <View>
                            <Text className="text-neonGreen font-bold text-[10px] uppercase mb-0.5">Exercise (MIN)</Text>
                            <Text className="text-white font-bold text-lg">{dailyStats.exerciseMin}<Text className="text-zinc-600 text-xs">/{dailyStats.goals.exercise}</Text></Text>
                        </View>
                        <View>
                            <Text className="text-neonBlue font-bold text-[10px] uppercase mb-0.5">Stand (HRS)</Text>
                            <Text className="text-white font-bold text-lg">{dailyStats.standHr}<Text className="text-zinc-600 text-xs">/{dailyStats.goals.stand}</Text></Text>
                        </View>
                    </View>
                </View>

                {/* Visual Rings */}
                <View className="mr-12">
                    <ActivityRings
                        move={Math.min(dailyStats.calories / dailyStats.goals.calories, 1)}
                        exercise={Math.min(dailyStats.exerciseMin / dailyStats.goals.exercise, 1)}
                        stand={Math.min(dailyStats.standHr / dailyStats.goals.stand, 1)}
                        size={120}
                    />
                </View>
            </View>

            {/* Metrics Card (BMI, Weight) */}
            <TouchableOpacity
                onPress={() => setEditMetrics(true)}
                className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-6 flex-row justify-between items-center"
            >
                <View className="items-center">
                    <Text className="text-zinc-500 text-xs font-bold uppercase">Weight</Text>
                    <Text className="text-white text-xl font-bold">{metrics.weight} <Text className="text-xs text-zinc-500">KG</Text></Text>
                </View>
                <View className="h-8 w-[1px] bg-zinc-800" />
                <View className="items-center">
                    <Text className="text-zinc-500 text-xs font-bold uppercase">Height</Text>
                    <Text className="text-white text-xl font-bold">{metrics.height} <Text className="text-xs text-zinc-500">CM</Text></Text>
                </View>
                <View className="h-8 w-[1px] bg-zinc-800" />
                <View className="items-center">
                    <Text className="text-zinc-500 text-xs font-bold uppercase">BMI</Text>
                    <Text className="text-xl font-bold text-white">{getBMI()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>

            {/* Quick Log Sports */}
            <View className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 mb-6">
                <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Log Sport</Text>
                <View className="flex-row flex-wrap gap-4 justify-between">
                    {SPORTS.map((sport, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => handleSportPress(sport)}
                            className="w-[30%] aspect-square bg-black/40 rounded-2xl items-center justify-center border border-zinc-800"
                        >
                            <Ionicons name={sport.icon as any} size={32} color="white" />
                            <Text className="text-zinc-400 text-xs mt-2 font-bold text-center">{sport.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Sports History */}
            <View className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 mb-20">
                <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Activity Log (Hold to Delete)</Text>
                {sportsLogs.filter(l => l.start_time.startsWith(todayStr)).length === 0 ? (
                    <Text className="text-zinc-600 text-sm">No activities logged today.</Text>
                ) : (
                    sportsLogs.filter(l => l.start_time.startsWith(todayStr)).map(log => (
                        <TouchableOpacity
                            key={log.id}
                            className="flex-row items-center justify-between py-3 border-b border-zinc-800" // Use Touchable for LongPress
                            onLongPress={() => handleDeleteLog(log.id)}
                            delayLongPress={500}
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center">
                                    <Ionicons name="fitness" size={16} color="white" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold">{log.activity_name}</Text>
                                    <Text className="text-zinc-500 text-xs">{log.duration_min} min</Text>
                                </View>
                            </View>
                            <Text className="text-white font-bold">+{log.calories} kcal</Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Log Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/80 items-center justify-center p-6">
                    <View className="bg-zinc-900 w-full p-6 rounded-2xl border border-zinc-800">
                        <Text className="text-white text-xl font-bold mb-4">Log {selectedSport?.name}</Text>

                        {selectedSport?.name === 'Other' && (
                            <>
                                <Text className="text-zinc-500 text-xs uppercase font-bold mb-2">Activity Name</Text>
                                <TextInput
                                    value={customName}
                                    onChangeText={setCustomName}
                                    className="bg-black text-white p-4 rounded-xl text-lg font-bold mb-4 border border-zinc-700"
                                    placeholder="e.g. Hiking"
                                    placeholderTextColor="#52525B"
                                />
                            </>
                        )}

                        <Text className="text-zinc-500 text-xs uppercase font-bold mb-2">Duration (Minutes)</Text>
                        <TextInput
                            value={duration}
                            onChangeText={setDuration}
                            className="bg-black text-white p-4 rounded-xl text-lg font-bold mb-6 border border-zinc-700"
                            placeholder="e.g. 60"
                            placeholderTextColor="#52525B"
                            keyboardType="numeric"
                            autoFocus={selectedSport?.name !== 'Other'}
                        />

                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="flex-1 bg-zinc-800 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleLogSport}
                                className="flex-1 bg-neonGreen p-4 rounded-xl items-center"
                            >
                                <Text className="text-black font-bold">Log Activity</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Metrics Edit & History Modal */}
            <Modal visible={editMetrics} animationType="slide">
                <View className="flex-1 bg-black p-6">
                    <View className="flex-row items-center justify-between mb-8 mt-10">
                        <Text className="text-white text-3xl font-bold">Body Metrics</Text>
                        <TouchableOpacity onPress={() => setEditMetrics(false)} className="bg-zinc-800 p-2 rounded-full">
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

                    {renderWeightGraph()}

                    <Text className="text-zinc-500 text-xs uppercase font-bold mb-2">
                        Weight for {selectedDate.toLocaleDateString()} (KG)
                    </Text>
                    <TextInput
                        value={metrics.weight.toString()}
                        onChangeText={(t) => setMetrics(p => ({ ...p, weight: parseFloat(t) || 0 }))}
                        className="bg-zinc-900 text-white p-4 rounded-xl text-lg font-bold mb-4 border border-zinc-800"
                        keyboardType="numeric"
                    />

                    <Text className="text-zinc-500 text-xs uppercase font-bold mb-2">Update Height (CM)</Text>
                    <TextInput
                        value={metrics.height.toString()}
                        onChangeText={(t) => setMetrics(p => ({ ...p, height: parseFloat(t) || 0 }))}
                        className="bg-zinc-900 text-white p-4 rounded-xl text-lg font-bold mb-6 border border-zinc-800"
                        keyboardType="numeric"
                    />

                    <TouchableOpacity
                        onPress={handleSaveMetrics}
                        className="w-full bg-neonGreen p-4 rounded-xl items-center"
                    >
                        <Text className="text-black font-bold text-lg">Save & Log</Text>
                    </TouchableOpacity>

                    <View className="mt-8">
                        <Text className="text-zinc-500 text-xs uppercase font-bold mb-4">History</Text>
                        {weightHistory.length === 0 ? (
                            <Text className="text-zinc-600 text-sm italic">No weight history logged yet.</Text>
                        ) : (
                            <ScrollView className="max-h-60">
                                {weightHistory.map((h, i) => {
                                    // Calculate BMI based on current height (assuming constant height for history)
                                    const bmi = (h.weight / ((metrics.height / 100) ** 2)).toFixed(1);
                                    return (
                                        <View key={i} className="flex-row justify-between py-3 border-b border-zinc-800">
                                            <Text className="text-white font-bold">{h.date}</Text>
                                            <View className="flex-row gap-4">
                                                <Text className="text-zinc-500 font-mono text-xs mt-1">BMI {bmi}</Text>
                                                <Text className="text-neonGreen font-mono font-bold">{h.weight} kg</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
