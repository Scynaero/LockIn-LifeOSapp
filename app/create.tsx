import { View, Text, TextInput, Pressable, ScrollView, Switch, Platform } from "react-native";
import { useState, useEffect } from "react";
import { HabitService } from "../services/HabitService";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";
import { NotificationService } from "../services/NotificationService";

export default function CreateHabitScreen() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<'build' | 'quit'>('build');
    // Frequency Logic
    const [isEveryDay, setIsEveryDay] = useState(true);
    const [frequency, setFrequency] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

    // Reminder Logic
    const [reminderTime, setReminderTime] = useState<Date | null>(null);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // HealthKit Logic
    const [useHealthKit, setUseHealthKit] = useState(false);
    const [healthType, setHealthType] = useState('steps'); // steps, sleep, workout

    // Custom Goal Logic
    const [hasCustomGoal, setHasCustomGoal] = useState(false);
    const [customGoal, setCustomGoal] = useState('1');
    const [customUnit, setCustomUnit] = useState('count');

    // Auto-detect unit
    useEffect(() => {
        const n = name.toLowerCase();
        if ((n.includes('water') || n.includes('drink') || n.includes('hydrate')) && !useHealthKit) {
            setCustomUnit('L');
            setHasCustomGoal(true);
        } else if ((n.includes('read') || n.includes('book')) && !useHealthKit) {
            setCustomUnit('pages');
            setHasCustomGoal(true);
        }
    }, [name, useHealthKit]);

    const toggleDay = (day: string) => {
        if (frequency.includes(day)) {
            // Don't allow empty frequency
            if (frequency.length > 1) {
                setFrequency(frequency.filter(d => d !== day));
            }
        } else {
            setFrequency([...frequency, day]);
        }
    };

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleCreate = async () => {
        if (!name.trim()) return;

        // Final frequency: if 'Is Every Day' is true, save 'daily', else array
        const finalFreq = isEveryDay ? 'daily' : frequency;
        // Determine Color
        const habitColor = type === 'quit' ? '#FF4545' : '#CCFF00';

        // Defaults
        let finalGoal = 1;
        let finalUnit = 'count';
        let finalIcon = 'activity';

        if (useHealthKit) {
            if (healthType === 'steps') {
                finalGoal = 10000;
                finalUnit = 'steps';
                finalIcon = 'walk';
            } else if (healthType === 'sleep') {
                finalGoal = 480; // 8 hours
                finalUnit = 'min';
                finalIcon = 'moon';
            } else if (healthType === 'workout') {
                finalGoal = 45;
                finalUnit = 'min';
                finalIcon = 'fitness';
            }
        } else if (hasCustomGoal) {
            finalGoal = parseFloat(customGoal) || 1;
            finalUnit = customUnit || 'count';
            if (name.toLowerCase().includes('water')) finalIcon = 'water';
            if (name.toLowerCase().includes('read')) finalIcon = 'book';
        }

        const id = await HabitService.createHabit(
            name,
            type,
            finalUnit,
            finalGoal,
            finalFreq,
            habitColor,
            finalIcon,
            description,
            finalGoal, // target_value
            useHealthKit ? healthType : undefined
        );

        if (reminderTime) {
            const hasPermission = await NotificationService.requestPermissions();
            if (hasPermission) {
                await NotificationService.scheduleReminder({
                    id,
                    name,
                    reminder_time: reminderTime.toISOString()
                });
                // Also update DB
                await HabitService.updateHabit(id, { reminder_time: reminderTime.toISOString() });
            }
        }

        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-6">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-primary">New Protocol</Text>
                <View className="flex-row gap-4 items-center">
                    <Pressable onPress={() => router.push('/archive')} className="flex-row gap-1 items-center bg-surfaceHighlight px-3 py-1 rounded-full">
                        <Ionicons name="archive-outline" size={16} color="#999" />
                        <Text className="text-secondary text-xs font-bold">ARCHIVES</Text>
                    </Pressable>
                    <Pressable onPress={() => router.back()}>
                        <X color="white" size={24} />
                    </Pressable>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-secondary mb-2 font-medium">NAME</Text>
                <TextInput
                    className="bg-surface text-primary p-4 rounded-xl mb-6 text-lg border border-surfaceHighlight font-medium"
                    placeholder="e.g. Cold Plunge"
                    placeholderTextColor="#444"
                    autoFocus
                    value={name}
                    onChangeText={setName}
                />

                <Text className="text-secondary mb-2 font-medium">DESCRIPTION</Text>
                <TextInput
                    className="bg-surface text-primary p-4 rounded-xl mb-6 text-base border border-surfaceHighlight font-medium"
                    placeholder="e.g. 3 minutes at 40°F"
                    placeholderTextColor="#444"
                    value={description}
                    onChangeText={setDescription}
                />

                <Text className="text-secondary mb-2 font-medium">FREQUENCY</Text>
                <View className="flex-row mb-4 bg-surface rounded-xl p-1 border border-surfaceHighlight">
                    <Pressable
                        onPress={() => setIsEveryDay(true)}
                        className={`flex-1 py-3 rounded-lg items-center ${isEveryDay ? 'bg-primary' : 'bg-transparent'}`}
                    >
                        <Text className={`font-bold ${isEveryDay ? 'text-black' : 'text-secondary'}`}>Every Day</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setIsEveryDay(false)}
                        className={`flex-1 py-3 rounded-lg items-center ${!isEveryDay ? 'bg-primary' : 'bg-transparent'}`}
                    >
                        <Text className={`font-bold ${!isEveryDay ? 'text-black' : 'text-secondary'}`}>Select Days</Text>
                    </Pressable>
                </View>

                {!isEveryDay && (
                    <View className="flex-row flex-wrap justify-between mb-8">
                        {DAYS.map(day => (
                            <Pressable
                                key={day}
                                onPress={() => toggleDay(day)}
                                className={`w-10 h-10 rounded-full items-center justify-center mb-2 border ${frequency.includes(day) ? 'bg-primary border-primary' : 'bg-surface border-surfaceHighlight'}`}
                            >
                                <Text className={`font-bold text-xs ${frequency.includes(day) ? 'text-black' : 'text-secondary'}`}>
                                    {day.charAt(0)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                <View className="flex-row justify-between items-center mb-2 mt-4">
                    <Text className="text-secondary font-medium">CUSTOM GOAL</Text>
                    <Switch
                        value={hasCustomGoal}
                        onValueChange={(v) => {
                            setHasCustomGoal(v);
                            if (v) setUseHealthKit(false);
                        }}
                        trackColor={{ false: '#3F3F46', true: '#CCFF00' }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : (hasCustomGoal ? '#000' : '#f4f3f4')}
                    />
                </View>

                {hasCustomGoal && (
                    <View className="flex-row gap-4 mb-6">
                        <View className="flex-1">
                            <Text className="text-secondary mb-1 text-xs font-bold">TARGET</Text>
                            <TextInput
                                className="bg-surface text-primary p-4 rounded-xl text-lg border border-surfaceHighlight font-bold text-center"
                                keyboardType="numeric"
                                value={customGoal}
                                onChangeText={setCustomGoal}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-secondary mb-1 text-xs font-bold">UNIT</Text>
                            <TextInput
                                className="bg-surface text-primary p-4 rounded-xl text-lg border border-surfaceHighlight font-bold text-center"
                                placeholder="e.g. min"
                                placeholderTextColor="#666"
                                value={customUnit}
                                onChangeText={setCustomUnit}
                            />
                        </View>
                    </View>
                )}

                <View className="flex-row justify-between items-center mb-2 mt-4">
                    <Text className="text-secondary font-medium">AUTOMATION (APPLE HEALTH)</Text>
                    <Switch
                        value={useHealthKit}
                        onValueChange={(v) => {
                            setUseHealthKit(v);
                            if (v) setHasCustomGoal(false);
                        }}
                        trackColor={{ false: '#3F3F46', true: '#CCFF00' }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : (useHealthKit ? '#000' : '#f4f3f4')}
                    />
                </View>

                {useHealthKit && (
                    <View className="flex-row mb-6 bg-surface rounded-xl p-1 border border-surfaceHighlight">
                        <Pressable onPress={() => setHealthType('steps')} className={`flex-1 py-3 rounded-lg items-center ${healthType === 'steps' ? 'bg-zinc-700' : ''}`}>
                            <Text className="text-white font-bold">Steps</Text>
                        </Pressable>
                        <Pressable onPress={() => setHealthType('sleep')} className={`flex-1 py-3 rounded-lg items-center ${healthType === 'sleep' ? 'bg-zinc-700' : ''}`}>
                            <Text className="text-white font-bold">Sleep</Text>
                        </Pressable>
                        <Pressable onPress={() => setHealthType('workout')} className={`flex-1 py-3 rounded-lg items-center ${healthType === 'workout' ? 'bg-zinc-700' : ''}`}>
                            <Text className="text-white font-bold">Gym</Text>
                        </Pressable>
                    </View>
                )}

                <Text className="text-secondary mb-2 font-medium mt-2">REMINDER (OPTIONAL)</Text>
                <Pressable
                    onPress={() => setShowTimePicker(true)}
                    className="bg-surface p-4 rounded-xl mb-6 border border-surfaceHighlight flex-row justify-between items-center"
                >
                    <Text className={reminderTime ? "text-primary font-bold" : "text-secondary"}>
                        {reminderTime ? reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set Time'}
                    </Text>
                    <Ionicons name="time-outline" size={24} color={reminderTime ? "#CCFF00" : "#666"} />
                </Pressable>

                {showTimePicker && (
                    <View className="bg-surface p-4 rounded-xl border border-surfaceHighlight mb-6 items-center">
                        <DateTimePicker
                            value={reminderTime || new Date()}
                            mode="time"
                            display="spinner"
                            themeVariant="dark"
                            onChange={(event, date) => {
                                // On Android, event.type === 'set' means done.
                                // On iOS, it fires on spin. We don't close it, just update.
                                if (date) setReminderTime(date);
                                if (event.type === 'set' && Platform.OS === 'android') {
                                    setShowTimePicker(false);
                                }
                            }}
                            textColor="white"
                        />
                        {Platform.OS === 'ios' && (
                            <Pressable
                                onPress={() => setShowTimePicker(false)}
                                className="bg-primary px-6 py-2 rounded-full mt-4"
                            >
                                <Text className="text-black font-bold">Done</Text>
                            </Pressable>
                        )}
                    </View>
                )}

                <Text className="text-secondary mb-2 font-medium">TYPE</Text>
                <View className="flex-row mb-10">
                    <Pressable
                        onPress={() => setType('build')}
                        className={`flex-1 p-4 rounded-l-xl border border-surfaceHighlight items-center ${type === 'build' ? 'bg-primary' : 'bg-surface'}`}
                    >
                        <Text className={`font-bold ${type === 'build' ? 'text-black' : 'text-secondary'}`}>BUILD</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setType('quit')}
                        className={`flex-1 p-4 rounded-r-xl border border-surfaceHighlight items-center ${type === 'quit' ? 'bg-error' : 'bg-surface'}`}
                    >
                        <Text className={`font-bold ${type === 'quit' ? 'text-black' : 'text-secondary'}`}>QUIT</Text>
                    </Pressable>
                </View>

                <Pressable
                    className="bg-primary p-4 rounded-xl items-center mt-2 active:opacity-90 mb-10"
                    onPress={handleCreate}
                >
                    <Text className="text-black font-bold text-lg tracking-widest">INITIATE</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
