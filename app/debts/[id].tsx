import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinanceService, Debt } from '../../services/FinanceService';

export default function DebtDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [debt, setDebt] = useState<Debt | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        // We lack a getDebtById in FinanceService currently, using getDebts and filtering for now 
        // OR simpler: assume we can query it or expand the service. 
        // For efficiency in this turn, I'll fetch all and find. 
        // IDEALLY: Service should support getById.
        const all = await FinanceService.getDebts();
        const found = all.find(d => d.id === id);
        setDebt(found || null);
        setLoading(false);
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handleSettle = async () => {
        if (!debt) return;

        Alert.alert(
            "Settle Debt",
            `Mark ${debt.person_name}'s debt of ₹${debt.amount} as paid?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Mark as Paid",
                    onPress: async () => {
                        await FinanceService.settleDebt(debt.id);
                        router.back();
                    }
                }
            ]
        );
    };

    if (loading) return <View className="flex-1 bg-black" />;
    if (!debt) return <View className="flex-1 bg-black items-center justify-center"><Text className="text-white">Debt not found</Text></View>;

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-black">
            <View className="px-6 pb-4 flex-row items-center gap-4 border-b border-zinc-900">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Details</Text>
            </View>

            <View className="p-6 items-center border-b border-zinc-900">
                <View className="w-20 h-20 bg-emerald-500/10 rounded-full items-center justify-center mb-4">
                    <Ionicons name="person" size={40} color="#34D399" />
                </View>
                <Text className="text-3xl font-bold text-white mb-1">{debt.person_name}</Text>
                <Text className="text-zinc-500 text-sm mb-6">
                    {debt.type === 'owed_to_me' ? 'Owes you' : 'You owe'}
                </Text>
                <Text className={`text-6xl font-bold mb-2 ${debt.type === 'owed_to_me' ? 'text-emerald-400' : 'text-red-500'}`}>
                    ₹{debt.amount}
                </Text>
                <Text className="text-zinc-600 text-xs uppercase tracking-widest">{debt.status}</Text>
            </View>

            <View className="p-6">
                <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">Date</Text>
                <Text className="text-white text-lg mb-6">{new Date(debt.date).toDateString()}</Text>

                <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">Related Note</Text>
                <Text className="text-white text-lg mb-6">{debt.related_expense_id ? 'Related to an expense split' : 'Direct debt'}</Text>
            </View>

            <View className="mt-auto p-6">
                {debt.status === 'pending' && (
                    <TouchableOpacity
                        onPress={handleSettle}
                        className="w-full bg-emerald-500 py-4 rounded-xl items-center"
                    >
                        <Text className="text-black font-bold text-lg">Mark as Paid</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
