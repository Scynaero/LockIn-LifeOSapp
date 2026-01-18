import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { NotesService, Note } from '../../services/NotesService';
import { NotificationService } from '../../services/NotificationService';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

const COLORS = [
    { name: 'Default', value: null }, // Default/None
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Green', value: '#10B981' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
];

export default function NoteDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [note, setNote] = useState<Note | null>(null);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [reminderDate, setReminderDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Voice Notes
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState<number | null>(null);

    // Location
    const [locationLoading, setLocationLoading] = useState(false);

    // Theme (Color)
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Temp date for iOS Modal to allow confirming
    const [tempDate, setTempDate] = useState<Date | null>(null);

    // Split content into Title (Line 1) and Body (Rest)
    useEffect(() => {
        if (content) {
            const lines = content.split('\n');
            setTitle(lines[0]);
            setBody(lines.slice(1).join('\n'));
        } else {
            setTitle('');
            setBody('');
        }
    }, [content]);

    useEffect(() => {
        loadNote();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [id]);

    const loadNote = async () => {
        if (typeof id !== 'string') return;
        const allNotes = await NotesService.getNotes();
        const found = allNotes.find(n => n.id === id);
        if (found) {
            setNote(found);
            setContent(found.content);
            if (found.reminder_time) {
                setReminderDate(new Date(found.reminder_time));
            }
            if (found.audio_duration) {
                setAudioDuration(found.audio_duration);
            }
        }
    };

    const handleSave = async (newTitle: string, newBody: string) => {
        if (!note) return;
        const fullContent = `${newTitle}\n${newBody}`;
        setContent(fullContent); // Optimistic update
        await NotesService.updateNote(note.id, fullContent);
    };

    const handleDelete = async () => {
        if (!note) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await NotesService.deleteNote(note.id);
        router.back();
    };

    const handleTogglePin = async () => {
        if (!note) return;
        Haptics.selectionAsync();
        await NotesService.togglePin(note.id, note.is_pinned);
        loadNote();
    };

    const saveReminder = async (date: Date) => {
        setReminderDate(date);
        if (note) {
            await NotesService.setReminder(note.id, date.toISOString());
            await NotificationService.scheduleNoteReminder(note.id, title || 'Note Reminder', date);
        }
    };

    // --- Audio Logic ---
    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
                const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
                setRecording(recording);
                Haptics.selectionAsync();
            } else {
                Alert.alert("Permission required", "Please grant microphone access to record voice notes.");
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setRecording(null);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        const status = await recording.getStatusAsync();
        // @ts-ignore
        const durationFn = status.durationMillis;

        if (uri && note) {
            await NotesService.updateNoteAudio(note.id, uri, durationFn);
            setAudioDuration(durationFn);
            loadNote(); // Refresh to ensure state sync
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const playSound = async () => {
        if (!note?.audio_uri) return;

        if (sound) {
            // Already loaded, just play/pause
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        } else {
            // Load new sound
            try {
                const { sound: newSound } = await Audio.Sound.createAsync({ uri: note.audio_uri });
                setSound(newSound);
                setIsPlaying(true);
                await newSound.playAsync();
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                        newSound.setPositionAsync(0);
                    }
                });
            } catch (e) {
                console.log("Error playing sound", e);
                Alert.alert("Error", "Could not play audio file.");
            }
        }
    };

    // --- Location Logic ---
    const fetchLocation = async () => {
        if (!note) return;
        setLocationLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission denied", "Allow location access to tag your notes.");
                setLocationLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                const locationString = `${address.city || ''}, ${address.region || ''}`.replace(/^, /, '') || "Unknown Location";

                await NotesService.updateNoteLocation(note.id, locationString);
                loadNote();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.log("Location error", error);
            Alert.alert("Error", "Failed to fetch location.");
        } finally {
            setLocationLoading(false);
        }
    };

    // --- Color Logic ---
    const updateColor = async (color: string | null) => {
        if (!note) return;
        await NotesService.updateNoteColor(note.id, color || '');
        loadNote();
        setShowColorPicker(false);
        Haptics.selectionAsync();
    };

    // --- Date Picker Helpers ---
    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
                saveReminder(selectedDate);
            }
        } else {
            // iOS: Update temp state, don't close yet
            if (selectedDate) setTempDate(selectedDate);
        }
    };

    const openDatePicker = () => {
        setTempDate(reminderDate || new Date());
        setShowDatePicker(true);
    };

    const confirmIOSDate = () => {
        if (tempDate) saveReminder(tempDate);
        setShowDatePicker(false);
    };

    if (!note) return <View className="flex-1 bg-black" />;

    const noteColor = note.color || null;

    return (
        <SafeAreaView className="flex-1 bg-black" style={noteColor ? { backgroundColor: noteColor } : {}}>
            {/* Header */}
            <View className={`px-4 py-2 flex-row justify-between items-center z-10 ${noteColor ? '' : 'border-b border-surfaceHighlight'}`}>
                <Pressable onPress={() => router.back()} className="flex-row items-center gap-1">
                    <Ionicons name="chevron-back" size={24} color={noteColor ? "black" : "#71717A"} />
                    <Text className={`${noteColor ? 'text-black' : 'text-secondary'} font-medium`}>Lists</Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView className="flex-1 px-6 pt-4">
                    {/* Title Input */}
                    <TextInput
                        className={`text-4xl font-bold mb-4 ${noteColor ? 'text-black' : 'text-white'}`}
                        value={title}
                        onChangeText={(t) => {
                            setTitle(t);
                            handleSave(t, body);
                        }}
                        placeholder="Title"
                        placeholderTextColor={noteColor ? "#333" : "#52525B"}
                        multiline
                        scrollEnabled={false}
                    />

                    {/* Metadata Rows */}
                    <View className="gap-3 mb-6">
                        {/* Time/Reminder Row */}
                        <Pressable
                            className="flex-row items-center gap-3"
                            onPress={openDatePicker}
                        >
                            <Ionicons name={reminderDate ? "alarm" : "time-outline"} size={18} color={reminderDate ? (noteColor ? "black" : "#10B981") : (noteColor ? "#444" : "#71717A")} />
                            <Text className={`text-base ${reminderDate ? (noteColor ? 'text-black font-bold' : 'text-primary') : (noteColor ? 'text-gray-800' : 'text-secondary')}`}>
                                {reminderDate
                                    ? reminderDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : new Date(note.created_at).toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
                                }
                            </Text>
                        </Pressable>

                        {/* Location Row */}
                        {(note.location_text || locationLoading) && (
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="location" size={18} color={noteColor ? "black" : "#71717A"} />
                                {locationLoading ? (
                                    <ActivityIndicator size="small" color={noteColor ? "black" : "white"} />
                                ) : (
                                    <Text className={`text-base ${noteColor ? 'text-black' : 'text-secondary'}`}>
                                        {note.location_text}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Audio Row */}
                        {(recording || note.audio_uri) && (
                            <View className={`mt-2 p-3 rounded-xl flex-row items-center gap-3 ${noteColor ? 'bg-black/10' : 'bg-surface'}`}>
                                <Pressable onPress={startRecording} disabled={!!note.audio_uri} className={recording ? "opacity-50" : ""}>
                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${recording ? 'bg-red-500' : (noteColor ? 'bg-black' : 'bg-surfaceHighlight')}`}>
                                        <Ionicons name={recording ? "stop" : "mic"} size={16} color="white" />
                                    </View>
                                </Pressable>

                                {recording ? (
                                    <View className="flex-1">
                                        <Text className={`${noteColor ? 'text-black' : 'text-white'} font-medium`}>Recording...</Text>
                                        <Pressable onPress={stopRecording}>
                                            <Text className="text-red-500 font-bold mt-1">TAP TO STOP</Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    <View className="flex-1 flex-row items-center gap-2">
                                        <Pressable onPress={playSound}>
                                            <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={noteColor ? "black" : "white"} />
                                        </Pressable>
                                        <View className="h-1 flex-1 bg-gray-500/30 rounded-full overflow-hidden">
                                            <View className={`h-full ${noteColor ? 'bg-black' : 'bg-white'}`} style={{ width: '0%' }} />
                                            {/* Logic for progress bar would go here if using playback status callback state */}
                                        </View>
                                        <Text className={`text-xs ${noteColor ? 'text-black' : 'text-secondary'}`}>
                                            {audioDuration ? `${Math.round(audioDuration / 1000)}s` : 'Audio'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Date Picker Modal */}
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

                        {/* Color Picker Modal */}
                        <Modal
                            transparent={true}
                            visible={showColorPicker}
                            animationType="fade"
                            onRequestClose={() => setShowColorPicker(false)}
                        >
                            <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setShowColorPicker(false)}>
                                <View className="bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-800">
                                    <Text className="text-white font-bold text-lg mb-4 text-center">Note Color</Text>
                                    <View className="flex-row flex-wrap justify-center gap-4">
                                        {COLORS.map((c) => (
                                            <Pressable
                                                key={c.name}
                                                onPress={() => updateColor(c.value)}
                                                className={`w-12 h-12 rounded-full border-2 ${note?.color === c.value ? 'border-white' : 'border-transparent'}`}
                                                style={{ backgroundColor: c.value || '#333' }}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </Pressable>
                        </Modal>

                        <View className="flex-row items-start gap-3">
                            <Ionicons name="document-text-outline" size={18} color={noteColor ? "black" : "#71717A"} style={{ marginTop: 2 }} />
                            <TextInput
                                className={`text-base flex-1 -mt-1 ${noteColor ? 'text-black' : 'text-secondary'}`}
                                value={body}
                                onChangeText={(t) => {
                                    setBody(t);
                                    handleSave(title, t);
                                }}
                                placeholder="Add details..."
                                placeholderTextColor={noteColor ? "#444" : "#52525B"}
                                multiline
                                scrollEnabled={false}
                            />
                        </View>
                    </View>

                    {/* Subtask Placeholder */}
                    <Pressable
                        onPress={() => {
                            Haptics.selectionAsync();
                            const newBody = body ? `${body}\n- [ ] ` : `- [ ] `;
                            setBody(newBody);
                            handleSave(title, newBody);
                        }}
                        className="flex-row items-center gap-3 mt-2 opacity-50"
                    >
                        <View className={`w-5 h-5 rounded-full border ${noteColor ? 'border-black' : 'border-secondary'}`} />
                        <Text className={`text-lg ${noteColor ? 'text-black' : 'text-secondary'}`}>Add subtask</Text>
                    </Pressable>

                    <View className="h-40" />
                </ScrollView>

                {/* Custom Toolbar */}
                <View className={`border-t px-4 py-3 flex-row justify-between items-center ${noteColor ? 'bg-black/10 border-black/10' : 'bg-surface border-surfaceHighlight'}`}>
                    <Pressable className="p-2" onPress={note.audio_uri ? () => Alert.alert("Audio", "Audio already attached") : startRecording}>
                        <Ionicons name={recording ? "stop" : "mic-outline"} size={24} color={noteColor ? "black" : (recording ? "#EF4444" : "#71717A")} />
                    </Pressable>
                    <View className={`w-[1px] h-6 ${noteColor ? 'bg-black/10' : 'bg-surfaceHighlight'}`} />
                    <Pressable className="p-2" onPress={handleTogglePin}>
                        <Ionicons name={note.is_pinned ? "star" : "star-outline"} size={24} color={note.is_pinned ? "#EAB308" : (noteColor ? "black" : "#71717A")} />
                    </Pressable>
                    <View className={`w-[1px] h-6 ${noteColor ? 'bg-black/10' : 'bg-surfaceHighlight'}`} />
                    <Pressable className="p-2" onPress={() => setShowColorPicker(true)}>
                        <Ionicons name="color-palette-outline" size={24} color={noteColor ? "black" : "#71717A"} />
                    </Pressable>
                    <View className={`w-[1px] h-6 ${noteColor ? 'bg-black/10' : 'bg-surfaceHighlight'}`} />
                    <Pressable className="p-2" onPress={fetchLocation}>
                        <Ionicons name="location-outline" size={24} color={noteColor ? "black" : "#71717A"} />
                    </Pressable>
                    <View className={`w-[1px] h-6 ${noteColor ? 'bg-black/10' : 'bg-surfaceHighlight'}`} />
                    <Pressable className="p-2" onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={24} color={noteColor ? "black" : "#EF4444"} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
