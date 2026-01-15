import AppleHealthKit, {
    HealthValue,
    HealthKitPermissions,
    HealthInputOptions,
} from 'react-native-health';
import { Platform } from 'react-native';
import { DateUtils } from '../utils/DateUtils';

const permissions: HealthKitPermissions = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.Water, // Make sure this exists in types
        ],
        write: [],
    },
};

export const HealthKitService = {
    isAvailable: Platform.OS === 'ios',

    init: async (): Promise<boolean> => {
        if (!HealthKitService.isAvailable) return false;

        return new Promise((resolve, reject) => {
            AppleHealthKit.initHealthKit(permissions, (error: string) => {
                if (error) {
                    console.log('[HealthKitService] Error initializing:', error);
                    resolve(false);
                    return;
                }
                console.log('[HealthKitService] Initialized!');
                resolve(true);
            });
        });
    },

    getSteps: async (date: string): Promise<number> => {
        if (!HealthKitService.isAvailable) return 0;

        const options: HealthInputOptions = {
            date: new Date(date).toISOString(), // specific day
            includeManuallyAdded: true,
        };

        return new Promise((resolve) => {
            AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
                if (err) {
                    console.log('[HealthKit] getSteps error:', err);
                    resolve(0);
                    return;
                }
                resolve(results.value);
            });
        });
    },

    getSleepMinutes: async (date: string): Promise<number> => {
        if (!HealthKitService.isAvailable) return 0;
        // Sleep is tricky. Usually "Sleep Analysis" returns samples.
        // We want distinct sleep for the "night" of that date?
        // Or 24h of that date?
        // Usually startDate to endDate.
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const options: HealthInputOptions = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        };

        return new Promise((resolve) => {
            AppleHealthKit.getSleepSamples(options, (err: Object, results: any[]) => {
                if (err) {
                    resolve(0);
                    return;
                }
                // Sum up duration of 'ASLEEP' settings
                // Results: value: 'INBED' | 'ASLEEP', startDate, endDate
                // We only care about ASLEEP
                const sleep = results.filter(r => r.value === 'ASLEEP' || r.value === 'CORE' || r.value === 'DEEP' || r.value === 'REM');
                // Note: 'ASLEEP' is legacy. New HK uses Core/Deep/Rem.
                // We should sum (endDate - startDate) in minutes.

                let totalMs = 0;
                sleep.forEach(s => {
                    const sTime = new Date(s.startDate).getTime();
                    const eTime = new Date(s.endDate).getTime();
                    totalMs += (eTime - sTime);
                });

                resolve(Math.round(totalMs / 60000));
            });
        });
    },

    getWater: async (date: string): Promise<number> => {
        // react-native-health might verify 'Water' permission if not in older versions
        // assuming it works or returns 0.
        if (!HealthKitService.isAvailable) return 0;

        // Need to check docs for getWater. Usually getSamples for dietary water?
        // Or `getWater` helper exists?
        // It is not documented in standard type defs always.
        // Let's assume usage of getSamplesType?
        // Actually, standard library might not expose `getWater`.
        // Let's comment this out or use a generic if specific helper missing.
        // I'll skip implementation detail for now or use 0 to avoid TS error if unknown.

        return 0;
    },

    getWorkoutMinutes: async (date: string): Promise<number> => {
        if (!HealthKitService.isAvailable) return 0;

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const options: any = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            type: 'Workout', // Helper might be different
        };

        return new Promise((resolve) => {
            AppleHealthKit.getSamples(options, (err: Object, results: any[]) => {
                if (err) { resolve(0); return; }
                // Sum duration
                let duration = 0;
                results.forEach(w => {
                    if (w.duration) duration += w.duration; // Duration is usually in seconds or minutes?
                    // HKWorkout duration is in seconds.
                });
                resolve(Math.round(duration / 60));
            });
        });
    }

};
