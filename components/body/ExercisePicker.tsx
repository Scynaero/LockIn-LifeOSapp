import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BodyService, Exercise } from '../../services/BodyService';
import FilterModal from './FilterModal';
import AddCustomExerciseModal from './AddCustomExerciseModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (exerciseId: string) => void;
}

interface ExtendedExercise extends Exercise {
    category_icon?: string;
    secondary_muscles?: string[];
}

export default function ExercisePicker({ visible, onClose, onSelect }: Props) {
    const [exercises, setExercises] = useState<ExtendedExercise[]>([]);
    const [search, setSearch] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);

    useEffect(() => {
        if (visible) {
            loadExercises();
        }
    }, [visible]);

    const loadExercises = async () => {
        const data = await BodyService.getExercises();
        // Parse secondary_muscles from JSON string if needed
        const parsedData = data.map((ex: any) => ({
            ...ex,
            secondary_muscles: ex.secondary_muscles
                ? (typeof ex.secondary_muscles === 'string' ? JSON.parse(ex.secondary_muscles) : ex.secondary_muscles)
                : []
        }));
        setExercises(parsedData);
    };

    const handleFilterApply = (equipment: string | null, muscle: string | null, secondary: string | null) => {
        setSelectedEquipment(equipment);
        setSelectedMuscle(muscle);
        setSelectedSecondary(secondary);
        setShowFilterModal(false);
    };

    const handleSaveCustomExercise = async (customExercise: {
        name: string;
        target_muscle: string;
        secondary_muscles: string[];
        equipment: string;
    }) => {
        try {
            const exerciseId = await BodyService.createCustomExercise(customExercise);
            setShowCustomExerciseModal(false);
            // Reload exercises to show the new custom exercise
            await loadExercises();
            // Auto-select the newly created exercise
            onSelect(exerciseId);
        } catch (error) {
            console.error('Error saving custom exercise:', error);
            alert('Failed to save custom exercise');
        }
    };

    // Filter exercises
    const filtered = useMemo(() => {
        return exercises.filter(e => {
            const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.target_muscle.toLowerCase().includes(search.toLowerCase());
            const matchesEquipment = !selectedEquipment || e.equipment === selectedEquipment;
            const matchesMuscle = !selectedMuscle || e.target_muscle.includes(selectedMuscle);
            const matchesSecondary = !selectedSecondary || (e.secondary_muscles && e.secondary_muscles.some(s => s.includes(selectedSecondary)));
            return matchesSearch && matchesEquipment && matchesMuscle && matchesSecondary;
        });
    }, [exercises, search, selectedEquipment, selectedMuscle, selectedSecondary]);

    const getIconForEquipment = (equipment: string) => {
        const iconMap: Record<string, string> = {
            barbell: '🏋️',
            dumbbell: '🏋️',
            machine: '🤖',
            cable: '🔌',
            bodyweight: '💪'
        };
        return iconMap[equipment] || '🎯';
    };

    return (

        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-background">
                {/* Header */}
                <View className="p-4 border-b border-surfaceHighlight flex-row items-center justify-between">
                    <TouchableOpacity onPress={onClose}>
                        <Text className="text-primary text-lg font-bold">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold">Select Exercise</Text>
                    <TouchableOpacity onPress={() => setShowFilterModal(true)}>
                        <Ionicons name="funnel" size={24} color="#CCFF00" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="p-4 pb-2">
                    <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-2 border border-surfaceHighlight">
                        <Ionicons name="search" size={20} color="#666" />
                        <TextInput
                            className="flex-1 text-white text-base"
                            placeholder="Search exercises or muscles..."
                            placeholderTextColor="#666"
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                        />
                    </View>
                </View>

                {/* Add Custom Exercise Button */}
                <View className="px-4 pb-3">
                    <TouchableOpacity
                        onPress={() => setShowCustomExerciseModal(true)}
                        className="bg-surface/50 border-2 border-dashed border-primary rounded-lg px-4 py-3 flex-row items-center justify-center gap-2"
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#CCFF00" />
                        <Text className="text-primary font-bold text-base">Add Custom Exercise</Text>
                    </TouchableOpacity>
                </View>

                {/* Exercises List */}
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    className="px-4"
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="py-3 border-b border-surfaceHighlight flex-row justify-between items-center active:bg-white/5 px-2 rounded-lg"
                            onPress={() => onSelect(item.id)}
                        >
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <Text className="text-2xl">{item.category_icon || getIconForEquipment(item.equipment)}</Text>
                                    <Text className="text-white font-semibold flex-1">{item.name}</Text>
                                </View>
                                <View className="ml-8">
                                    <Text className="text-primary text-xs font-bold mb-1">{item.target_muscle}</Text>
                                    <View className="flex-row gap-2 flex-wrap mb-1">
                                        <Text className="text-secondary text-xs capitalize">{item.equipment}</Text>
                                    </View>
                                    {item.secondary_muscles && item.secondary_muscles.length > 0 && (
                                        <Text className="text-secondary text-xs">
                                            {item.secondary_muscles.join(', ')}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Ionicons name="add-circle" size={24} color="#CCFF00" />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-10">
                            <Text className="text-secondary">No exercises found</Text>
                        </View>
                    }
                />
                <FilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    onApply={handleFilterApply}
                    exercises={exercises}
                />

                <AddCustomExerciseModal
                    visible={showCustomExerciseModal}
                    onClose={() => setShowCustomExerciseModal(false)}
                    onSave={handleSaveCustomExercise}
                    exercises={exercises}
                />
            </View>
        </Modal>
    );
}
