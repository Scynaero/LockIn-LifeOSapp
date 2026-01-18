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

export default function DonutChart({ data }: { data?: ChartData[] }) {
    // Use a system font or load a custom one if available. 
    // For simplicity in this step, we won't heavily rely on the font object inside the chart unless needed for labels.
    // Victory Native XL (Skia) often handles fonts differently, but basic Pie doesn't strictly MANDATE it for shapes.

    const chartData = (data && data.length > 0) ? data : MOCK_DATA;

    // Calculate total for center label
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
                    <Text className="text-white text-2xl font-bold">₹{total}</Text>
                </View>
            </View>
        </View>
    );
}
