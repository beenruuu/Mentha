'use client';

import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { getEngineDisplayName } from '@/lib/engines';
import { EngineIcon } from './engine-icon';

export interface VisibilityChartProps {
    data: Array<{
        date: string;
        visible: number;
        scans: number;
        perplexity?: number;
        openai?: number;
        gemini?: number;
        claude?: number;
    }>;
}

export function VisibilityChart({ data }: VisibilityChartProps) {
    const chartData = data.map((d) => {
        const date = new Date(d.date);
        return {
            ...d,
            formattedDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        };
    });

    const renderCustomLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="flex flex-wrap justify-center gap-6 mt-6">
                {payload.map((entry: any) => {
                    const isAvgVisibility = entry.dataKey === 'visible';
                    return (
                        <div key={`item-${entry.dataKey}`} className="flex items-center gap-2">
                            {isAvgVisibility ? (
                                <div
                                    className="size-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                            ) : (
                                <div className="flex size-5 items-center justify-center rounded bg-mentha-forest/10 dark:bg-mentha-mint/10">
                                    <EngineIcon engine={entry.dataKey} size={12} invert="auto" />
                                </div>
                            )}
                            <span className="text-[10px] font-mono uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60">
                                {entry.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1" style={{ minHeight: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
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
                            tick={{ fill: '#888', fontSize: 10 }}
                            minTickGap={30}
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="bg-mentha-forest dark:bg-mentha-dark border border-mentha-mint/20 rounded-xl p-3 backdrop-blur-lg shadow-xl">
                                        <div className="text-xs text-mentha-muted font-semibold mb-2 font-mono">
                                            {label}
                                        </div>
                                        {payload.map((entry: any) => {
                                            const isAvgVisibility = entry.dataKey === 'visible';
                                            return (
                                                <div
                                                    key={entry.dataKey}
                                                    className="flex items-center gap-2 py-1"
                                                >
                                                    {isAvgVisibility ? (
                                                        <div
                                                            className="size-2 rounded-full"
                                                            style={{ backgroundColor: entry.color }}
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center size-4 bg-mentha-mint/10 rounded">
                                                            <EngineIcon
                                                                engine={entry.dataKey}
                                                                size={10}
                                                                invert="dark"
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="text-[11px] text-mentha-beige/80 dark:text-mentha-beige font-mono uppercase tracking-wider">
                                                        {entry.name}
                                                    </span>
                                                    <span className="text-[11px] text-mentha-mint font-mono ml-auto">
                                                        {entry.value}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="visible"
                            stroke="#10b982"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVisibility)"
                            name="Avg Visibility"
                        />
                        <Area
                            type="monotone"
                            dataKey="perplexity"
                            stroke="#20B2AA"
                            strokeWidth={2}
                            fillOpacity={0}
                            name={getEngineDisplayName('perplexity')}
                            dot={<CustomDot engine="perplexity" />}
                        />
                        <Area
                            type="monotone"
                            dataKey="openai"
                            stroke="#10a37f"
                            strokeWidth={2}
                            fillOpacity={0}
                            name={getEngineDisplayName('openai')}
                            dot={<CustomDot engine="openai" />}
                        />
                        <Area
                            type="monotone"
                            dataKey="gemini"
                            stroke="#4285f4"
                            strokeWidth={2}
                            fillOpacity={0}
                            name={getEngineDisplayName('gemini')}
                            dot={<CustomDot engine="gemini" />}
                        />
                        <Area
                            type="monotone"
                            dataKey="claude"
                            stroke="#d97757"
                            strokeWidth={2}
                            fillOpacity={0}
                            name={getEngineDisplayName('claude')}
                            dot={<CustomDot engine="claude" />}
                        />
                        <Legend content={renderCustomLegend} verticalAlign="bottom" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default VisibilityChart;

function CustomDot(props: any) {
    const { cx, cy, engine, payload } = props;
    if (!payload || payload[engine] === undefined) return null;

    return (
        <foreignObject x={cx - 6} y={cy - 6} width={12} height={12}>
            <div className="flex items-center justify-center size-full bg-white dark:bg-mentha-dark rounded-full shadow-sm ring-1 ring-black/5">
                <EngineIcon engine={engine} size={8} invert="dark" />
            </div>
        </foreignObject>
    );
}
