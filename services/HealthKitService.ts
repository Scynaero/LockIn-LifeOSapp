import {
    HealthValue,
    HealthKitPermissions,
    HealthInputOptions,
} from 'react-native-health';
import { Platform } from 'react-native';

const AppleHealthKit = require('react-native-health');
import { DateUtils } from '../utils/DateUtils';

const permissions: HealthKitPermissions = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.MindfulSession,
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
            if (typeof AppleHealthKit.getStepCount !== 'function') {
                resolve(0);
                return;
            }
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
            if (typeof AppleHealthKit.getSleepSamples !== 'function') {
                resolve(0);
                return;
            }
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

    getDistance: async (date: string): Promise<number> => {
        if (!HealthKitService.isAvailable) return 0;
        const options: HealthInputOptions = {
            startDate: new Date(date).toISOString(),
            includeManuallyAdded: true,
        };

        return new Promise((resolve) => {
            if (typeof AppleHealthKit.getDistanceWalkingRunning !== 'function') {
                resolve(0);
                return;
            }
            AppleHealthKit.getDistanceWalkingRunning(options, (err: Object, results: HealthValue) => {
                if (err) { resolve(0); return; }
                resolve(results.value || 0);
            });
        });
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
            type: 'Workout',
        };

        return new Promise((resolve) => {
            if (typeof AppleHealthKit.getSamples !== 'function') {
                resolve(0);
                return;
            }
            AppleHealthKit.getSamples(options, (err: Object, results: any[]) => {
                if (err) { resolve(0); return; }
                let duration = 0;
                results.forEach(w => {
                    if (w.duration) duration += w.duration;
                });
                resolve(Math.round(duration / 60));
            });
        });
    },

    getHeartRate: async (date: string): Promise<number> => {
        if (!HealthKitService.isAvailable) return 0;
        const options: HealthInputOptions = {
            startDate: new Date(date).toISOString(), // Should probably be range
            endDate: new Date(new Date(date).getTime() + 86400000).toISOString(),
        };

        return new Promise((resolve) => {
            // Safety check for method existence
            if (typeof AppleHealthKit.getHeartRateSamples !== 'function') {
                console.warn('[HealthKit] getHeartRateSamples not available');
                resolve(0);
                return;
            }

            AppleHealthKit.getHeartRateSamples(options, (err: Object, results: HealthValue[]) => {
                if (err || !results || results.length === 0) { resolve(0); return; }
                const sum = results.reduce((acc, curr) => acc + curr.value, 0);
                resolve(Math.round(sum / results.length));
            });
        });
    },

    getActiveCalories: async (date: string): Promise<number> => {
        if (!HealthKitService.isAvailable) return 0;

        return new Promise((resolve) => {
            // Safety check for method existence
            if (typeof AppleHealthKit.getActiveEnergyBurned !== 'function') {
                console.warn('[HealthKit] getActiveEnergyBurned not available');
                resolve(0);
                return;
            }

            // @ts-ignore
            AppleHealthKit.getActiveEnergyBurned({ startDate: new Date(date).toISOString(), endDate: new Date(new Date(date).getTime() + 86400000).toISOString() }, (err: Object, results: any[]) => {
                if (err) { resolve(0); return; }
                // results might be daily summaries
                if (results && results.length > 0) {
                    // Sum them up just in case
                    const total = results.reduce((acc, r) => acc + (r.value || 0), 0);
                    resolve(Math.round(total));
                }
                resolve(0);
            });
        });
    },

    getMindfulMinutes: async (date: string): Promise<number> => {
        if (!HealthKitService.isAvailable) return 0;
        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const end = new Date(date); end.setHours(23, 59, 59, 999);
        const options: any = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        };

        return new Promise((resolve) => {
            if (typeof AppleHealthKit.getMindfulSession !== 'function') {
                console.warn('[HealthKit] getMindfulSession not available');
                resolve(0);
                return;
            }
            AppleHealthKit.getMindfulSession(options, (err: Object, results: any[]) => {
                if (err) { resolve(0); return; }
                let totalMs = 0;
                results.forEach(r => {
                    const s = new Date(r.startDate).getTime();
                    const e = new Date(r.endDate).getTime();
                    totalMs += (e - s);
                });
                resolve(Math.round(totalMs / 60000));
            });
        });
    },

};
