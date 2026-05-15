'use client';

import dynamic from 'next/dynamic';

const VisibilityChart = dynamic(() => import('./visibility-chart-impl'), {
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center">Loading chart…</div>,
});

export default VisibilityChart;
