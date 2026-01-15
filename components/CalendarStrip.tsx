import { View, Text, Pressable } from "react-native";
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from "date-fns";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

interface CalendarStripProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export function CalendarStrip({ selectedDate, onSelectDate }: CalendarStripProps) {
    // Initialize with the week of the selected date, or today
    const [currentWeekStart, setCurrentWeekStart] = useState(
        startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 })
    );
    const [weekDays, setWeekDays] = useState<Date[]>([]);

    // If selectedDate changes externally (e.g. from a "Jump to Today" button), sync the week
    useEffect(() => {
        setCurrentWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
    }, [selectedDate]);

    useEffect(() => {
        const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
        setWeekDays(days);
    }, [currentWeekStart]);

    const prevWeek = () => {
        Haptics.selectionAsync();
        setCurrentWeekStart(d => subWeeks(d, 1));
    };

    const nextWeek = () => {
        Haptics.selectionAsync();
        setCurrentWeekStart(d => addWeeks(d, 1));
    };

    return (
        <View className="mb-6">
            {/* Week Navigation Header */}
            <View className="flex-row justify-between items-center mb-4 px-1">
                <Pressable onPress={prevWeek} className="p-2">
                    <Ionicons name="chevron-back" size={20} color="gray" />
                </Pressable>

                <Text className="text-white text-base font-bold uppercase tracking-widest">
                    {format(addDays(currentWeekStart, 3), "MMMM yyyy")}
                </Text>

                <Pressable onPress={nextWeek} className="p-2">
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </Pressable>
            </View>

            {/* Days Row */}
            <View className="flex-row justify-between bg-surface p-2 rounded-2xl border border-surfaceHighlight">
                {weekDays.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    return (
                        <Pressable
                            key={index}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onSelectDate(date);
                            }}
                            className={`items-center justify-center w-10 h-14 rounded-xl ${isSelected ? 'bg-primary' : 'bg-transparent'}`}
                        >
                            <Text className={`text-xs font-bold mb-1 ${isSelected ? 'text-black' : 'text-secondary'}`}>
                                {format(date, "EEE")}
                            </Text>
                            <Text className={`text-lg font-bold ${isSelected ? 'text-black' : isToday ? 'text-primary' : 'text-white'}`}>
                                {format(date, "d")}
                            </Text>
                            {/* Dot indicator for Today if not selected */}
                            {!isSelected && isToday && (
                                <View className="w-1 h-1 rounded-full bg-primary mt-1" />
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
