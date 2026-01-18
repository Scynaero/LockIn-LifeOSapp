import { View, Text, TextInput, FlatList, Pressable, Keyboard, Dimensions, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { NotesService, Note } from '../../services/NotesService';
import { NotificationService } from '../../services/NotificationService';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MindView() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [reminderDate, setReminderDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState<Date | null>(null); // For iOS Modal

    const listRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const router = useRouter();

    const loadNotes = async () => {
        const loaded = await NotesService.getNotes({ habitId: null });
        setNotes(loaded);
    };

    useFocusEffect(
        useCallback(() => {
            loadNotes();
        }, [])
    );

    const handleCreate = async () => {
        if (!newNoteContent.trim()) {
            setIsCreating(false);
            setReminderDate(null);
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const note = await NotesService.createNote(
            newNoteContent.trim(),
            undefined,
            undefined,
            reminderDate ? reminderDate.toISOString() : null
        );

        if (reminderDate) {
            await NotificationService.scheduleNoteReminder(note.id, newNoteContent.trim(), reminderDate);
        }

        setNewNoteContent('');
        setReminderDate(null);
        setIsCreating(false);
        loadNotes();
    };

    const handleDelete = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await NotesService.deleteNote(id);
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const startCreating = () => {
        setIsCreating(true);
        setReminderDate(null);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
                setReminderDate(selectedDate);
            }
        } else {
            if (selectedDate) setTempDate(selectedDate);
        }
    };

    const openDatePicker = () => {
        Keyboard.dismiss();
        setTempDate(reminderDate || new Date());
        setShowDatePicker(true);
    };

    const confirmIOSDate = () => {
        if (tempDate) setReminderDate(tempDate);
        setShowDatePicker(false);
        // Re-focus input after closing modal
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const renderRightActions = (id: string, progress: any, dragX: any) => {
        return (
            <Pressable
                onPress={() => handleDelete(id)}
                className="bg-green-500 justify-center items-end px-6 h-full"
                style={{ width: SCREEN_WIDTH }}
            >
                <Ionicons name="checkmark-circle-outline" size={32} color="white" />
            </Pressable>
        );
    };

    const renderLeftActions = (id: string, progress: any, dragX: any) => {
        return (
            <Pressable
                onPress={() => handleDelete(id)}
                className="bg-red-500 justify-center items-start px-6 h-full"
                style={{ width: SCREEN_WIDTH }}
            >
                <Ionicons name="trash-outline" size={24} color="white" />
            </Pressable>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-black px-4" edges={['top']}>
            <View className="flex-1">
                {/* Header / Pull Area Placeholder */}
                <View className="items-center py-2 relative pb-4">
                    <Pressable
                        onPress={() => router.push('/note/archive')}
                        className="absolute left-0 top-0 p-2"
                    >
                        <Ionicons name="archive-outline" size={24} color="#71717A" />
                    </Pressable>

                    <Text className="text-secondary font-bold tracking-widest uppercase text-xs">The Mind</Text>

                    {!isCreating && (
                        <Pressable
                            onPress={startCreating}
                            className="absolute right-0 top-0 p-2"
                        >
                            <Ionicons name="add" size={24} color="#71717A" />
                        </Pressable>
                    )}
                </View>

                {isCreating && (
                    <Animated.View entering={SlideInUp.duration(300)} exiting={FadeIn} className="mb-4">
                        <View className="flex-row items-center bg-surface rounded-xl p-2">
                            <TextInput
                                ref={inputRef}
                                className="flex-1 text-white text-lg font-medium p-2"
                                placeholder="Clear your mind..."
                                placeholderTextColor="#52525B"
                                value={newNoteContent}
                                onChangeText={setNewNoteContent}
                                onSubmitEditing={handleCreate}
                                onBlur={() => {
                                    // Only auto-save/close if not opening date picker
                                    if (!showDatePicker) handleCreate();
                                }}
                                returnKeyType="done"
                                multiline
                            />
                            <Pressable
                                onPress={openDatePicker}
                                className={`p-2 rounded-full ${reminderDate ? 'bg-primary/20' : ''}`}
                            >
                                <Ionicons
                                    name={reminderDate ? "alarm" : "alarm-outline"}
                                    size={24}
                                    color={reminderDate ? "#10B981" : "#71717A"}
                                />
                            </Pressable>
                        </View>
                        {reminderDate && (
                            <Text className="text-green-500 text-xs text-right mt-1 mr-2 font-medium">
                                Reminder: {reminderDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        )}
                    </Animated.View>
                )}

                {/* Date Picker Modal for iOS / Native for Android */}
                {Platform.OS === 'ios' ? (
                    <Modal
                        transparent={true}
                        visible={showDatePicker}
                        animationType="fade"
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <View className="flex-1 justify-center items-center bg-black/80">
                            <View className="bg-zinc-900 w-[85%] rounded-2xl p-4 items-center border border-zinc-800">
                                <Text className="text-white font-bold text-lg mb-4">Set Reminder</Text>
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={tempDate || new Date()}
                                    mode="datetime"
                                    display="spinner"
                                    onChange={handleDateChange}
                                    themeVariant="dark"
                                    textColor="white"
                                />
                                <View className="flex-row justify-between w-full mt-4 border-t border-zinc-800 pt-4">
                                    <Pressable onPress={() => setShowDatePicker(false)} className="flex-1 items-center py-2">
                                        <Text className="text-zinc-400 text-lg">Cancel</Text>
                                    </Pressable>
                                    <View className="w-[1px] bg-zinc-800 h-full" />
                                    <Pressable onPress={confirmIOSDate} className="flex-1 items-center py-2">
                                        <Text className="text-primary font-bold text-lg">Set</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>
                ) : (
                    showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={reminderDate || new Date()}
                            mode="datetime"
                            is24Hour={true}
                            display="default"
                            onChange={handleDateChange}
                        />
                    )
                )}

                <FlatList
                    ref={listRef}
                    data={notes}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <Swipeable
                            renderRightActions={(p, d) => renderRightActions(item.id, p, d)}
                            renderLeftActions={(p, d) => renderLeftActions(item.id, p, d)}
                            onSwipeableLeftOpen={() => handleDelete(item.id)}
                            onSwipeableRightOpen={() => handleDelete(item.id)}
                            overshootRight={false}
                            overshootLeft={false}
                        >
                            <Pressable
                                onPress={() => router.push(`/note/${item.id}`)}
                                className={`p-4 border-b border-surfaceHighlight bg-black ${item.is_pinned ? 'bg-surface/30' : ''}`}
                                style={item.color ? { backgroundColor: item.color } : {}}
                            >
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text
                                        numberOfLines={1}
                                        className={`text-lg font-bold flex-1 mr-4 ${item.is_pinned ? 'text-primary' : (item.color ? 'text-black' : 'text-white')}`}
                                    >
                                        {item.content.split('\n')[0]}
                                    </Text>
                                    {!!item.is_pinned && <Ionicons name="star" size={14} color={item.color ? "black" : "#EAB308"} style={{ marginTop: 4 }} />}
                                </View>

                                <View className="flex-row items-center gap-2">
                                    {/* Reminder Indicator */}
                                    <Text className={`${item.reminder_time ? (item.color ? 'text-black font-bold' : 'text-green-500') : (item.color ? 'text-gray-800' : 'text-red-400')} text-xs font-medium`}>
                                        {item.reminder_time
                                            ? new Date(item.reminder_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        }
                                    </Text>

                                    {/* Audio Indicator */}
                                    {item.audio_uri && (
                                        <Ionicons name="mic" size={12} color={item.color ? "black" : "#71717A"} />
                                    )}

                                    {/* Location Indicator */}
                                    {item.location_text && (
                                        <Ionicons name="location" size={12} color={item.color ? "black" : "#71717A"} />
                                    )}

                                    <Text className={`${item.color ? 'text-black' : 'text-secondary'} text-xs flex-1`} numberOfLines={1}>
                                        {item.content.split('\n').slice(1).join(' ') || 'No additional text'}
                                    </Text>
                                </View>
                            </Pressable>
                        </Swipeable>
                    )}
                    ListEmptyComponent={
                        !isCreating ? (
                            <View className="flex-1 items-center justify-center mt-20 opacity-30">
                                <Ionicons name="finger-print-outline" size={64} color="white" />
                                <Text className="text-white mt-4 font-bold">Swipe down to think</Text>
                            </View>
                        ) : null
                    }
                    onScrollEndDrag={(e) => {
                        if (e.nativeEvent.contentOffset.y < -50 && !isCreating) {
                            startCreating();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        }
                    }}
                />
            </View>
        </SafeAreaView>
    );
}
