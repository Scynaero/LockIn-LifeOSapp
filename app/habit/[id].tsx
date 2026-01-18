import { View, Text, ScrollView, Pressable, Alert, Modal, TextInput, Switch, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { HabitService, Habit } from "../../services/HabitService";
import { NotesService, Note } from "../../services/NotesService";
import { Heatmap } from "../../components/Heatmap";
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NotificationService } from "../../services/NotificationService";
import { DateUtils } from "../../utils/DateUtils";

export default function HabitDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [habit, setHabit] = useState<Habit | null>(null);
    const [history, setHistory] = useState<Record<string, number>>({});
    const [stats, setStats] = useState({ streak: 0, total: 0 });
    const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');

    // Notes State
    const [notes, setNotes] = useState<Note[]>([]);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNote, setNewNote] = useState('');

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editReminder, setEditReminder] = useState<Date | null>(null);
    const [editFrequency, setEditFrequency] = useState<string[] | 'daily'>('daily');
    const [showTimePicker, setShowTimePicker] = useState(false);

    const loadData = async () => {
        if (!id || typeof id !== 'string') return;
        const habits = await HabitService.getHabits();
        const found = habits.find(h => h.id === id);
        if (found) {
            setHabit(found);
            setEditName(found.name);
            setEditDesc(found.description || '');
            setEditReminder(found.reminder_time ? new Date(found.reminder_time) : null);
            setEditFrequency(found.frequency as any);

            const hist = await HabitService.getHabitHistory(id);
            setHistory(hist);
            setStats({
                streak: found.current_streak,
                total: Object.keys(hist).length
            });

            // Load Notes
            const habitNotes = await NotesService.getNotes({ habitId: id });
            setNotes(habitNotes);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleSave = async () => {
        if (!habit) return;

        await HabitService.updateHabit(habit.id, {
            name: editName,
            description: editDesc,
            reminder_time: editReminder ? editReminder.toISOString() : undefined,
            frequency: editFrequency
        });

        // Update Notification
        if (editReminder) {
            const hasPermission = await NotificationService.requestPermissions();
            if (hasPermission) {
                await NotificationService.scheduleReminder({
                    ...habit,
                    name: editName,
                    reminder_time: editReminder.toISOString()
                });
            }
        } else {
            await NotificationService.cancelReminder(habit.id);
        }

        setIsEditing(false);
        loadData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleSaveNote = async () => {
        if (!newNote.trim() || !habit) return;
        await NotesService.createNote(newNote.trim(), habit.id);
        setNewNote('');
        setIsAddingNote(false);
        loadData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleDeleteNote = async (noteId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await NotesService.deleteNote(noteId);
        loadData();
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Delete Protocol",
            "Are you sure you want to permanently delete this protocol? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (typeof id === 'string') {
                            await HabitService.deleteHabit(id);
                            router.back();
                        }
                    }
                }
            ]
        );
    };

    const handleArchive = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Archive Protocol",
            "This will hide the protocol from your daily list but keep your history. You can restore it later.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Archive",
                    onPress: async () => {
                        if (typeof id === 'string') {
                            await HabitService.archiveHabit(id);
                            router.back();
                        }
                    }
                }
            ]
        );
    };

    const handleReset = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Reset Progress",
            "This will erase all completion history for this protocol. Streak will become 0.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        if (typeof id === 'string') {
                            await HabitService.resetHabitProgress(id);
                            loadData();
                            setIsEditing(false);
                        }
                    }
                }
            ]
        );
    };

    const toggleFreeze = async () => {
        if (!habit) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await HabitService.freezeDate(habit.id, DateUtils.getTodayDateString());
        loadData();
    };

    if (!habit) return <View className="flex-1 bg-background" />;

    return (
        <SafeAreaView className="flex-1 bg-background p-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
                <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-surface">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
                <Text className="text-secondary font-bold text-lg">PROTOCOL DETAILS</Text>
                <Pressable onPress={handleDelete} className="w-10 h-10 items-center justify-center rounded-full bg-surface active:bg-red-900/20">
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
            </View>

            {/* Custom Tab Switcher */}
            <View className="flex-row bg-surface p-1 rounded-xl mb-6 border border-surfaceHighlight">
                <Pressable
                    onPress={() => setActiveTab('overview')}
                    className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'overview' ? 'bg-primary' : 'transparent'}`}
                >
                    <Text className={`font-bold ${activeTab === 'overview' ? 'text-black' : 'text-secondary'}`}>Overview</Text>
                </Pressable>
                <Pressable
                    onPress={() => setActiveTab('notes')}
                    className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'notes' ? 'bg-primary' : 'transparent'}`}
                >
                    <Text className={`font-bold ${activeTab === 'notes' ? 'text-black' : 'text-secondary'}`}>Notes ({notes.length})</Text>
                </Pressable>
            </View>

            {activeTab === 'overview' ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="items-center mb-8">
                        <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-4 border-2 shadow-lg" style={{ borderColor: habit.color, shadowColor: habit.color }}>
                            <Text className="text-3xl">{habit.icon || '⚡️'}</Text>
                        </View>
                        <Text className="text-3xl font-bold text-white tracking-tighter text-center">{habit.name}</Text>
                        {habit.description && (
                            <Text className="text-secondary text-base mt-2 text-center px-4">{habit.description}</Text>
                        )}
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row gap-3 mb-6">
                        <View className="flex-1 bg-surface p-4 rounded-2xl border border-surfaceHighlight items-center">
                            <Text className="text-3xl font-bold" style={{ color: history[DateUtils.getTodayDateString()] === 2 ? '#60A5FA' : habit.color }}>{stats.streak}</Text>
                            <Text className="text-secondary text-xs uppercase tracking-widest mt-1">
                                {habit.type === 'quit' ? 'Days Free' : 'Current Streak'}
                            </Text>
                        </View>
                        <View className="flex-1 bg-surface p-4 rounded-2xl border border-surfaceHighlight items-center">
                            <Text className="text-3xl font-bold text-white">{stats.total}</Text>
                            <Text className="text-secondary text-xs uppercase tracking-widest mt-1">Total Days</Text>
                        </View>
                    </View>

                    {/* Freeze Control */}
                    <Pressable
                        onPress={toggleFreeze}
                        className={`p-4 rounded-2xl mb-6 flex-row items-center justify-between border ${history[DateUtils.getTodayDateString()] === 2 ? 'bg-blue-900/40 border-blue-500' : 'bg-surface border-surfaceHighlight'}`}
                    >
                        <View>
                            <Text className={`font-bold text-lg ${history[DateUtils.getTodayDateString()] === 2 ? 'text-blue-400' : 'text-white'}`}>
                                {history[DateUtils.getTodayDateString()] === 2 ? 'Day Frozen 🧊' : 'Freeze Today?'}
                            </Text>
                            <Text className="text-secondary text-xs">
                                {history[DateUtils.getTodayDateString()] === 2 ? 'Streak is safe.' : 'Save streak proactively if busy.'}
                            </Text>
                        </View>
                        <Ionicons name="snow" size={24} color={history[DateUtils.getTodayDateString()] === 2 ? '#60A5FA' : '#71717A'} />
                    </Pressable>

                    {/* Individual Heatmap */}
                    <View className="bg-surface p-4 rounded-2xl border border-surfaceHighlight mb-6">
                        <Text className="text-white font-bold mb-4 text-lg">Consistency Map</Text>
                        <Heatmap data={history} />
                    </View>

                    {/* Metadata / Edit Section */}
                    <View className="bg-surface p-4 rounded-2xl border border-surfaceHighlight gap-4 mb-10">
                        <View className="flex-row justify-between items-center py-2 border-b border-white/5">
                            <Text className="text-secondary">Reminder</Text>
                            <Text className="text-white font-bold">
                                {habit.reminder_time
                                    ? new Date(habit.reminder_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Off'}
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => setIsEditing(true)}
                            className="mt-2 bg-white/10 p-3 rounded-xl items-center active:bg-white/20"
                        >
                            <Text className="text-white font-bold">Edit Details</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            ) : (
                <View className="flex-1">
                    {/* Add Note Input */}
                    <View className="bg-surface p-4 rounded-2xl mb-4 border border-surfaceHighlight">
                        <TextInput
                            value={newNote}
                            onChangeText={setNewNote}
                            onSubmitEditing={handleSaveNote}
                            placeholder="Add a context note..."
                            placeholderTextColor="#52525B"
                            className="text-white font-medium text-lg min-h-[40px]"
                            multiline
                            blurOnSubmit={true}
                        />
                        {newNote.length > 0 && (
                            <Pressable onPress={handleSaveNote} className="self-end mt-2 bg-primary px-4 py-2 rounded-full">
                                <Text className="text-black font-bold text-xs">ADD NOTE</Text>
                            </Pressable>
                        )}
                    </View>

                    <FlatList
                        data={notes}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Pressable
                                onLongPress={() => {
                                    Alert.alert("Delete Note", "Remove this note?", [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Delete", style: "destructive", onPress: () => handleDeleteNote(item.id) }
                                    ]);
                                }}
                                className="bg-surface p-4 rounded-xl mb-3 border border-surfaceHighlight"
                            >
                                <Text className="text-white text-base">{item.content}</Text>
                                <Text className="text-secondary text-xs mt-2 opacity-50">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                            </Pressable>
                        )}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10 opacity-30">
                                <Ionicons name="document-text-outline" size={48} color="white" />
                                <Text className="text-white mt-4 font-bold text-center">No notes linked.</Text>
                                <Text className="text-white text-xs mt-1 text-center">Add context to your habit journey.</Text>
                            </View>
                        }
                    />
                </View>
            )}

            {/* Edit Modal (Preserved as is) */}
            <Modal visible={isEditing} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="bg-surface p-6 rounded-t-3xl border-t border-surfaceHighlight">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Edit Protocol</Text>
                            <Pressable onPress={() => setIsEditing(false)}>
                                <Ionicons name="close-circle" size={30} color="gray" />
                            </Pressable>
                        </View>

                        <Text className="text-secondary mb-2">Name</Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            className="bg-background text-white p-4 rounded-xl mb-4 border border-white/10"
                            placeholderTextColor="#666"
                        />

                        <Text className="text-secondary mb-2">Description</Text>
                        <TextInput
                            value={editDesc}
                            onChangeText={setEditDesc}
                            className="bg-background text-white p-4 rounded-xl mb-4 border border-white/10"
                            placeholderTextColor="#666"
                        />


                        <Text className="text-secondary mb-2">Reminder Time</Text>
                        <View className="flex-row gap-2 mb-4">
                            <Pressable
                                onPress={() => setShowTimePicker(true)}
                                className="flex-1 bg-background p-4 rounded-xl border border-white/10 flex-row justify-between items-center"
                            >
                                <Text className="text-white">
                                    {editReminder ? editReminder.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Reminder'}
                                </Text>
                                <Ionicons name="time-outline" size={20} color="#CCFF00" />
                            </Pressable>
                            {editReminder && (
                                <Pressable
                                    onPress={() => setEditReminder(null)}
                                    className="w-14 bg-red-900/20 rounded-xl items-center justify-center border border-red-500/20"
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </Pressable>
                            )}
                        </View>

                        {showTimePicker && (
                            <DateTimePicker
                                value={editReminder || new Date()}
                                mode="time"
                                display="spinner"
                                onChange={(event, date) => {
                                    setShowTimePicker(false);
                                    if (date) setEditReminder(date);
                                }}
                            />
                        )}

                        <Text className="text-secondary mb-2">Frequency</Text>
                        <View className="bg-background p-4 rounded-xl border border-white/10 mb-6">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-white">Every Day</Text>
                                <Switch
                                    value={editFrequency === 'daily'}
                                    onValueChange={(val) => {
                                        setEditFrequency(val ? 'daily' : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
                                        Haptics.selectionAsync();
                                    }}
                                    trackColor={{ false: '#3F3F46', true: '#CCFF00' }}
                                    thumbColor={'#18181B'}
                                />
                            </View>

                            {editFrequency !== 'daily' && (
                                <View className="flex-row justify-between">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                                        const isSelected = (editFrequency as string[]).includes(day);
                                        return (
                                            <Pressable
                                                key={day}
                                                onPress={() => {
                                                    const current = [...(editFrequency as string[])];
                                                    if (isSelected) {
                                                        const filtered = current.filter(d => d !== day);
                                                        setEditFrequency(filtered.length ? filtered : 'daily'); // Fallback to daily if empty? Or keep logic
                                                    } else {
                                                        setEditFrequency([...current, day]);
                                                    }
                                                    Haptics.selectionAsync();
                                                }}
                                                className={`w-8 h-8 rounded-full items-center justify-center ${isSelected ? 'bg-primary' : 'bg-surfaceHighlight'}`}
                                            >
                                                <Text className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-secondary'}`}>{day.charAt(0)}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        <Pressable
                            onPress={handleSave}
                            className="bg-primary p-4 rounded-xl items-center shadow-lg shadow-primary/20 mb-4"
                        >
                            <Text className="text-black font-bold text-lg">Save Changes</Text>
                        </Pressable>

                        {/* Archive Option */}
                        <Pressable
                            onPress={handleArchive}
                            className="p-4 rounded-xl items-center flex-row justify-center gap-2 opacity-80"
                        >
                            <Ionicons name="archive-outline" size={20} color="#EF4444" />
                            <Text className="text-red-500 font-bold">Archive Protocol</Text>
                        </Pressable>

                        {/* Reset Option */}
                        <Pressable
                            onPress={handleReset}
                            className="p-4 rounded-xl items-center flex-row justify-center gap-2 opacity-80 mt-2"
                        >
                            <Ionicons name="refresh-circle-outline" size={20} color="#F59E0B" />
                            <Text className="text-amber-500 font-bold">Reset Progress</Text>
                        </Pressable>

                        <View className="h-10" />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
