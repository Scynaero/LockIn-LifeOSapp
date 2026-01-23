import React, { memo } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../services/NotesService';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface NoteItemProps {
    item: Note;
    onPress: (id: string) => void;
    onDelete: (id: string) => void;
}

const NoteItem = memo(({ item, onPress, onDelete }: NoteItemProps) => {
    const renderRightActions = () => (
        <Pressable
            onPress={() => onDelete(item.id)}
            className="bg-green-500 justify-center items-end px-6 h-full"
            style={{ width: SCREEN_WIDTH }}
        >
            <Ionicons name="checkmark-circle-outline" size={32} color="white" />
        </Pressable>
    );

    const renderLeftActions = () => (
        <Pressable
            onPress={() => onDelete(item.id)}
            className="bg-red-500 justify-center items-start px-6 h-full"
            style={{ width: SCREEN_WIDTH }}
        >
            <Ionicons name="trash-outline" size={24} color="white" />
        </Pressable>
    );

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            renderLeftActions={renderLeftActions}
            onSwipeableLeftOpen={() => onDelete(item.id)}
            onSwipeableRightOpen={() => onDelete(item.id)}
            overshootRight={false}
            overshootLeft={false}
        >
            <Pressable
                onPress={() => onPress(item.id)}
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
                    <Text className={`${item.reminder_time ? (item.color ? 'text-black font-bold' : 'text-green-500') : (item.color ? 'text-gray-800' : 'text-red-400')} text-xs font-medium`}>
                        {item.reminder_time
                            ? new Date(item.reminder_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        }
                    </Text>

                    {item.audio_uri && (
                        <Ionicons name="mic" size={12} color={item.color ? "black" : "#71717A"} />
                    )}

                    {item.location_text && (
                        <Ionicons name="location" size={12} color={item.color ? "black" : "#71717A"} />
                    )}

                    <Text className={`${item.color ? 'text-black' : 'text-secondary'} text-xs flex-1`} numberOfLines={1}>
                        {item.content.split('\n').slice(1).join(' ') || 'No additional text'}
                    </Text>
                </View>
            </Pressable>
        </Swipeable>
    );
}, (prev, next) => {
    // Custom comparison to ensure strict equality updates
    return prev.item.id === next.item.id &&
        prev.item.content === next.item.content &&
        prev.item.is_pinned === next.item.is_pinned &&
        prev.item.reminder_time === next.item.reminder_time &&
        prev.item.color === next.item.color &&
        prev.item.is_deleted === next.item.is_deleted;
});

export default NoteItem;
