'use client';

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';

interface VisibilityChartProps {
    data: Array<{ date: string; visible: number; scans: number }>;
}

export function VisibilityChart({ data }: VisibilityChartProps) {
    const chartData = data.map((d) => {
        const date = new Date(d.date);
        return {
            ...d,
            formattedDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        };
    });

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorVisibility" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b982" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b982" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    minTickGap={30}
                    padding={{ left: 10, right: 10 }}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                    }}
                    itemStyle={{ color: '#10b982' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area
                    type="monotone"
                    dataKey="visible"
                    stroke="#10b982"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVisibility)"
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
