'use client';

import React, { useState } from 'react';
import { ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

// Types
interface ProviderData {
  visibilityScore: number;
  mentions?: number;
}

interface ComparisonRow {
  competitor: string;
  isOwn?: boolean;
  providers: Record<string, ProviderData>;
}

interface CompetitorInfo {
  name: string;
  url?: string;
  favicon?: string;
}

interface ProviderComparisonMatrixProps {
  data: ComparisonRow[];
  brandName: string;
  competitors?: CompetitorInfo[];
}

// Provider icons
const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'OpenAI': (
    <img
      src="https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg"
      alt="OpenAI"
      className="w-6 h-6"
    />
  ),
  'Anthropic': (
    <img
      src="https://cdn.brandfetch.io/idmJWF3N06/theme/dark/symbol.svg"
      alt="Anthropic"
      className="w-5 h-5"
    />
  ),
  'Gemini': (
    <img
      src="/providers/gemini-color.svg?v=3"
      alt="Gemini"
      className="w-5 h-5"
    />
  ),
  'Perplexity': (
    <img
      src="https://cdn.brandfetch.io/idNdawywEZ/w/800/h/800/theme/dark/icon.png"
      alt="Perplexity"
      className="w-5 h-5"
    />
  ),
};

const DEFAULT_PROVIDERS = ['OpenAI', 'Anthropic', 'Perplexity', 'Gemini'];

export function ProviderComparisonMatrix({ data, brandName, competitors }: ProviderComparisonMatrixProps) {
  const [sortColumn, setSortColumn] = useState<string>('competitor');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <p className="text-muted-foreground text-lg mb-2">Sin datos de comparación</p>
        <p className="text-muted-foreground text-sm">Ejecuta un análisis para ver la comparativa</p>
      </div>
    );
  }

  // Extract providers from data
  const providers = DEFAULT_PROVIDERS.filter(p =>
    data.some(row => row.providers[p]?.visibilityScore !== undefined)
  );

  if (providers.length === 0) {
    // Show all providers even without data
    providers.push(...DEFAULT_PROVIDERS);
  }

  const getBackgroundStyle = (score: number) => {
    const opacity = Math.pow(score / 100, 0.5);
    return {
      backgroundColor: `rgba(16, 185, 129, ${opacity})`, // emerald
      border: score > 0 ? '1px solid rgb(16, 185, 129)' : undefined
    };
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    return [...data].sort((a, b) => {
      if (sortDirection === null) return 0;

      if (sortColumn === 'competitor') {
        return sortDirection === 'asc'
          ? a.competitor.localeCompare(b.competitor)
          : b.competitor.localeCompare(a.competitor);
      }

      const aValue = a.providers[sortColumn]?.visibilityScore || 0;
      const bValue = b.providers[sortColumn]?.visibilityScore || 0;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDownIcon className="w-4 h-4 opacity-30" />;
    if (sortDirection === 'asc') return <ArrowUpIcon className="w-4 h-4" />;
    if (sortDirection === 'desc') return <ArrowDownIcon className="w-4 h-4" />;
    return <ArrowUpDownIcon className="w-4 h-4" />;
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="bg-muted border-b border-r w-[180px]">
              <button
                onClick={() => handleSort('competitor')}
                className="w-full p-3 font-medium flex items-center justify-between hover:bg-accent transition-colors text-left"
              >
                Competidores
                {getSortIcon('competitor')}
              </button>
            </th>
            {providers.map((provider, index) => (
              <th
                key={provider}
                className={`bg-muted border-b ${index < providers.length - 1 ? 'border-r' : ''}`}
              >
                <button
                  onClick={() => handleSort(provider)}
                  className="w-full p-3 font-medium flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    {PROVIDER_ICONS[provider] || <div className="w-5 h-5 bg-gray-400 rounded" />}
                    {getSortIcon(provider)}
                  </div>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getSortedData().map((row, rowIndex) => (
            <tr key={row.competitor} className={rowIndex > 0 ? 'border-t' : ''}>
              <td className="border-r bg-card p-3">
                <div className="flex items-center gap-2">
                  {row.isOwn && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                  <span className={row.isOwn ? 'font-semibold text-emerald-600' : ''}>
                    {row.competitor}
                  </span>
                </div>
              </td>
              {providers.map((provider, index) => {
                const score = row.providers[provider]?.visibilityScore || 0;
                return (
                  <td
                    key={provider}
                    className={`text-center p-3 ${index < providers.length - 1 ? 'border-r' : ''}`}
                    style={getBackgroundStyle(score)}
                  >
                    <span className="font-medium text-sm">
                      {score}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}