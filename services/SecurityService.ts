import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PIN_KEY = 'user_pin';
const IS_BIOMETRIC_ENABLED_KEY = 'user_biometric_enabled';

export const SecurityService = {
    hasHardware: async () => {
        return await LocalAuthentication.hasHardwareAsync();
    },

    isEnrolled: async () => {
        return await LocalAuthentication.isEnrolledAsync();
    },

    supportedTypes: async () => {
        return await LocalAuthentication.supportedAuthenticationTypesAsync();
    },

    authenticate: async (reason: string = 'Unlock App') => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: reason,
                fallbackLabel: 'Use PIN',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });
            return result.success;
        } catch (e) {
            console.error('Authentication failed', e);
            return false;
        }
    },

    setPin: async (pin: string) => {
        await SecureStore.setItemAsync(PIN_KEY, pin);
    },

    verifyPin: async (inputPin: string) => {
        const storedPin = await SecureStore.getItemAsync(PIN_KEY);
        return storedPin === inputPin;
    },

    hasPin: async () => {
        const storedPin = await SecureStore.getItemAsync(PIN_KEY);
        return !!storedPin;
    },

    enableBiometrics: async (enabled: boolean) => {
        await SecureStore.setItemAsync(IS_BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
    },

    isBiometricEnabled: async () => {
        const val = await SecureStore.getItemAsync(IS_BIOMETRIC_ENABLED_KEY);
        return val === 'true';
    }
};
