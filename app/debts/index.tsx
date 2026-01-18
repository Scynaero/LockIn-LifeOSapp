import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinanceService, Debt } from '../../services/FinanceService';

export default function DebtListScreen() {
    const router = useRouter();
    const { filter } = useLocalSearchParams<{ filter: 'owed_to_me' | 'i_owe' }>();
    const [debts, setDebts] = useState<Debt[]>([]);
    const targetFilter = filter || 'owed_to_me'; // Default to owed_to_me

    const fetchDebts = async () => {
        let data: Debt[] = [];
        if (targetFilter === 'i_owe') {
            data = await FinanceService.getItemsIOwe();
        } else {
            data = await FinanceService.getItemsOwedToMe();
        }
        setDebts(data);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchDebts();
        }, [targetFilter])
    );

    const renderItem = ({ item }: { item: Debt }) => (
        <TouchableOpacity
            onPress={() => router.push(`/debts/${item.id}`)}
            className="flex-row items-center justify-between py-4 border-b border-zinc-800"
        >
            <View className="flex-row items-center gap-4">
                <View className={`w-12 h-12 rounded-full items-center justify-center ${item.type === 'owed_to_me' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <Ionicons name={item.type === 'owed_to_me' ? "arrow-up" : "arrow-down"} size={20} color={item.type === 'owed_to_me' ? "#34d399" : "#ef4444"} />
                </View>
                <View>
                    <Text className="text-white text-lg font-medium">{item.person_name}</Text>
                    <Text className="text-zinc-500 text-sm">{new Date(item.date).toLocaleDateString()}</Text>
                </View>
            </View>
            <View className="items-end">
                <Text className={`font-bold text-lg ${item.type === 'owed_to_me' ? 'text-emerald-400' : 'text-red-500'}`}>
                    ₹{item.amount.toFixed(2)}
                </Text>
                <Text className="text-zinc-600 text-xs uppercase">{item.status}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-black">
            <View className="px-6 pb-4 flex-row items-center gap-4 border-b border-zinc-900">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">
                    {targetFilter === 'i_owe' ? 'I Owe' : 'Owed to Me'}
                </Text>
            </View>

            <FlatList
                data={debts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 24 }}
                ListEmptyComponent={
                    <Text className="text-zinc-500 text-center mt-10">No active debts found.</Text>
                }
            />
        </SafeAreaView>
    );
}
