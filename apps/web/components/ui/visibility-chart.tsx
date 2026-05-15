'use client';

import dynamic from 'next/dynamic';

export type { VisibilityChartProps } from './visibility-chart-impl';

const VisibilityChart = dynamic(() => import('./visibility-chart-impl'), {
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center">Loading chart…</div>,
});

export default VisibilityChart;
