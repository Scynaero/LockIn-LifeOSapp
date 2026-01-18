import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FinanceService } from '../services/FinanceService';

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];

export default function AddTransactionScreen() {
    const router = useRouter();
    const [amount, setAmount] = useState('0');
    const [type, setType] = useState<'expense' | 'split'>('expense');

    // Expense State
    const [category, setCategory] = useState('Food');

    // Split/Debt State
    const [personName, setPersonName] = useState('');
    const [splitType, setSplitType] = useState<'full' | 'equal'>('equal'); // Full = they owe full amount, Equal = they owe half
    const [whoPaid, setWhoPaid] = useState<'me' | 'them'>('me');

    const handlePress = (key: string) => {
        if (key === '⌫') {
            setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else if (key === '.') {
            if (!amount.includes('.')) setAmount(prev => prev + '.');
        } else {
            setAmount(prev => prev === '0' ? key : prev + key);
        }
    };

    const handleSave = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount.');
            return;
        }

        try {
            if (type === 'expense') {
                await FinanceService.addExpense(val, category, new Date().toISOString(), personName);
            } else {
                if (!personName.trim()) {
                    Alert.alert('Missing Name', 'Please enter the name of the person.');
                    return;
                }

                let debtAmount = val;
                let debtType: 'owed_to_me' | 'i_owe' = 'owed_to_me';

                if (whoPaid === 'me') {
                    // I Paid
                    // Equal: They owe me 50%.
                    // Full: They owe me 100%.
                    debtType = 'owed_to_me';
                    debtAmount = splitType === 'equal' ? val / 2 : val;
                } else {
                    // They Paid
                    // Equal: I owe them 50%.
                    // Full: I owe them 100%.
                    debtType = 'i_owe';
                    debtAmount = splitType === 'equal' ? val / 2 : val;
                }

                await FinanceService.addDebt(personName, debtAmount, debtType);
            }
            router.back();
        } catch (e) {
            Alert.alert('Error', 'Failed to save transaction.');
        }
    };

    return (
        <View className="flex-1 bg-black">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-zinc-400 text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">New Transaction</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text className="text-emerald-400 text-lg font-bold">Save</Text>
                </TouchableOpacity>
            </View>

            {/* Display */}
            <View className="items-center justify-center py-10">
                <Text className="text-zinc-500 text-sm mb-2 uppercase tracking-widest">Amount</Text>
                <Text className="text-white text-6xl font-bold">₹{amount}</Text>
            </View>

            {/* Type Switcher */}
            <View className="flex-row mx-6 bg-zinc-900 p-1 rounded-xl mb-6">
                <TouchableOpacity
                    onPress={() => setType('expense')}
                    className={`flex-1 py-3 rounded-lg items-center ${type === 'expense' ? 'bg-zinc-800' : ''}`}
                >
                    <Text className={`font-medium ${type === 'expense' ? 'text-white' : 'text-zinc-500'}`}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setType('split')}
                    className={`flex-1 py-3 rounded-lg items-center ${type === 'split' ? 'bg-zinc-800' : ''}`}
                >
                    <Text className={`font-medium ${type === 'split' ? 'text-white' : 'text-zinc-500'}`}>Split / Debt</Text>
                </TouchableOpacity>
            </View>

            {/* Context Inputs */}
            <ScrollView className="flex-1 px-6">
                {type === 'expense' ? (
                    <View>
                        <Text className="text-zinc-400 mb-3 ml-1">Category</Text>
                        <View className="flex-row flex-wrap gap-2 mb-6">
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    className={`px-4 py-2 rounded-full border ${category === cat ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700 bg-zinc-900'}`}
                                >
                                    <Text className={category === cat ? 'text-black font-medium' : 'text-white'}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View>
                            <Text className="text-zinc-400 mb-2 ml-1">Description (What was it for?)</Text>
                            <TextInput
                                value={personName} // Reusing personName state variable for description in expense mode to avoid new state
                                onChangeText={setPersonName}
                                placeholder="e.g. Lunch with team, New Headphones"
                                placeholderTextColor="#52525B"
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 text-lg"
                            />
                        </View>
                    </View>
                ) : (
                    <View className="gap-4">
                        <View>
                            <Text className="text-zinc-400 mb-2 ml-1">Person Name</Text>
                            <TextInput
                                value={personName}
                                onChangeText={setPersonName}
                                placeholder="e.g. John Doe"
                                placeholderTextColor="#52525B"
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 text-lg"
                            />
                        </View>

                        <View>
                            <Text className="text-zinc-400 mb-2 ml-1">Split Type</Text>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setSplitType('equal')}
                                    className={`flex-1 p-4 rounded-xl border ${splitType === 'equal' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}
                                >
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-white font-medium">Split Equally</Text>
                                        <Ionicons name="people-outline" size={16} color="white" />
                                    </View>
                                    <Text className="text-zinc-500 text-xs">50/50 Split</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setSplitType('full')}
                                    className={`flex-1 p-4 rounded-xl border ${splitType === 'full' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-zinc-900 border-zinc-800'}`}
                                >
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-white font-medium">Full Amount</Text>
                                        <Ionicons name="arrow-up-circle-outline" size={16} color="white" />
                                    </View>
                                    <Text className="text-zinc-500 text-xs">100% Owed</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="mt-4">
                                <Text className="text-zinc-400 mb-2 ml-1">Who Paid?</Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => setWhoPaid('me')}
                                        className={`flex-1 p-3 rounded-lg items-center ${whoPaid === 'me' ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                                    >
                                        <Text className={whoPaid === 'me' ? 'text-black font-bold' : 'text-zinc-400'}>I Paid</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setWhoPaid('them')}
                                        className={`flex-1 p-3 rounded-lg items-center ${whoPaid === 'them' ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                                    >
                                        <Text className={whoPaid === 'them' ? 'text-black font-bold' : 'text-zinc-400'}>They Paid</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Numpad */}
            <View className="bg-zinc-900 pt-4 pb-10 rounded-t-3xl">
                <View className="flex-row flex-wrap">
                    {NUMPAD_KEYS.map(key => (
                        <TouchableOpacity
                            key={key}
                            onPress={() => handlePress(key)}
                            className="w-1/3 h-16 items-center justify-center"
                        >
                            <Text className="text-white text-2xl font-medium">{key}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}
