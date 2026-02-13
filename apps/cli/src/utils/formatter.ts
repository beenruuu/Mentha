import chalk from 'chalk';

export const formatter = {
    /**
     * Format a date string to a human-readable format
     */
    date: (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today.js';
        } else if (diffDays === 1) {
            return 'Yesterday.js';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        }

        return date.toLocaleDateString();
    },

    /**
     * Format a number with thousands separator
     */
    number: (num: number): string => {
        return num.toLocaleString();
    },

    /**
     * Format a percentage
     */
    percentage: (value: number): string => {
        return `${(value * 100).toFixed(2)}%`;
    },

    /**
     * Format sentiment score with color
     */
    sentiment: (score: number): string => {
        const formatted = score.toFixed(2);
        if (score > 0.3) {
            return chalk.green(`+${formatted}`);
        } else if (score < -0.3) {
            return chalk.red(formatted);
        }
        return chalk.yellow(formatted);
    },

    /**
     * Format boolean visibility status
     */
    visibility: (visible: boolean): string => {
        return visible ? chalk.green('✓ Visible') : chalk.red('✗ Not visible');
    },

    /**
     * Format recommendation type
     */
    recommendationType: (
        type: 'direct_recommendation' | 'neutral_comparison' | 'negative_mention' | 'absent',
    ): string => {
        const colors = {
            direct_recommendation: chalk.green('Direct Recommendation'),
            neutral_comparison: chalk.yellow('Neutral Comparison'),
            negative_mention: chalk.red('Negative Mention'),
            absent: chalk.gray('Absent'),
        };
        return colors[type];
    },

    /**
     * Format intent type
     */
    intent: (intent: string): string => {
        const colors: Record<string, (text: string) => string> = {
            informational: chalk.blue,
            transactional: chalk.green,
            navigational: chalk.cyan,
            commercial: chalk.yellow,
        };
        const colorFn = colors[intent] || chalk.white;
        return colorFn(intent);
    },

    /**
     * Format scan frequency
     */
    frequency: (freq: string): string => {
        const colors: Record<string, (text: string) => string> = {
            daily: chalk.green,
            weekly: chalk.yellow,
            manual: chalk.gray,
        };
        const colorFn = colors[freq] || chalk.white;
        return colorFn(freq);
    },

    /**
     * Format token usage
     */
    tokens: (usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    }): string => {
        if (!usage) return 'N/A.js';
        return `${formatter.number(usage.promptTokens)} prompt + ${formatter.number(
            usage.completionTokens,
        )} completion = ${chalk.bold(formatter.number(usage.totalTokens))} total`;
    },

    /**
     * Format latency
     */
    latency: (ms: number): string => {
        if (ms < 1000) {
            return `${ms}ms`;
        }
        return `${(ms / 1000).toFixed(2)}s`;
    },

    /**
     * Format URL domain
     */
    domain: (url: string): string => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url;
        }
    },

    /**
     * Truncate text with ellipsis
     */
    truncate: (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength - 3)}....js`;
    },

    /**
     * Format JSON output
     */
    json: <T>(data: T): string => {
        return JSON.stringify(data, null, 2);
    },

    /**
     * Format success message
     */
    success: (message: string): string => {
        return chalk.green(`✓ ${message}`);
    },

    /**
     * Format error message
     */
    error: (message: string): string => {
        return chalk.red(`✗ ${message}`);
    },

    /**
     * Format warning message
     */
    warning: (message: string): string => {
        return chalk.yellow(`⚠ ${message}`);
    },

    /**
     * Format info message
     */
    info: (message: string): string => {
        return chalk.blue(`ℹ ${message}`);
    },

    /**
     * Format provider name with color
     */
    provider: (name: string): string => {
        const colors: Record<string, (text: string) => string> = {
            perplexity: chalk.magenta,
            openai: chalk.green,
            gemini: chalk.blue,
            claude: chalk.yellow,
        };
        const colorFn = colors[name.toLowerCase()] || chalk.white;
        return colorFn(name);
    },
};
