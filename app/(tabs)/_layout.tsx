import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Brain } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#000000',
                    borderTopColor: '#3F3F46',
                    height: 88,
                },
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#71717A',
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-surfaceHighlight' : ''}`}>
                            <Ionicons name={focused ? "grid" : "grid-outline"} size={26} color={color} />
                        </View>
                    ),
                    tabBarLabel: "Dashboard"
                }}
            />

            <Tabs.Screen
                name="body"
                options={{
                    title: 'Body',
                    tabBarIcon: ({ color }) => <Ionicons name="fitness" size={24} color={color} />,
                }}
            />

            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
                }}
            />

            <Tabs.Screen
                name="wallet"
                options={{
                    title: 'Wallet',
                    tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" size={24} color={color} />,
                }}
            />

            <Tabs.Screen
                name="mind"
                options={{
                    title: 'Mind',
                    tabBarIcon: ({ color }) => <Ionicons name="documents" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
