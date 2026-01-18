import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { FinanceService, Expense, Debt } from '../../services/FinanceService'; // Assuming types are exported
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

type Transaction = (Expense | Debt) & { type: 'expense' | 'debt' };

import { Alert, TouchableOpacity } from 'react-native';

// ... (imports)

export default function TransactionList() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const fetchTransactions = async () => {
        const data = await FinanceService.getRecentTransactions(5);
        setTransactions(data as Transaction[]);
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
                        fetchTransactions(); // Refresh
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const isExpense = item.type === 'expense';
        const isDebt = item.type === 'debt';

        // ... (styles logic)
        let amountColor = 'text-white';
        let amountPrefix = '-';
        let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'cash-outline';
        let title = '';
        let subtitle = new Date(item.date).toLocaleDateString();

        if (isExpense) {
            const expense = item as unknown as Expense;
            amountColor = 'text-white';
            title = expense.category;
            // Show note if available
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
                className="flex-row items-center justify-between py-3 border-b border-zinc-800/50"
            >
                <View className="flex-1 flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                        <Ionicons name={iconName} size={20} color="#A1A1AA" />
                    </View>
                    <View className="flex-1 mr-4">
                        <Text className="text-white font-medium" numberOfLines={1}>{title}</Text>
                        <Text className="text-zinc-500 text-xs" numberOfLines={1}>{subtitle}</Text>
                    </View>
                </View>
                <Text className={`font-bold ${amountColor}`}>
                    {amountPrefix}₹{item.amount.toFixed(2)}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View>
            {transactions.length === 0 ? (
                <Text className="text-zinc-600 italic">No recent transactions</Text>
            ) : (
                <View>
                    {transactions.map((t) => (
                        <View key={t.id}>{renderItem({ item: t })}</View>
                    ))}
                </View>
            )}
        </View>
    );
}
