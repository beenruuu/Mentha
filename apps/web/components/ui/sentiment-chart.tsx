'use client';

import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';

interface SentimentChartProps {
    data: Array<{ date: string; sentiment: number | null }>;
}

export function SentimentChart({ data }: SentimentChartProps) {
    const chartData = data.map((d) => {
        const date = new Date(d.date);
        return {
            ...d,
            formattedDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        };
    });

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    minTickGap={30}
                    padding={{ left: 10, right: 10 }}
                />
                <YAxis
                    domain={[-1, 1]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                    }}
                    itemStyle={{ color: '#f87171' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#f87171"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f87171', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
