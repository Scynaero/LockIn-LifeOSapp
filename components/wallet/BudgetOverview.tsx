import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { FinanceService } from '../../services/FinanceService';
import { CurrencyService } from '../../services/CurrencyService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const BudgetRow = ({ budget }: { budget: { category: string, limit: number, spent: number, remaining: number } }) => {
    const progress = useSharedValue(0);
    // Calculated target percentage (0-100)
    const targetPercent = budget.limit > 0
        ? Math.min((budget.spent / budget.limit) * 100, 100)
        : (budget.spent > 0 ? 100 : 0);

    useEffect(() => {
        progress.value = withTiming(targetPercent, { duration: 1000 });
    }, [targetPercent]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value}%`,
        };
    });

    return (
        <View className="mb-3">
            <View className="flex-row justify-between mb-1">
                <Text className="text-zinc-300 text-sm font-medium">{budget.category}</Text>
                <Text className="text-zinc-400 text-xs">{budget.spent.toFixed(0)} / {budget.limit.toFixed(0)}</Text>
            </View>
            <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <Animated.View
                    className={`h-full ${budget.spent > budget.limit ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={animatedStyle}
                />
            </View>
        </View>
    );
};

export default function BudgetOverview() {
    const [overview, setOverview] = useState({ income: 0, spent: 0, remaining: 0 });
    const [budgets, setBudgets] = useState<{ category: string, limit: number, spent: number, remaining: number }[]>([]);
    const [currencySymbol, setCurrencySymbol] = useState('₹');

    const [isIncomeModalVisible, setIncomeModalVisible] = useState(false);
    const [newIncome, setNewIncome] = useState('');

    const [isBudgetModalVisible, setBudgetModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [newLimit, setNewLimit] = useState('');

    const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);

    const loadData = async () => {
        const now = new Date();
        const ov = await FinanceService.getMonthlyOverview(now.getMonth(), now.getFullYear());
        setOverview(ov);
        const b = await FinanceService.getBudgets(now.getMonth(), now.getFullYear());
        setBudgets(b);

        const currCode = await CurrencyService.getCurrency();
        setCurrencySymbol(CurrencyService.getSymbol(currCode));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveIncome = async () => {
        const amount = parseFloat(newIncome);
        if (!isNaN(amount)) {
            const now = new Date();
            await FinanceService.setIncome(now.getMonth(), now.getFullYear(), amount);
            loadData();
            setIncomeModalVisible(false);
        }
    };

    const handleSaveBudget = async () => {
        const limit = parseFloat(newLimit);
        if (selectedCategory && !isNaN(limit)) {
            const now = new Date();
            await FinanceService.setBudget(selectedCategory, limit, now.getMonth(), now.getFullYear());
            loadData();
            setBudgetModalVisible(false);
            setNewLimit('');
            setSelectedCategory('');
        }
    };

    const handleSetCurrency = async (code: string) => {
        await CurrencyService.setCurrency(code);
        await loadData(); // Reload symbol
        setCurrencyModalVisible(false);
    };

    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

    return (
        <View className="mb-6">
            {/* Overview Card */}
            <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-4">
                <View className="flex-row justify-between mb-4">
                    <Text className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Monthly Overview</Text>
                    <View className="flex-row gap-4">
                        <TouchableOpacity onPress={() => setCurrencyModalVisible(true)}>
                            <Text className="text-zinc-500 text-xs font-bold">{currencySymbol} Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIncomeModalVisible(true)}>
                            <Text className="text-primary text-xs font-bold">Set Income</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-zinc-500 text-xs mb-1">Incoming</Text>
                        <Text className="text-white text-lg font-bold">{currencySymbol}{overview.income.toLocaleString()}</Text>
                    </View>
                    <View className="h-8 w-[1px] bg-zinc-800" />
                    <View>
                        <Text className="text-zinc-500 text-xs mb-1">Spent</Text>
                        <Text className="text-red-400 text-lg font-bold">{currencySymbol}{overview.spent.toLocaleString()}</Text>
                    </View>
                    <View className="h-8 w-[1px] bg-zinc-800" />
                    <View>
                        <Text className="text-zinc-500 text-xs mb-1">Left</Text>
                        <Text className={`text-lg font-bold ${overview.remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {currencySymbol}{overview.remaining.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Buckets Section */}
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-zinc-400 text-sm font-medium uppercase tracking-widest">Buckets</Text>
                <TouchableOpacity onPress={() => setBudgetModalVisible(true)}>
                    <Ionicons name="add-circle-outline" size={20} color="#10B981" />
                </TouchableOpacity>
            </View>

            {budgets.length === 0 ? (
                <Text className="text-zinc-600 italic text-sm">No bucket limits set.</Text>
            ) : (
                budgets.map((b, i) => (
                    <BudgetRow key={i} budget={b} />
                ))
            )}

            {/* Income Modal */}
            <Modal visible={isIncomeModalVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/80 justify-center items-center p-4">
                    <View className="bg-zinc-900 w-full max-w-sm p-6 rounded-2xl border border-zinc-700">
                        <Text className="text-white text-lg font-bold mb-4">Set Monthly Income</Text>
                        <TextInput
                            className="bg-black text-white p-3 rounded-lg border border-zinc-700 mb-4 text-lg"
                            placeholder="Amount"
                            placeholderTextColor="#555"
                            keyboardType="numeric"
                            value={newIncome}
                            onChangeText={setNewIncome}
                            autoFocus
                        />
                        <View className="flex-row justify-end gap-4">
                            <TouchableOpacity onPress={() => setIncomeModalVisible(false)}>
                                <Text className="text-zinc-400 text-lg">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveIncome}>
                                <Text className="text-primary text-lg font-bold">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Budget Modal */}
            <Modal visible={isBudgetModalVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/80 justify-center items-center p-4">
                    <View className="bg-zinc-900 w-full max-w-sm p-6 rounded-2xl border border-zinc-700">
                        <Text className="text-white text-lg font-bold mb-4">Set Category Bucket</Text>

                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1 rounded-full border ${selectedCategory === cat ? 'bg-primary border-primary' : 'border-zinc-600'}`}
                                >
                                    <Text className={`${selectedCategory === cat ? 'text-black font-bold' : 'text-zinc-300'}`}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            className="bg-black text-white p-3 rounded-lg border border-zinc-700 mb-4 text-lg"
                            placeholder="Limit Amount"
                            placeholderTextColor="#555"
                            keyboardType="numeric"
                            value={newLimit}
                            onChangeText={setNewLimit}
                        />

                        <View className="flex-row justify-end gap-4">
                            <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
                                <Text className="text-zinc-400 text-lg">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveBudget}>
                                <Text className="text-primary text-lg font-bold">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Currency Modal */}
            <Modal visible={isCurrencyModalVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/80 justify-center items-center p-4">
                    <View className="bg-zinc-900 w-full max-w-sm p-6 rounded-2xl border border-zinc-700 h-3/4">
                        <Text className="text-white text-lg font-bold mb-4">Select Currency</Text>
                        <FlatList
                            data={['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'BRL', 'ZAR']}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleSetCurrency(item)}
                                    className="px-4 py-3 border-b border-zinc-800 flex-row justify-between items-center"
                                >
                                    <Text className="text-white font-bold text-lg">{item}</Text>
                                    <Text className="text-zinc-500 text-lg">{CurrencyService.getSymbol(item)}</Text>
                                </TouchableOpacity>
                            )}
                            className="flex-1"
                        />
                        <View className="flex-row justify-end gap-4 mt-4">
                            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                                <Text className="text-zinc-400 text-lg">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}
