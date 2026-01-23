import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FinanceService } from '../../services/FinanceService';
import { CurrencyService } from '../../services/CurrencyService';
import { useFocusEffect, useRouter } from 'expo-router';

export default function ActiveDebtsCard() {
    const router = useRouter();
    const [owedToMe, setOwedToMe] = useState(0);
    const [iOwe, setIOwe] = useState(0);
    const [currencySymbol, setCurrencySymbol] = useState('₹');

    const fetchData = async () => {
        const toMe = await FinanceService.getTotalOwedToMe();
        const meOwe = await FinanceService.getTotalIOwe();
        setOwedToMe(toMe);
        setIOwe(meOwe);
        const curr = await CurrencyService.getCurrency();
        setCurrencySymbol(CurrencyService.getSymbol(curr));
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    return (
        <View className="flex-row gap-4 mb-6">
            {/* Owed To Me Card */}
            <TouchableOpacity
                onPress={() => router.push('/debts?filter=owed_to_me')}
                className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-zinc-800"
            >
                <View className="flex-row justify-between items-start mb-2">
                    <View className="bg-emerald-500/10 p-2 rounded-full">
                        <Ionicons name="arrow-up" size={20} color="#34D399" />
                    </View>
                </View>
                <Text className="text-zinc-400 text-xs font-medium mb-1">Owed to me</Text>
                <Text className="text-white text-xl font-bold">
                    {currencySymbol}{owedToMe.toFixed(0)}
                </Text>
            </TouchableOpacity>

            {/* I Owe Card */}
            <TouchableOpacity
                onPress={() => router.push('/debts?filter=i_owe')}
                className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-zinc-800"
            >
                <View className="flex-row justify-between items-start mb-2">
                    <View className="bg-red-500/10 p-2 rounded-full">
                        <Ionicons name="arrow-down" size={20} color="#EF4444" />
                    </View>
                </View>
                <Text className="text-zinc-400 text-xs font-medium mb-1">I owe</Text>
                <Text className="text-white text-xl font-bold">
                    {currencySymbol}{iOwe.toFixed(0)}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
