import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { NotesService, Note } from '../../services/NotesService';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ArchiveView() {
    const [notes, setNotes] = useState<Note[]>([]);
    const router = useRouter();

    const loadNotes = async () => {
        const loaded = await NotesService.getArchivedNotes();
        setNotes(loaded);
    };

    useFocusEffect(
        useCallback(() => {
            loadNotes();
        }, [])
    );

    const handleRestore = async (id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await NotesService.restoreNote(id);
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const handlePermanentDelete = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await NotesService.permanentlyDeleteNote(id);
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const handleEmptyArchive = () => {
        if (notes.length === 0) return;
        Alert.alert(
            "Empty Archive",
            "Are you sure you want to permanently delete all archived notes? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: async () => {
                        await NotesService.clearArchive();
                        loadNotes();
                    }
                }
            ]
        );
    };

    const renderRightActions = (id: string) => (
        <Pressable
            onPress={() => handleRestore(id)}
            className="bg-green-500 justify-center items-end px-6 h-full"
            style={{ width: '100%' }}
        >
            <Ionicons name="refresh" size={24} color="white" />
        </Pressable>
    );

    const renderLeftActions = (id: string) => (
        <Pressable
            onPress={() => handlePermanentDelete(id)}
            className="bg-red-600 justify-center items-start px-6 h-full"
            style={{ width: '100%' }}
        >
            <Ionicons name="trash" size={24} color="white" />
        </Pressable>
    );

    return (
        <SafeAreaView className="flex-1 bg-black px-4" edges={['top']}>
            <View className="flex-row justify-between items-center py-4 border-b border-surfaceHighlight mb-2">
                <Pressable onPress={() => router.back()} className="flex-row items-center gap-1">
                    <Ionicons name="chevron-back" size={24} color="#71717A" />
                    <Text className="text-secondary font-medium">Mind</Text>
                </Pressable>
                <Text className="text-white font-bold text-lg">Archive</Text>
                <Pressable onPress={handleEmptyArchive}>
                    <Text className={`font-medium ${notes.length > 0 ? 'text-red-500' : 'text-zinc-600'}`}>Empty</Text>
                </Pressable>
            </View>

            <FlatList
                data={notes}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <Swipeable
                        renderRightActions={() => renderRightActions(item.id)}
                        renderLeftActions={() => renderLeftActions(item.id)}
                        onSwipeableRightOpen={() => handleRestore(item.id)}
                        onSwipeableLeftOpen={() => handlePermanentDelete(item.id)}
                    >
                        <View className="p-4 border-b border-surfaceHighlight bg-black opacity-60">
                            <View className="flex-row justify-between items-start mb-1">
                                <Text
                                    numberOfLines={1}
                                    className="text-lg font-bold flex-1 mr-4 text-zinc-400"
                                >
                                    {item.content.split('\n')[0]}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Text className="text-zinc-600 text-xs font-medium">
                                    {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </Text>
                                <Text className="text-zinc-600 text-xs flex-1" numberOfLines={1}>
                                    {item.content.split('\n').slice(1).join(' ') || 'No additional text'}
                                </Text>
                            </View>
                        </View>
                    </Swipeable>
                )}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center mt-20 opacity-30">
                        <Ionicons name="trash-bin-outline" size={64} color="white" />
                        <Text className="text-white mt-4 font-bold">Trash is empty</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
