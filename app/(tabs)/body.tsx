import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

// Component Views
import LiftView from '../../components/body/LiftView';
import LiveView from '../../components/body/LiveView';
import ProgressView from '../../components/body/ProgressView';

type TabOption = 'LIFT' | 'LIVE' | 'PROGRESS';

export default function BodyScreen() {
    const [activeTab, setActiveTab] = useState<TabOption>('LIFT'); // Default to LIFT for Body tab

    const renderContent = () => {
        switch (activeTab) {
            case 'LIFT':
                return <LiftView />;
            case 'LIVE':
                return <LiveView />;
            case 'PROGRESS':
                return <ProgressView />;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-zinc-900">
                <Text className="text-3xl font-bold text-white tracking-tighter">THE BODY</Text>
            </View>

            {/* Top Tab Switcher */}
            <View className="flex-row items-center justify-evenly py-4 border-b border-zinc-900 bg-black/50">
                {(['LIFT', 'LIVE', 'PROGRESS'] as TabOption[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`px-4 py-1 rounded-full ${activeTab === tab ? 'bg-zinc-800' : ''}`}
                    >
                        <Text className={`font-bold tracking-widest text-xs ${activeTab === tab ? 'text-neonGreen' : 'text-zinc-500'}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content Area */}
            <View className="flex-1">
                {renderContent()}
            </View>
        </SafeAreaView>
    );
}
