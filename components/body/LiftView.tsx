import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BodyService, Workout } from '../../services/BodyService';
import { useFocusEffect } from 'expo-router';
import ActiveWorkout from './ActiveWorkout';
import { CalendarStrip } from '../CalendarStrip';
import { DateUtils } from '../../utils/DateUtils';

export default function LiftView() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);

    const checkWorkoutForDate = async () => {
        setLoading(true);
        const dateStr = DateUtils.getDateString(selectedDate);
        const workouts = await BodyService.getWorkoutsForDate(dateStr);
        // Just pick the first one for now (assuming 1 per day usually)
        if (workouts.length > 0) {
            setActiveWorkout(workouts[0]);
        } else {
            setActiveWorkout(null);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            checkWorkoutForDate();
        }, [selectedDate])
    );

    const handleStartWorkout = async () => {
        const dateStr = DateUtils.getDateString(selectedDate);
        const id = await BodyService.startWorkout('Workout ' + dateStr, dateStr);
        setActiveWorkout({
            id,
            date: dateStr, // Actually DB stores ISO, but this is for local obj
            name: 'Workout ' + dateStr,
            status: 'active',
            duration_sec: 0
        });
    };

    const handleFinish = () => {
        // When finishing, we just reload the state - it stays as a 'finished' workout but we might want to just show it as View mode?
        // User wants to log day-to-day, so probably just keep showing it.
        checkWorkoutForDate();
    };

    return (
        <View className="flex-1 bg-background">
            <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            <View className="flex-1 p-4">
                {loading ? (
                    <ActivityIndicator color="#CCFF00" />
                ) : activeWorkout ? (
                    <ActiveWorkout
                        workout={activeWorkout}
                        onFinish={handleFinish}
                        readOnly={false} // Always editable for now as requested
                    />
                ) : (
                    <View className="items-center justify-center flex-1">
                        <TouchableOpacity
                            className="w-48 h-48 rounded-full bg-zinc-900 border-4 border-neonGreen items-center justify-center shadow-lg shadow-neonGreen/50"
                            onPress={handleStartWorkout}
                        >
                            <Ionicons name="barbell" size={64} color="#CCFF00" />
                            <Text className="text-white font-bold text-xl mt-2 tracking-widest">START</Text>
                            <Text className="text-zinc-500 text-xs uppercase tracking-widest">Log Workout</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}
