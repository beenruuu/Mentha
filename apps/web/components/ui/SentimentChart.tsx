'use client';

import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface SentimentChartProps {
    data: Array<{ date: string; sentiment: number | null }>;
}

export function SentimentChart({ data }: SentimentChartProps) {
    // Filter out nulls for the line chart if needed, or just let Chart.js handle it
    const chartData = {
        labels: data.map((d) => {
            const date = new Date(d.date);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Sentiment Score',
                data: data.map((d) => d.sentiment),
                borderColor: '#f87171', // Reddish for sentiment
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#f87171',
                spanGaps: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                min: -1,
                max: 1,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#9CA3AF',
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#9CA3AF',
                },
            },
        },
    };

    return <Line options={options} data={chartData} />;
}
