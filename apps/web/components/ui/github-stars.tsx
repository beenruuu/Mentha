'use client';

import { Github } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

const REPO_URL = 'https://github.com/beenruuu/mentha';
const API_URL = 'https://api.github.com/repos/beenruuu/mentha';
const CACHE_KEY = 'mentha-github-stars-v2';
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

export const GithubStars: React.FC = () => {
    const [stars, setStars] = useState<string | number>('GitHub');
    const [loading, setLoading] = useState(true);

    const fetchStars = useCallback(async () => {
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { value, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                setStars(value);
                setLoading(false);
                return;
            }
        }

        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                const count = data.stargazers_count;
                const label = Number.isFinite(count) ? `★ ${count}` : 'GitHub';
                setStars(label);
                sessionStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({
                        value: label,
                        timestamp: Date.now(),
                    }),
                );
            }
        } catch (error) {
            console.error('Failed to fetch GitHub stars', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStars();
    }, [fetchStars]);

    return (
        <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Mentha on GitHub"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-mentha-forest/20 bg-mentha-beige text-mentha-forest shadow-sm transition-all hover:border-mentha-mint hover:text-mentha-mint dark:border-mentha-beige/20 dark:bg-mentha-forest dark:text-mentha-beige dark:hover:border-mentha-mint group"
            title="Open Mentha on GitHub"
        >
            <Github size={14} className="text-current group-hover:scale-110 transition-transform" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                {loading ? '...' : stars}
            </span>
        </a>
    );
};
