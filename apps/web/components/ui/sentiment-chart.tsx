'use client';

import dynamic from 'next/dynamic';

const SentimentChart = dynamic(() => import('./sentiment-chart-impl'), {
    ssr: false,
    loading: () => <div className="h-[200px] flex items-center justify-center">Loading chart…</div>,
});

export default SentimentChart;
