import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useEffect, useState } from "react";
import { HabitService, Habit } from "../services/HabitService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';

export default function ArchiveScreen() {
    const router = useRouter();
    const [archived, setArchived] = useState<Habit[]>([]);

    const loadArchived = async () => {
        const habits = await HabitService.getArchivedHabits();
        setArchived(habits);
    };

    useEffect(() => {
        loadArchived();
    }, []);

    const handleRestore = async (habit: Habit) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            "Restore Protocol",
            `Bring "${habit.name}" back to your daily list?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Restore",
                    onPress: async () => {
                        await HabitService.restoreHabit(habit.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        loadArchived();
                    }
                }
            ]
        );
    };

    // Permanent Delete Option from Archive
    const handleDelete = async (habit: Habit) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Delete Permanently",
            "This will remove all history and data for this protocol forever.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await HabitService.deleteHabit(habit.id);
                        loadArchived();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-4">
            {/* Header */}
            <View className="flex-row items-center gap-4 mb-6">
                <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-surface">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
                <Text className="text-white text-xl font-bold">Archived Protocols</Text>
            </View>

            {archived.length === 0 ? (
                <View className="flex-1 items-center justify-center opacity-50">
                    <Ionicons name="archive-outline" size={64} color="gray" />
                    <Text className="text-secondary mt-4">No archived protocols</Text>
                </View>
            ) : (
                <FlatList
                    data={archived}
                    keyExtractor={item => item.id}
                    contentContainerClassName="gap-3 pb-10"
                    renderItem={({ item }) => (
                        <View className="bg-surface p-4 rounded-xl flex-row items-center justify-between border border-white/5">
                            <View className="flex-row items-center gap-3 flex-1">
                                <View className="w-10 h-10 rounded-full items-center justify-center bg-black/20">
                                    <Text className="text-xl">{item.icon}</Text>
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-lg">{item.name}</Text>
                                    {item.archived_at && (
                                        <Text className="text-secondary text-xs">Archived on {item.archived_at}</Text>
                                    )}
                                </View>
                            </View>

                            <View className="flex-row gap-2">
                                <Pressable
                                    onPress={() => handleDelete(item)}
                                    className="w-10 h-10 bg-red-900/20 rounded-full items-center justify-center border border-red-500/20"
                                >
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </Pressable>
                                <Pressable
                                    onPress={() => handleRestore(item)}
                                    className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center border border-primary/20"
                                >
                                    <Ionicons name="refresh" size={18} color="#CCFF00" />
                                </Pressable>
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
