import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BodyService } from '../../services/BodyService';
import BodyHeatmap from '../../components/BodyHeatmap';
import { Ionicons } from '@expo/vector-icons';
import { CalendarStrip } from '../../components/CalendarStrip';
import { DateUtils } from '../../utils/DateUtils';
import { Svg, Path, Circle, Line, Text as SvgText } from 'react-native-svg';

export default function ProgressView() {
    const [recentMuscles, setRecentMuscles] = useState<string[]>([]);
    const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
    const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
    const [stats, setStats] = useState({ workouts: 0, volume: 0 });
    const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [splitRange, setSplitRange] = useState<7 | 14 | 30>(30);

    // Weight/BMI State
    const [metrics, setMetrics] = useState({ height: 175, weight: 70 });
    const [weightHistory, setWeightHistory] = useState<{ date: string, weight: number }[]>([]);
    const [volumeHistory, setVolumeHistory] = useState<{ date: string, volume: number }[]>([]);
    const [editMetrics, setEditMetrics] = useState(false);
    const [muscleSplit, setMuscleSplit] = useState<{ name: string, val: number, count: number }[]>([]);
    const [graphMode, setGraphMode] = useState<'weight' | 'bmi'>('weight');

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [selectedDate, splitRange])
    );

    const loadData = async () => {
        const dateStr = DateUtils.getDateString(selectedDate);

        // Daily Stats (Heatmap, Volume, Sessions)
        const muscles = await BodyService.getRecentMuscles(dateStr);
        const primary = await BodyService.getRecentPrimaryMuscles(dateStr);
        const secondary = await BodyService.getRecentSecondaryMuscles(dateStr);

        setRecentMuscles(muscles);
        setPrimaryMuscles(primary);
        setSecondaryMuscles(secondary);

        const workouts = await BodyService.getWorkoutsForDate(dateStr);
        const completed = workouts.filter(w => w.status === 'completed');

        const vol = await BodyService.getVolumeForDate(dateStr);

        // Range Stats (Muscle Split)
        const split = await BodyService.getMuscleSplit(splitRange);

        setStats({
            workouts: completed.length,
            volume: vol
        });
        setMuscleSplit(split);

        // Load Metrics
        const h = await BodyService.getHeight();
        const wHist = await BodyService.getWeightHistory();
        const vHist = await BodyService.getVolumeHistory(30);
        setWeightHistory(wHist);
        setVolumeHistory(vHist);

        const latestW = await BodyService.getLatestWeight();

        if (h) setMetrics(prev => ({ ...prev, height: h }));
        setMetrics(prev => ({ ...prev, weight: latestW }));
    };

    const handleSaveMetrics = async () => {
        await BodyService.updateHeight(metrics.height);
        const dateStr = DateUtils.getDateString(new Date());
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

        const width = Dimensions.get('window').width - 64;
        const height = 160;

        // Calculate BMI for each entry
        const dataPoints = weightHistory.map(w => {
            const hM = metrics.height / 100;
            const bmi = w.weight / (hM * hM);
            return { ...w, bmi };
        });

        // Get values based on mode
        const values = graphMode === 'weight'
            ? dataPoints.map(d => d.weight)
            : dataPoints.map(d => d.bmi);

        const minVal = Math.min(...values) - 2;
        const maxVal = Math.max(...values) + 2;
        const range = maxVal - minVal;

        const points = dataPoints.map((d, i) => {
            const x = (i / (dataPoints.length - 1)) * width;
            const val = graphMode === 'weight' ? d.weight : d.bmi;
            const y = height - ((val - minVal) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const lineColor = graphMode === 'weight' ? '#CCFF00' : '#00EAFF';
        const label = graphMode === 'weight' ? 'Weight Trend (Last 30 Logged Weights)' : 'BMI Trend (Last 30 Logged Weights)';

        return (
            <View className="mb-6">
                {/* Toggle */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-zinc-500 text-xs uppercase font-bold">{label}</Text>
                    <View className="flex-row bg-zinc-900 rounded-full p-1 border border-zinc-800">
                        <TouchableOpacity
                            onPress={() => setGraphMode('weight')}
                            className={`px-3 py-1 rounded-full ${graphMode === 'weight' ? 'bg-zinc-700' : ''}`}
                        >
                            <Text className={`text-[10px] font-bold ${graphMode === 'weight' ? 'text-white' : 'text-zinc-500'}`}>KG</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setGraphMode('bmi')}
                            className={`px-3 py-1 rounded-full ${graphMode === 'bmi' ? 'bg-zinc-700' : ''}`}
                        >
                            <Text className={`text-[10px] font-bold ${graphMode === 'bmi' ? 'text-white' : 'text-zinc-500'}`}>BMI</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View className="h-40 border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
                    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                        <Line x1="0" y1="0" x2={width} y2="0" stroke="#333" strokeDasharray="5,5" />
                        <Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#333" strokeDasharray="5,5" />
                        <Line x1="0" y1={height} x2={width} y2={height} stroke="#333" strokeDasharray="5,5" />
                        <Path d={`M ${points}`} fill="none" stroke={lineColor} strokeWidth="3" />
                        {dataPoints.map((d, i) => {
                            const x = (i / (dataPoints.length - 1)) * width;
                            const val = graphMode === 'weight' ? d.weight : d.bmi;
                            const y = height - ((val - minVal) / range) * height;
                            return <Circle key={i} cx={x} cy={y} r="4" fill="#000" stroke={lineColor} strokeWidth="2" />;
                        })}
                    </Svg>
                </View>
            </View>
        );
    };

    const renderVolumeChart = () => {
        if (volumeHistory.length < 2) return null;

        const width = Dimensions.get('window').width - 64;
        const height = 160;
        const padding = { left: 45, right: 20, top: 20, bottom: 30 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        const volumes = volumeHistory.map(v => v.volume);
        const minVol = Math.min(...volumes);
        const maxVol = Math.max(...volumes);
        const range = maxVol - minVol || 1;
        const currentVol = volumes[volumes.length - 1];

        const points = volumeHistory.map((d, i) => {
            const x = padding.left + (i / (volumeHistory.length - 1)) * graphWidth;
            const y = padding.top + graphHeight - ((d.volume - minVol) / range) * graphHeight;
            return `${x},${y}`;
        }).join(' ');

        return (
            <View className="mb-6">
                {/* Header with current value */}
                <View className="mb-4">
                    <Text className="text-zinc-500 text-xs uppercase font-bold">Volume Trend</Text>
                    <Text className="text-white text-2xl font-bold mt-1">
                        {(currentVol / 1000).toFixed(1)}
                        <Text className="text-zinc-500 text-sm"> tons</Text>
                    </Text>
                </View>
                <View className="h-40 border border-zinc-800 rounded-xl bg-zinc-900/50 p-2">
                    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                        {/* Grid lines */}
                        <Line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#333" strokeDasharray="5,5" />
                        <Line x1={padding.left} y1={padding.top + graphHeight / 2} x2={width - padding.right} y2={padding.top + graphHeight / 2} stroke="#333" strokeDasharray="5,5" />
                        <Line x1={padding.left} y1={padding.top + graphHeight} x2={width - padding.right} y2={padding.top + graphHeight} stroke="#333" strokeDasharray="5,5" />

                        {/* Y-axis labels (in kg) */}
                        <SvgText x="5" y={padding.top + 5} fill="#71717a" fontSize="10" fontFamily="monospace">
                            {(maxVol / 1000).toFixed(1)}k
                        </SvgText>
                        <SvgText x="5" y={padding.top + graphHeight / 2 + 5} fill="#71717a" fontSize="10" fontFamily="monospace">
                            {((minVol + maxVol) / 2000).toFixed(1)}k
                        </SvgText>
                        <SvgText x="5" y={padding.top + graphHeight + 5} fill="#71717a" fontSize="10" fontFamily="monospace">
                            {(minVol / 1000).toFixed(1)}k
                        </SvgText>

                        {/* Trend line */}
                        <Path d={`M ${points}`} fill="none" stroke="#FF6B35" strokeWidth="3" />

                        {/* Data points */}
                        {volumeHistory.map((d, i) => {
                            const x = padding.left + (i / (volumeHistory.length - 1)) * graphWidth;
                            const y = padding.top + graphHeight - ((d.volume - minVol) / range) * graphHeight;
                            return <Circle key={i} cx={x} cy={y} r="4" fill="#000" stroke="#FF6B35" strokeWidth="2" />;
                        })}

                        {/* X-axis date labels */}
                        {volumeHistory.length > 0 && (
                            <>
                                <SvgText x={padding.left} y={height - 5} fill="#71717a" fontSize="9" fontFamily="monospace">
                                    {new Date(volumeHistory[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </SvgText>
                                {volumeHistory.length > 2 && (
                                    <SvgText x={padding.left + graphWidth / 2} y={height - 5} fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="middle">
                                        {new Date(volumeHistory[Math.floor(volumeHistory.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </SvgText>
                                )}
                                <SvgText x={padding.left + graphWidth} y={height - 5} fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="end">
                                    {new Date(volumeHistory[volumeHistory.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </SvgText>
                            </>
                        )}
                    </Svg>
                </View>
            </View>
        );
    };

    // Calculate max value for relative bar scaling
    const maxSplitVal = Math.max(...muscleSplit.map(m => m.val), 0.01);

    return (
        <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
            {/* 1. Sticky Header */}
            <View className="bg-background pt-4 pb-2 px-6 z-20">
                <Text className="text-white text-3xl font-bold mb-4 tracking-tighter">ANALYTICS</Text>
                <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </View>

            {/* 2. Section 1: The Hero Map */}
            <View className="h-[420px] bg-black items-center justify-center relative border-b border-zinc-900">
                {/* Floating Toggle */}
                <View className="absolute top-4 right-6 z-10 flex-row bg-zinc-900/80 rounded-full p-1 border border-zinc-800 backdrop-blur-md">
                    <TouchableOpacity
                        onPress={() => setViewMode('front')}
                        className={`px-4 py-2 rounded-full ${viewMode === 'front' ? 'bg-zinc-700' : ''}`}
                    >
                        <Text className={`text-[10px] font-bold ${viewMode === 'front' ? 'text-white' : 'text-zinc-500'}`}>FRONT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('back')}
                        className={`px-4 py-2 rounded-full ${viewMode === 'back' ? 'bg-zinc-700' : ''}`}
                    >
                        <Text className={`text-[10px] font-bold ${viewMode === 'back' ? 'text-white' : 'text-zinc-500'}`}>BACK</Text>
                    </TouchableOpacity>
                </View>

                {/* The Map */}
                <BodyHeatmap
                    frontData={recentMuscles.reduce((acc, m) => ({ ...acc, [m.toLowerCase()]: 1 }), {})}
                    backData={recentMuscles.reduce((acc, m) => ({ ...acc, [m.toLowerCase()]: 1 }), {})}
                    frontPrimaryData={primaryMuscles.reduce((acc, m) => ({ ...acc, [m.toLowerCase()]: 1 }), {})}
                    backPrimaryData={primaryMuscles.reduce((acc, m) => ({ ...acc, [m.toLowerCase()]: 1 }), {})}
                    frontSecondaryData={secondaryMuscles.reduce((acc, m) => ({ ...acc, [m.toLowerCase()]: 1 }), {})}
                    backSecondaryData={secondaryMuscles.reduce((acc, m) => ({ ...acc, [m.toLowerCase()]: 1 }), {})}
                    viewSide={viewMode}
                    scale={1.8}
                />
            </View>

            <View className="px-6 pb-20">
                {/* 3. Section 2: Heads Up Display */}
                <View className="py-6 border-b border-zinc-900 mb-6">
                    <Text className="text-zinc-500 uppercase text-[10px] font-bold mb-2 tracking-widest">Focus (Daily)</Text>
                    <Text className="text-white text-xl font-medium tracking-tight leading-7">
                        {recentMuscles.length > 0 ? recentMuscles.join(', ') : 'Full Body'}
                    </Text>
                </View>

                {/* 4. Section 3: Metrics Grid */}
                <View className="flex-row gap-3 mb-3">
                    <View className="flex-1 bg-surface p-5 rounded-2xl border border-surfaceHighlight justify-between h-32">
                        <Ionicons name="barbell" size={24} color="#CCFF00" />
                        <View>
                            <Text className="text-white text-3xl font-bold tracking-tighter">{stats.workouts}</Text>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mt-1">Daily Sessions</Text>
                        </View>
                    </View>
                    <View className="flex-1 bg-surface p-5 rounded-2xl border border-surfaceHighlight justify-between h-32">
                        <Ionicons name="trending-up" size={24} color="#CCFF00" />
                        <View>
                            <Text className="text-white text-3xl font-bold tracking-tighter">{(stats.volume / 1000).toFixed(1)}<Text className="text-zinc-500 text-lg">k</Text></Text>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mt-1">Daily Volume (KG)</Text>
                        </View>
                    </View>
                </View>

                {/* Body Metrics Card */}
                <TouchableOpacity
                    onPress={() => setEditMetrics(true)}
                    className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 mb-8 flex-row justify-between items-center"
                >
                    <View className="flex-row items-center gap-4">
                        <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                            <Ionicons name="scale" size={20} color="white" />
                        </View>
                        <View>
                            <Text className="text-white font-bold text-lg">{metrics.weight} <Text className="text-sm text-zinc-500 font-normal">KG</Text></Text>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold">Current Weight</Text>
                        </View>
                    </View>
                    <View>
                        <Text className="text-white font-bold text-lg text-right">{getBMI()}</Text>
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold text-right">BMI Score</Text>
                    </View>
                </TouchableOpacity>

                {/* 5. Trend Graph */}
                {renderWeightGraph()}

                {/* 6. Volume Trend */}
                {renderVolumeChart()}

                {/* 7. Section 4: Deep Dive */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-white text-xl font-bold tracking-tight">Muscle Split</Text>
                        <View className="flex-row bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                            {[7, 14, 30].map(days => (
                                <TouchableOpacity
                                    key={days}
                                    onPress={() => setSplitRange(days as any)}
                                    className={`px-3 py-1 rounded-md ${splitRange === days ? 'bg-zinc-700' : ''}`}
                                >
                                    <Text className={`text-xs font-bold ${splitRange === days ? 'text-white' : 'text-zinc-500'}`}>
                                        {days}D
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View className="bg-surface p-6 rounded-2xl border border-surfaceHighlight gap-4">
                        {muscleSplit.length > 0 ? (
                            muscleSplit.map((m, index) => (
                                <View key={m.name} className={`flex-row items-center justify-between py-3 ${index !== muscleSplit.length - 1 ? 'border-b border-zinc-800' : ''}`}>
                                    <Text className="text-zinc-400 text-base font-bold">{m.name.toUpperCase()}</Text>
                                    <Text className="text-white text-base font-bold">{m.count} sets</Text>
                                </View>
                            ))
                        ) : (
                            <Text className="text-zinc-600 italic text-center text-xs">No workout data in last {splitRange} days.</Text>
                        )}
                        <Text className="text-zinc-600 text-[10px] text-center mt-2 font-mono">Last {splitRange} Days Activity</Text>
                    </View>
                </View>
            </View>

            {/* Metrics Edit Modal */}
            <Modal visible={editMetrics} animationType="slide">
                <View className="flex-1 bg-black p-6">
                    <View className="flex-row items-center justify-between mb-8 mt-10">
                        <Text className="text-white text-3xl font-bold">Body Metrics</Text>
                        <TouchableOpacity onPress={() => setEditMetrics(false)} className="bg-zinc-800 p-2 rounded-full">
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-zinc-500 text-xs uppercase font-bold mb-2">
                        Weight for {new Date().toLocaleDateString()} (KG)
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
