import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Habit } from '../services/HabitService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface LogValueModalProps {
    visible: boolean;
    habit: Habit | null;
    onClose: () => void;
    onSave: (value: number) => void;
}

export const LogValueModal = ({ visible, habit, onClose, onSave }: LogValueModalProps) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        if (habit) {
            // Pre-fill with existing value or 0??
            // User said: "I have drank one liter... change it to 5 liters"
            // So we show CURRENT value.
            setValue((habit.completed_value || 0).toString());
        }
    }, [habit, visible]);

    const handleSave = () => {
        const num = parseFloat(value);
        if (isNaN(num)) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSave(num);
        onClose();
    };

    if (!habit) return null;

    const isSleep = habit.health_type === 'sleep';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center items-center bg-black/80 p-4"
            >
                <View className="bg-surface w-full max-w-sm rounded-3xl p-6 border border-surfaceHighlight">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-bold">{habit.name}</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color="#71717A" />
                        </Pressable>
                    </View>

                    <Text className="text-secondary text-sm mb-2 font-medium uppercase tracking-wider">
                        {isSleep ? 'Enter Hours' : `Log ${habit.unit}`}
                    </Text>

                    <View className="flex-row items-center justify-between mb-8">
                        <Pressable
                            onPress={() => {
                                const curr = parseFloat(value) || 0;
                                setValue(Math.max(0, curr - (isSleep ? 0.5 : 1)).toString());
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            className="w-12 h-12 rounded-full bg-surfaceHighlight items-center justify-center"
                        >
                            <Ionicons name="remove" size={24} color="white" />
                        </Pressable>

                        <TextInput
                            value={value}
                            onChangeText={setValue}
                            keyboardType="numeric"
                            className="text-center text-4xl font-bold text-primary w-40"
                            autoFocus
                            selectTextOnFocus
                        />

                        <Pressable
                            onPress={() => {
                                const curr = parseFloat(value) || 0;
                                setValue((curr + (isSleep ? 0.5 : 1)).toString());
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            className="w-12 h-12 rounded-full bg-surfaceHighlight items-center justify-center"
                        >
                            <Ionicons name="add" size={24} color="white" />
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={handleSave}
                        className="bg-primary py-4 rounded-xl items-center active:opacity-90"
                    >
                        <Text className="text-black font-bold text-lg">Update Progress</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
