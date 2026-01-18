import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Alert, ScrollView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BodyService, Workout, WorkoutSet } from '../../services/BodyService';
import ExercisePicker from './ExercisePicker';
import ExerciseDetailModal from './ExerciseDetailModal';
import { router } from 'expo-router';

interface Props {
    workout: Workout;
    onFinish: () => void;
    readOnly?: boolean;
}

type GroupedSets = {
    exercise_id: string;
    exercise_name: string;
    sets: (WorkoutSet & { exercise_name: string })[];
};

export default function ActiveWorkout({ workout, onFinish, readOnly }: Props) {
    const [sets, setSets] = useState<(WorkoutSet & { exercise_name: string })[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [elapsedSec, setElapsedSec] = useState(workout.duration_sec || 0);
    const [isTimerRunning, setIsTimerRunning] = useState(!!workout.is_timer_running); // Local state for immediate UI update

    // Modal State
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

    // Helper to get total reps/volume for summary
    const getSummary = (group: GroupedSets) => {
        const completed = group.sets.filter(s => s.is_completed).length;
        const total = group.sets.length;
        const bestSet = group.sets.reduce((max, s) => (s.weight > max ? s.weight : max), 0);
        return `${completed}/${total} Sets • Best: ${bestSet}kg`;
    }

    // Initial Load & Timer Logic
    useEffect(() => {
        loadSets();

        // Initialize local elapsed from DB
        const base = workout.duration_sec || 0;
        let currentSession = 0;

        // We rely on Props for initial calculation, but local state for running status?
        // Actually, if we use local state, we should rely on it for the interval.

        if (workout.is_timer_running && workout.timer_start) {
            currentSession = Math.floor((new Date().getTime() - new Date(workout.timer_start).getTime()) / 1000);
        }
        // Only set elapsed if we are mounting? Or if workout prop changes?
        // Let's trust the prop for initial load.
        // setElapsedSec(base + currentSession); // This overrides local increments if we aren't careful.

        // BETTER: Only setup interval here.
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            // If we just toggled it ON locally, we might not have a timer_start from DB yet in props.
            // So we should just increment locally.
            interval = setInterval(() => {
                setElapsedSec(prev => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isTimerRunning, workout.id, workout.duration_sec, workout.timer_start, workout.is_timer_running]); // Depend on local state and workout props for initial setup

    const loadSets = async () => {
        const data = await BodyService.getSetsForWorkout(workout.id);
        setSets(data);
    };

    const handleToggleTimer = async () => {
        const shouldRun = !isTimerRunning;
        setIsTimerRunning(shouldRun); // Immediate UI update
        await BodyService.toggleWorkoutTimer(workout.id, shouldRun);
        // We assume parent refreshes via focus effect or we trigger it if we had a callback
        if (onFinish && typeof onFinish === 'function') {
            // Ideally onRefresh, but previously we didn't fully wire it or used onFinish loosely
            // For now, let's just rely on the UI update or call onFinish if intended as refresh
            // actually, better to let parent focus effect handle it or route.refresh()
            // But let's just leave it, user said timer works, just wants reset button.
        }
    };

    const handleResetTimer = async () => {
        Alert.alert(
            "Reset Timer",
            "Are you sure you want to reset the timer to 00:00?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    onPress: async () => {
                        setIsTimerRunning(false);
                        setElapsedSec(0);
                        await BodyService.resetWorkoutTimer(workout.id);
                    }
                }
            ]
        );
    };

    const handleAddExercise = async (exerciseId: string) => {
        setPickerVisible(false);
        await BodyService.addSet(workout.id, exerciseId, 0, 0);
        loadSets();
    };

    const handleAddSet = async (exerciseId: string, lastWeight: number = 0, lastReps: number = 0) => {
        await BodyService.addSet(workout.id, exerciseId, lastWeight, lastReps);
        loadSets();
    };

    const handleUpdateSet = async (setId: string, field: 'weight' | 'reps', value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return;
        await BodyService.updateSet(setId, { [field]: num });
    };

    const toggleSetComplete = async (setId: string, currentStatus: boolean) => {
        await BodyService.updateSet(setId, { is_completed: !currentStatus });
        loadSets();
    };

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const formatWorkoutName = (name: string, dateStr: string) => {
        if (name.startsWith('Workout 20')) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' Workout';
        }
        return name;
    };

    const finishWorkout = () => {
        Alert.alert(
            "Finish Workout",
            "Mark this workout as complete?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Finish",
                    onPress: async () => {
                        await BodyService.finishWorkout(workout.id, elapsedSec);
                        onFinish();
                    }
                }
            ]
        );
    };

    // Group sets by exercise for UI
    const groupedMap = new Map<string, GroupedSets>();
    sets.forEach(s => {
        if (!groupedMap.has(s.exercise_id)) {
            groupedMap.set(s.exercise_id, {
                exercise_id: s.exercise_id,
                exercise_name: s.exercise_name,
                sets: []
            });
        }
        groupedMap.get(s.exercise_id)!.sets.push(s);
    });
    const grouped = Array.from(groupedMap.values());

    const [calcVisible, setCalcVisible] = useState(false);
    const [calcValues, setCalcValues] = useState({ w: '', r: '' });

    const calculate1RM = () => {
        const w = parseFloat(calcValues.w);
        const r = parseFloat(calcValues.r);
        if (!w || !r) return 0;
        return Math.round(w * (1 + r / 30));
    }

    const selectedGroup = grouped.find(g => g.exercise_id === selectedExerciseId);

    return (
        <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <View>
                    <Text className="text-white font-bold text-lg">{formatWorkoutName(workout.name, workout.date)}</Text>
                    <View className="flex-row items-center mt-1 gap-3">
                        <TouchableOpacity onPress={handleToggleTimer}>
                            <Ionicons
                                name={isTimerRunning ? "pause-circle" : "play-circle"}
                                size={28}
                                color={isTimerRunning ? "#CCFF00" : "#666"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleResetTimer}>
                            <Ionicons name="refresh-circle" size={28} color="#FF3B30" />
                        </TouchableOpacity>

                        <Text className={`text-base font-mono font-bold ${isTimerRunning ? 'text-neonGreen' : 'text-zinc-500'}`}>
                            {formatTime(elapsedSec)}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                        onPress={() => setCalcVisible(true)}
                        className="bg-zinc-800 w-10 h-10 rounded-full items-center justify-center"
                    >
                        <Ionicons name="calculator" size={20} color="white" />
                    </TouchableOpacity>
                    {workout.status === 'active' && (
                        <TouchableOpacity
                            onPress={finishWorkout}
                            className="bg-neonGreen px-6 py-2 rounded-full"
                        >
                            <Text className="text-black font-bold">FINISH</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={grouped}
                keyExtractor={item => item.exercise_id}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListFooterComponent={
                    <TouchableOpacity
                        onPress={() => setPickerVisible(true)}
                        className="bg-zinc-800 py-4 rounded-xl items-center border border-zinc-700 border-dashed mt-4 active:bg-zinc-700 mx-4"
                    >
                        <Text className="text-white font-bold uppercase tracking-widest">+ Add Exercise</Text>
                    </TouchableOpacity>
                }
                renderItem={({ item: group }) => {
                    const isCompleted = group.sets.every(s => s.is_completed);
                    return (
                        <View className="mb-3 mx-4">
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedExerciseId(group.exercise_id);
                                    setDetailModalVisible(true);
                                }}
                                activeOpacity={0.7}
                                className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 flex-row justify-between items-center"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isCompleted ? 'bg-neonGreen/20' : 'bg-zinc-800'}`}>
                                        <Ionicons name="barbell" size={24} color={isCompleted ? "#CCFF00" : "#FFFFFF"} />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-lg">{group.exercise_name}</Text>
                                        <Text className="text-zinc-400 text-xs font-medium mt-0.5">{getSummary(group)}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#52525B" />
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />

            <ExercisePicker
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onSelect={handleAddExercise}
            />

            {/* Detail Modal */}
            {selectedGroup && (
                <ExerciseDetailModal
                    visible={detailModalVisible}
                    onClose={() => setDetailModalVisible(false)}
                    exerciseName={selectedGroup.exercise_name}
                    sets={selectedGroup.sets}
                    onAddSet={() => handleAddSet(selectedGroup.exercise_id, selectedGroup.sets[selectedGroup.sets.length - 1]?.weight, selectedGroup.sets[selectedGroup.sets.length - 1]?.reps)}
                    onUpdateSet={handleUpdateSet}
                    onToggleSet={toggleSetComplete}
                />
            )}

            {/* 1RM Calculator Modal */}
            <Modal visible={calcVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/80 items-center justify-center p-6">
                    <View className="bg-zinc-900 w-full p-6 rounded-2xl border border-zinc-800 relative">
                        <TouchableOpacity onPress={() => setCalcVisible(false)} className="absolute top-4 right-4 z-10">
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <Text className="text-white text-xl font-bold mb-6 text-center">1RM Calculator</Text>

                        <View className="flex-row gap-4 mb-6">
                            <View className="flex-1">
                                <Text className="text-zinc-500 text-xs uppercase font-bold mb-2">Weight (KG)</Text>
                                <TextInput
                                    value={calcValues.w}
                                    onChangeText={t => setCalcValues(p => ({ ...p, w: t }))}
                                    className="bg-black text-white p-4 rounded-xl text-lg font-bold border border-zinc-700 text-center"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-zinc-500 text-xs uppercase font-bold mb-2">Reps</Text>
                                <TextInput
                                    value={calcValues.r}
                                    onChangeText={t => setCalcValues(p => ({ ...p, r: t }))}
                                    className="bg-black text-white p-4 rounded-xl text-lg font-bold border border-zinc-700 text-center"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View className="items-center mb-6">
                            <Text className="text-zinc-500 text-xs uppercase font-bold mb-1">Estimated One Rep Max</Text>
                            <Text className="text-neonGreen text-5xl font-bold">{calculate1RM()} <Text className="text-lg text-white">KG</Text></Text>
                        </View>

                        <Text className="text-zinc-600 text-center text-xs px-4">
                            Formula: Weight * (1 + Reps/30). accurate for reps &lt; 10.
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
