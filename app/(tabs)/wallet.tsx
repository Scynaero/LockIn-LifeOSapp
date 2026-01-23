import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, useFocusEffect } from 'expo-router';

import DonutChart from '../../components/wallet/DonutChart';
import ActiveDebtsCard from '../../components/wallet/ActiveDebtsCard';
import TransactionList from '../../components/wallet/TransactionList';
import { FinanceService } from '../../services/FinanceService';
import BudgetOverview from '../../components/wallet/BudgetOverview';

export default function WalletScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [expenses, setExpenses] = useState([]);

    // We'll aggregate real data for the chart here
    const fetchChartData = async () => {
        const data = await FinanceService.getExpenseSummary(); // Defaults to current month
        setExpenses(data as any);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchChartData();
        }, [])
    );

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        // Refetch everything
        await fetchChartData();
        setRefreshing(false);
    }, []);

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-black">
            <View className="px-6 pt-4 pb-4 flex-row justify-between items-center">
                <Text className="text-white text-3xl font-bold tracking-tight">Wallet</Text>
                <TouchableOpacity
                    onPress={() => router.push('/add-transaction')}
                    className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 px-6"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Budget & Income Overview */}
                <BudgetOverview />

                {/* Spending Chart Section */}
                <View className="mb-8">
                    <Text className="text-zinc-500 text-sm font-medium mb-4 uppercase tracking-widest">Spending Breakdown</Text>
                    <DonutChart data={expenses} />
                </View>

                {/* Active Debts */}
                <ActiveDebtsCard />

                {/* Transactions Header */}
                <View className="flex-row items-center justify-between mt-2 mb-2">
                    <Text className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Recent</Text>
                    <TouchableOpacity onPress={() => router.push('/wallet/history')}>
                        <Text className="text-emerald-500 font-medium text-sm">See All</Text>
                    </TouchableOpacity>
                </View>

                {/* Transactions */}
                <TransactionList />

                <View className="h-24" />
            </ScrollView>
        </SafeAreaView>
    );
}
