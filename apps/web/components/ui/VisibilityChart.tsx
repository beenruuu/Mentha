"use client";

import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

interface VisibilityChartProps {
    data: Array<{ date: string; visible: number; scans: number }>;
}

export function VisibilityChart({ data }: VisibilityChartProps) {
    const chartData = {
        labels: data.map((d) => {
            const date = new Date(d.date);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                fill: true,
                label: "Brand Visibility",
                data: data.map((d) => d.visible),
                borderColor: "#10b982",
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, "rgba(16, 185, 130, 0.15)");
                    gradient.addColorStop(1, "rgba(16, 185, 130, 0)");
                    return gradient;
                },
                borderWidth: 2,
                tension: 0.5,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#10b982",
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 2,
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
            tooltip: {
                mode: "index" as const,
                intersect: false,
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                titleColor: "#94a3b8",
                bodyColor: "#fff",
                padding: 12,
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderWidth: 1,
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        },
        scales: {
            y: {
                display: false,
                beginAtZero: true,
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: "#4b5563",
                    font: {
                        size: 10,
                    },
                    padding: 20,
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 7
                },
                border: {
                    display: false
                }
            },
        },
    };

    return <Line options={options} data={chartData} />;
}
