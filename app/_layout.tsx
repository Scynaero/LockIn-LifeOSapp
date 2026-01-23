import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { DatabaseService } from '../services/DatabaseService';
import { HabitService } from '../services/HabitService';
import { SecurityService } from '../services/SecurityService';
import { LockScreen } from '../components/LockScreen';
import '../global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Layout() {
    const [isReady, setIsReady] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [hasPin, setHasPin] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                await DatabaseService.init();
                await DatabaseService.initGamification();
                await HabitService.migrateColors();

                // key check
                const pinExists = await SecurityService.hasPin();
                setHasPin(pinExists);
            } catch (e) {
                console.error('Startup error', e);
            } finally {
                setIsReady(true);
            }
        }
        prepare();
    }, []);

    if (!isReady) return null;

    if (isLocked) {
        return (
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style="light" />
                <LockScreen
                    isSettingUp={!hasPin}
                    onUnlock={() => setIsLocked(false)}
                />
            </GestureHandlerRootView>
        );
    }

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
