import React from "react";
import { View, Text } from "react-native";
import { PolarChart, Pie } from "victory-native";
import { useFont } from "@shopify/react-native-skia";

type ChartData = {
    x: string;
    y: number;
    color: string;
};

// Mock data for initial visualization if real data is empty
const MOCK_DATA: ChartData[] = [];

import { CurrencyService } from '../../services/CurrencyService';
import { useState, useEffect } from 'react';

// ...

export default function DonutChart({ data }: { data?: ChartData[] }) {
    const [currencySymbol, setCurrencySymbol] = useState('₹');

    useEffect(() => {
        CurrencyService.getCurrency().then(curr => {
            setCurrencySymbol(CurrencyService.getSymbol(curr));
        });
    }, [data]); // Reload if data changes (e.g. refresh), or just on mount

    const chartData = (data && data.length > 0) ? data : MOCK_DATA;
    const total = chartData.reduce((acc, curr) => acc + curr.y, 0);

    return (
        <View className="h-64 items-center justify-center">
            <View className="w-56 h-56">
                <PolarChart
                    data={chartData}
                    labelKey="x"
                    valueKey="y"
                    colorKey="color"
                >
                    <Pie.Chart innerRadius={60} />
                </PolarChart>

                {/* Center Label Overlay */}
                <View className="absolute inset-0 items-center justify-center pointer-events-none">
                    <Text className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Total</Text>
                    <Text className="text-white text-2xl font-bold">{currencySymbol}{total}</Text>
                </View>
            </View>
        </View>
    );
}
