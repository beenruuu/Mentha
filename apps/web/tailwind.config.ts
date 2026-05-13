import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                mentha: {
                    beige: '#F7F5F0',
                    dark: '#07140B',
                    forest: '#0A1A12',
                    mint: '#73D29B',
                    muted: '#A3B0A6',
                },
            },
            fontFamily: {
                serif: ['var(--font-instrument-serif)', 'serif'],
                sans: ['var(--font-inter)', 'sans-serif'],
                mono: ['var(--font-space-mono)', 'monospace'],
            },
        },
    },
    plugins: [],
};
export default config;
