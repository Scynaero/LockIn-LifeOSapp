import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SectionList, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinanceService, Expense, Debt } from '../../services/FinanceService';

type Transaction = (Expense | Debt) & { type: 'expense' | 'debt' };

export default function HistoryScreen() {
    const router = useRouter();
    const [sections, setSections] = useState<{ title: string; data: Transaction[] }[]>([]);

    const fetchTransactions = async () => {
        const allData = await FinanceService.getAllTransactions();

        // Group by Month Year
        const grouped: { [key: string]: Transaction[] } = {};

        allData.forEach(item => {
            const date = new Date(item.date);
            const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // e.g., "January 2026"
            if (!grouped[key]) grouped[key] = [];
            // Assert item type if needed, though allData return type should ideally match.
            // FinanceService.getAllTransactions returns combined with explicit types, but TS might widen.
            grouped[key].push(item as Transaction);
        });

        const sectionsArray = Object.keys(grouped).map(key => ({
            title: key,
            data: grouped[key]
        }));

        setSections(sectionsArray);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchTransactions();
        }, [])
    );

    const handleDelete = (item: Transaction) => {
        Alert.alert(
            "Delete Transaction",
            "Are you sure you want to delete this?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (item.type === 'expense') {
                            await FinanceService.deleteExpense(item.id);
                        } else {
                            await FinanceService.deleteDebt(item.id);
                        }
                        fetchTransactions();
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const isExpense = item.type === 'expense';
        const isDebt = item.type === 'debt';

        let amountColor = 'text-white';
        let amountPrefix = '-';
        let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'cash-outline';
        let title = '';
        let subtitle = new Date(item.date).toLocaleDateString();

        if (isExpense) {
            const expense = item as unknown as Expense;
            amountColor = 'text-white';
            title = expense.category;
            if (expense.note) subtitle += ` • ${expense.note}`;
            iconName = 'cart-outline';
        } else if (isDebt) {
            const debt = item as unknown as Debt;
            if (debt.type === 'owed_to_me') {
                amountColor = 'text-emerald-400';
                amountPrefix = '+';
                title = `${debt.person_name} owes you`;
                iconName = 'arrow-up-circle-outline';
            } else {
                amountColor = 'text-red-500';
                amountPrefix = '-';
                title = `You owe ${debt.person_name}`;
                iconName = 'arrow-down-circle-outline';
            }
        }

        return (
            <TouchableOpacity
                onLongPress={() => handleDelete(item)}
                delayLongPress={500}
                className="flex-row items-center justify-between py-4 border-b border-zinc-800"
            >
                <View className="flex-1 flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                        <Ionicons name={iconName} size={20} color="#A1A1AA" />
                    </View>
                    <View className="flex-1 mr-4">
                        <Text className="text-white font-medium text-lg" numberOfLines={1}>{title}</Text>
                        <Text className="text-zinc-500 text-sm" numberOfLines={1}>{subtitle}</Text>
                    </View>
                </View>
                <Text className={`font-bold text-lg ${amountColor}`}>
                    {amountPrefix}₹{item.amount.toFixed(2)}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-black">
            <View className="px-6 pb-4 flex-row items-center gap-4 border-b border-zinc-900">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Transaction History</Text>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <View className="bg-zinc-900 px-6 py-2">
                        <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">{title}</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                    <Text className="text-zinc-500 text-center mt-10">No transactions found.</Text>
                }
            />
        </SafeAreaView>
    );
}
