import Image from 'next/image';
import type React from 'react';

interface Props {
    engine: 'perplexity' | 'openai' | 'gemini' | 'claude' | 'openrouter' | string;
    size?: number;
    className?: string;
    invert?: 'dark' | 'light' | 'auto';
}

/**
 * EngineIcon - Uses strictly official SVG assets from /public/providers.
 * This component is now hard-locked to use the original brand files.
 * - invert="dark": always white (for dark backgrounds)
 * - invert="light": always black (for light backgrounds)
 * - invert="auto": white in dark mode, black in light mode
 */
export const EngineIcon: React.FC<Props> = ({ engine, size = 20, className, invert = 'auto' }) => {
    const iconSize = `${size}px`;

    const normalizedEngine = engine.toLowerCase();
    const iconPath = `/providers/${normalizedEngine}.svg`;

    const getFilter = () => {
        if (invert === 'dark') return 'invert(1)';
        if (invert === 'light') return 'none';
        return undefined;
    };

    return (
        <div
            style={{
                width: iconSize,
                height: iconSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            className={className}
        >
            <Image
                src={iconPath}
                alt={`${engine} logo`}
                width={size}
                height={size}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: getFilter() || undefined,
                }}
                onError={(e) => {
                    if (normalizedEngine !== 'openrouter') {
                        (e.target as HTMLImageElement).src = '/providers/openrouter.svg';
                    }
                }}
            />
        </div>
    );
};

export default EngineIcon;
