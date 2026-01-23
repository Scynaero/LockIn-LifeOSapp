import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { SecurityService } from '../services/SecurityService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
    onUnlock: () => void;
    isSettingUp?: boolean;
}

export const LockScreen = ({ onUnlock, isSettingUp = false }: Props) => {
    const [pin, setPin] = useState('');
    const [message, setMessage] = useState(isSettingUp ? 'Create a 4-digit PIN' : 'Enter PIN to Unlock');
    const [biometricsAvailable, setBiometricsAvailable] = useState(false);

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const hasHardware = await SecurityService.hasHardware();
        const isEnrolled = await SecurityService.isEnrolled();
        const enabled = await SecurityService.isBiometricEnabled();

        // Auto-trigger face id if not setting up
        if (hasHardware && isEnrolled && enabled && !isSettingUp) {
            setBiometricsAvailable(true);
            authenticateBiometric();
        }
    };

    const authenticateBiometric = async () => {
        const success = await SecurityService.authenticate();
        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onUnlock();
        }
    };

    const handlePress = async (val: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (val === 'bio') {
            authenticateBiometric();
            return;
        }
        if (val === 'del') {
            setPin(prev => prev.slice(0, -1));
            return;
        }

        const newPin = pin + val;
        setPin(newPin);

        if (newPin.length === 4) {
            if (isSettingUp) {
                // In real app, ask to confirm. For simplicity now:
                await SecurityService.setPin(newPin);
                // Also enable biometrics by default if available
                await SecurityService.enableBiometrics(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onUnlock();
            } else {
                const isValid = await SecurityService.verifyPin(newPin);
                if (isValid) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onUnlock();
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setPin('');
                    setMessage('Incorrect PIN. Try again.');
                }
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black justify-center items-center">
            <View className="items-center mb-10">
                <Ionicons name="lock-closed" size={48} color="#A1A1AA" />
                <Text className="text-white text-xl font-bold mt-4">{message}</Text>

                {/* PIN Dots */}
                <View className="flex-row gap-4 mt-8">
                    {[0, 1, 2, 3].map(i => (
                        <View
                            key={i}
                            className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-primary' : 'bg-zinc-800'}`}
                        />
                    ))}
                </View>
            </View>

            {/* Numpad */}
            <View className="w-full max-w-xs gap-y-6">
                {[
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    [biometricsAvailable && !isSettingUp ? 'bio' : '', '0', 'del']
                ].map((row, rIdx) => (
                    <View key={rIdx} className="flex-row justify-between px-4">
                        {row.map((btn, bIdx) => (
                            <TouchableOpacity
                                key={bIdx}
                                onPress={() => btn && handlePress(btn)}
                                className="w-20 h-20 items-center justify-center rounded-full bg-zinc-900 active:bg-zinc-800"
                                disabled={!btn}
                            >
                                {btn === 'del' ? (
                                    <Ionicons name="backspace" size={24} color="white" />
                                ) : btn === 'bio' ? (
                                    <Ionicons name="scan" size={24} color="#CCFF00" />
                                ) : (
                                    <Text className="text-white text-3xl font-medium">{btn}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
};
