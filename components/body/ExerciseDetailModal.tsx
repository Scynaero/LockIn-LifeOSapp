import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSet } from '../../services/BodyService';

interface Props {
    visible: boolean;
    onClose: () => void;
    exerciseName: string;
    sets: WorkoutSet[];
    onAddSet: () => void;
    onUpdateSet: (setId: string, field: 'weight' | 'reps', value: string) => void;
    onToggleSet: (setId: string, currentStatus: boolean) => void;
}

export default function ExerciseDetailModal({ visible, onClose, exerciseName, sets, onAddSet, onUpdateSet, onToggleSet }: Props) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-zinc-900 p-6">
                <View className="flex-row items-center justify-between mb-8 mt-4">
                    <Text className="text-white text-3xl font-bold tracking-tighter w-[80%]">{exerciseName}</Text>
                    <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Table Header */}
                <View className="flex-row mb-4 px-2 border-b border-zinc-800 pb-2">
                    <Text className="w-8 text-white text-xs font-bold text-center uppercase" style={{ color: 'white' }}>Set</Text>
                    <Text className="flex-1 text-white text-xs font-bold text-center uppercase ml-4" style={{ color: 'white' }}>KG</Text>
                    <Text className="flex-1 text-white text-xs font-bold text-center uppercase" style={{ color: 'white' }}>Reps</Text>
                    <Text className="w-12 text-white text-xs font-bold text-center uppercase" style={{ color: 'white' }}>Done</Text>
                </View>

                {sets.map((set, idx) => (
                    <View
                        key={set.id}
                        className={`flex-row items-center mb-3 p-2 rounded-2xl ${set.is_completed ? 'bg-neonGreen/10 border border-neonGreen/20' : 'bg-black/40 border border-zinc-800'}`}
                    >
                        <View className="w-8 items-center justify-center">
                            <Text className={`font-bold text-sm ${set.is_completed ? 'text-neonGreen' : 'text-white'}`}>{idx + 1}</Text>
                        </View>

                        <View className="flex-1 ml-4 mr-2">
                            <TextInput
                                className="bg-transparent text-white text-center py-3 font-bold text-2xl"
                                defaultValue={set.weight > 0 ? set.weight.toString() : ''}
                                keyboardType="numeric"
                                placeholder="-"
                                placeholderTextColor="#3F3F46"
                                onEndEditing={(e) => onUpdateSet(set.id, 'weight', e.nativeEvent.text)}
                            />
                        </View>

                        <View className="flex-1 mr-4">
                            <TextInput
                                className="bg-transparent text-white text-center py-3 font-bold text-2xl"
                                defaultValue={set.reps > 0 ? set.reps.toString() : ''}
                                keyboardType="numeric"
                                placeholder="-"
                                placeholderTextColor="#3F3F46"
                                onEndEditing={(e) => onUpdateSet(set.id, 'reps', e.nativeEvent.text)}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={() => onToggleSet(set.id, !!set.is_completed)}
                            className={`w-12 h-12 items-center justify-center rounded-xl ${set.is_completed ? 'bg-neonGreen' : 'bg-zinc-800 border border-zinc-600'}`}
                        >
                            {!!set.is_completed && <Ionicons name="checkmark" size={28} color="black" />}
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity
                    onPress={onAddSet}
                    className="w-full py-4 bg-zinc-800 mt-4 rounded-xl items-center border border-zinc-700 border-dashed active:bg-zinc-700"
                >
                    <Text className="text-white font-bold uppercase tracking-widest">+ Add Set</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}
