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

    // Initial Load
    useEffect(() => {
        loadSets();

        // Timer only if active
        let interval: NodeJS.Timeout;
        if (workout.status === 'active') {
            const start = new Date(workout.date).getTime();
            interval = setInterval(() => {
                const now = new Date().getTime();
                setElapsedSec(Math.floor((now - start) / 1000));
            }, 1000);
        } else {
            setElapsedSec(workout.duration_sec);
        }

        return () => clearInterval(interval);
    }, [workout.id]); // Reload if workout ID changes (date change)

    const loadSets = async () => {
        const data = await BodyService.getSetsForWorkout(workout.id);
        setSets(data);
    };

    const handleAddExercise = async (exerciseId: string) => {
        setPickerVisible(false);
        await BodyService.addSet(workout.id, exerciseId, 0, 0);
        loadSets();
        // Automatically open the new exercise? Maybe distinct choice. Let's just load it.
    };

    const handleAddSet = async (exerciseId: string, lastWeight: number = 0, lastReps: number = 0) => {
        await BodyService.addSet(workout.id, exerciseId, lastWeight, lastReps);
        loadSets();
    };

    const handleUpdateSet = async (setId: string, field: 'weight' | 'reps', value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return;
        await BodyService.updateSet(setId, { [field]: num });
        // Don't reload full sets here to avoid UI jitter, just let it persist
    };

    const toggleSetComplete = async (setId: string, currentStatus: boolean) => {
        await BodyService.updateSet(setId, { is_completed: !currentStatus });
        loadSets(); // Reload to update UI style
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const formatWorkoutName = (name: string, dateStr: string) => {
        // If name is "Workout YYYY-MM-DD", make it pretty
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
                    <Text className="text-zinc-500 text-xs font-mono mt-1">
                        {workout.status === 'active' ? 'IN PROGRESS • ' : 'COMPLETED • '}
                        <Text className="text-neonGreen text-sm font-bold">{formatTime(elapsedSec)}</Text>
                    </Text>
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
