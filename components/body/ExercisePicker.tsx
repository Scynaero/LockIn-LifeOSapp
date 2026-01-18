import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BodyService, Exercise } from '../../services/BodyService';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (exerciseId: string) => void;
}

export default function ExercisePicker({ visible, onClose, onSelect }: Props) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (visible) {
            loadExercises();
        }
    }, [visible]);

    const loadExercises = async () => {
        const data = await BodyService.getExercises();
        setExercises(data);
    };

    const filtered = exercises.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-zinc-900">
                <View className="p-4 border-b border-zinc-800 flex-row items-center gap-4">
                    <TouchableOpacity onPress={onClose}>
                        <Text className="text-neonGreen text-lg font-bold">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold">Select Exercise</Text>
                </View>

                <View className="p-4">
                    <View className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center gap-2">
                        <Ionicons name="search" size={20} color="#71717A" />
                        <TextInput
                            className="flex-1 text-white text-base"
                            placeholder="Search exercises..."
                            placeholderTextColor="#71717A"
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                        />
                    </View>
                </View>

                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    className="px-4"
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="py-4 border-b border-zinc-800 flex-row justify-between items-center"
                            onPress={() => onSelect(item.id)}
                        >
                            <View className="flex-row items-center gap-4">
                                {/* Thumbnail Logic: Basic keyword matching for demo assets */}
                                <View className="w-12 h-12 bg-white rounded-full items-center justify-center overflow-hidden">
                                    {item.name.toLowerCase().includes('bench') ? (
                                        <Image source={require('../../assets/images/bench_icon.png')} className="w-full h-full" resizeMode="cover" />
                                    ) : item.name.toLowerCase().includes('squat') ? (
                                        <Image source={require('../../assets/images/squat_icon.png')} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        // Fallback icon
                                        <Ionicons name="barbell" size={24} color="black" />
                                    )}
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-lg">{item.name}</Text>
                                    <Text className="text-zinc-500 text-sm capitalize">{item.target_muscle} • {item.equipment}</Text>
                                </View>
                            </View>
                            <Ionicons name="add-circle-outline" size={24} color="#CCFF00" />
                        </TouchableOpacity>
                    )}
                />
            </View>
        </Modal>
    );
}
