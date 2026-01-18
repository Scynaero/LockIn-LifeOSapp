import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { DatabaseService } from '../services/DatabaseService';
import { HabitService } from '../services/HabitService';
import '../global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Layout() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                await DatabaseService.init();
                await HabitService.migrateColors(); // Ensure schema is up to date
            } catch (e) {
                console.error('Startup error', e);
            } finally {
                setIsReady(true); // Render app once DB is safe
            }
        }
        prepare();
    }, []);

    if (!isReady) return null; // Or a splash screen component

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#000000' }
                }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="create" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="add-transaction" options={{ presentation: 'modal' }} />
                </Stack>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
