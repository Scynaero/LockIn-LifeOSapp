import { View, Text, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-black p-6">
            <Text className="text-3xl font-bold text-primary mb-6 tracking-tighter">SETTINGS</Text>

            <View className="bg-surface p-4 rounded-2xl border border-surfaceHighlight mb-4">
                <Text className="text-secondary text-sm mb-2">General</Text>
                <View className="flex-row justify-between items-center py-2">
                    <Text className="text-white font-bold">Sound Effects</Text>
                    <Switch value={true} trackColor={{ false: "#3F3F46", true: "#CCFF00" }} />
                </View>
            </View>

            <View className="flex-1 items-center justify-center">
                <Text className="text-zinc-600 italic">More settings coming soon...</Text>
            </View>
        </SafeAreaView>
    );
}
