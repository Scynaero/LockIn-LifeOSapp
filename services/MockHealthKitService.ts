import { Platform } from 'react-native';
import { DateUtils } from '../utils/DateUtils';

/**
 * Mock HealthKit Service for Simulator Testing
 * Generates realistic random health data for development
 */
export const MockHealthKitService = {
    isAvailable: true,

    init: async (): Promise<boolean> => {
        console.log('[MockHealthKit] Initialized (Simulator Mode)');
        return true;
    },

    /**
     * Generate realistic step count (5,000 - 15,000 steps)
     * Varies by time of day
     */
    getSteps: async (date: string): Promise<number> => {
        const now = new Date();
        const targetDate = new Date(date);
        const isToday = DateUtils.getDateString(now) === DateUtils.getDateString(targetDate);

        if (isToday) {
            // Simulate steps accumulating throughout the day
            const hour = now.getHours();
            const baseSteps = Math.floor(hour * 600); // ~600 steps per hour
            const variance = Math.floor(Math.random() * 2000);
            return Math.min(baseSteps + variance, 15000);
        }

        // Past days: random between 7k-14k
        return Math.floor(7000 + Math.random() * 7000);
    },

    /**
     * Generate sleep duration in minutes (5-9 hours)
     */
    getSleepMinutes: async (date: string): Promise<number> => {
        // Sleep: 5-9 hours (300-540 minutes)
        const hours = 5 + Math.random() * 4;
        return Math.floor(hours * 60);
    },

    /**
     * Generate water intake in liters (1-4 liters)
     */
    getWater: async (date: string): Promise<number> => {
        const now = new Date();
        const targetDate = new Date(date);
        const isToday = DateUtils.getDateString(now) === DateUtils.getDateString(targetDate);

        if (isToday) {
            // Water accumulates during the day
            const hour = now.getHours();
            const baseWater = (hour / 24) * 3; // Up to 3L by end of day
            const variance = Math.random() * 0.5;
            return Math.min(baseWater + variance, 4);
        }

        // Past days: 1.5-3.5 liters
        return 1.5 + Math.random() * 2;
    },

    /**
     * Generate active calories (200-800 kcal)
     */
    getActiveCalories: async (date: string): Promise<number> => {
        const now = new Date();
        const targetDate = new Date(date);
        const isToday = DateUtils.getDateString(now) === DateUtils.getDateString(targetDate);

        if (isToday) {
            const hour = now.getHours();
            const baseCalories = Math.floor(hour * 30); // ~30 cal per hour
            const variance = Math.floor(Math.random() * 100);
            return Math.min(baseCalories + variance, 800);
        }

        // Past days: 300-700 kcal
        return Math.floor(300 + Math.random() * 400);
    },

    /**
     * Generate workout minutes (0-90 minutes)
     */
    getWorkoutMinutes: async (date: string): Promise<number> => {
        // 60% chance of workout
        if (Math.random() > 0.6) return 0;

        // 20-90 minutes
        return Math.floor(20 + Math.random() * 70);
    },

    /**
     * Generate heart rate (60-100 bpm resting)
     */
    getHeartRate: async (date: string): Promise<number> => {
        return Math.floor(60 + Math.random() * 40);
    },

    /**
     * Generate distance walked/run in km (3-12 km)
     */
    getDistance: async (date: string): Promise<number> => {
        const steps = await MockHealthKitService.getSteps(date);
        // Rough conversion: 1000 steps ≈ 0.8 km
        return (steps / 1000) * 0.8;
    },

    /**
     * Generate flights climbed (0-20)
     */
    getFlightsClimbed: async (date: string): Promise<number> => {
        return Math.floor(Math.random() * 20);
    },

    /**
     * Generate stand hours (8-12 hours)
     */
    getStandHours: async (date: string): Promise<number> => {
        return Math.floor(8 + Math.random() * 4);
    }
};

// Export the appropriate service based on environment
// In production on iOS, use real HealthKit
// In development or simulator, use mock data
export const getHealthKitService = () => {
    const isDevelopment = __DEV__;
    const isSimulator = Platform.OS === 'ios' && !Platform.isPad; // Simplified check

    // Use mock service in development or if explicitly testing
    if (isDevelopment || isSimulator) {
        console.log('[HealthKit] Using Mock Service (Development/Simulator)');
        return MockHealthKitService;
    }

    // In production, import and return real HealthKitService
    console.log('[HealthKit] Using Real Service (Production)');
    const { HealthKitService } = require('./HealthKitService');
    return HealthKitService;
};
