import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { client } from '../client';
import config from '../config/index';
import type { ShareOfModelMetrics, TopCitation } from '../types';
import { apiCall } from '../utils/api';
import { formatter } from '../utils/formatter';
import { table } from '../utils/table';

export const dashboardCommand = new Command('dashboard').description(
    'View dashboard metrics and analytics',
);

dashboardCommand
    .command('som')
    .description('View Share of Model metrics')
    .requiredOption('-p, --project-id <id>', 'Project ID')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching Share of Model metrics...').start();

        try {
            const metrics = await apiCall<ShareOfModelMetrics>(
                client.api.v1.dashboard['share-of-model'].$get({
                    query: { project_id: options.projectId },
                }),
            );
            spinner.succeed('Metrics retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(metrics));
            } else {
                console.log(`\n${chalk.cyan.bold('Share of Model Metrics')}\n`);

                const data = {
                    'Visibility Rate': formatter.percentage(metrics.summary.visibilityRate),
                    'Total Scans': formatter.number(metrics.summary.totalScans),
                    'Visible Scans': formatter.number(metrics.summary.visibleCount),
                    'Avg Sentiment': formatter.sentiment(metrics.summary.avgSentiment),
                    Period: metrics.summary.period,
                };

                console.log(`${table.keyValue(data)}\n`);

                const visibilityColor =
                    metrics.summary.visibilityRate > 0.7
                        ? chalk.green
                        : metrics.summary.visibilityRate > 0.4
                          ? chalk.yellow
                          : chalk.red;

                console.log(
                    `${visibilityColor.bold(
                        `📊 Your brand appears in ${formatter.percentage(metrics.summary.visibilityRate)} of AI responses`,
                    )}\n`,
                );
            }
        } catch (error) {
            spinner.fail('Failed to fetch metrics');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

dashboardCommand
    .command('sentiment')
    .description('View sentiment trends')
    .requiredOption('-p, --project-id <id>', 'Project ID')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching sentiment trends...').start();

        try {
            const metrics = await apiCall<ShareOfModelMetrics>(
                client.api.v1.dashboard['share-of-model'].$get({
                    query: { project_id: options.projectId },
                }),
            );

            // Extract timeline data as trends
            const trends = metrics.timeline || [];
            spinner.succeed('Timeline data retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(trends));
            } else {
                if (trends.length === 0) {
                    console.log(chalk.yellow('\nNo sentiment data available for this project.\n'));
                    return;
                }

                console.log(`\n${chalk.cyan.bold('Sentiment Trends')}\n`);

                const tbl = table.keyValue({
                    'Total Data Points': formatter.number(trends.length),
                    'Date Range': `${trends[trends.length - 1]?.date} to ${trends[0]?.date}`,
                });

                console.log(`${tbl}\n`);

                console.log(`${chalk.cyan('Daily Sentiment:')}\n`);

                trends.slice(0, 10).forEach((trend) => {
                    const sentimentBar = generateSentimentBar(trend.average_sentiment);
                    console.log(
                        `${chalk.gray(trend.date)} ${formatter.sentiment(trend.average_sentiment)} ${sentimentBar} (${trend.scan_count} scans)`,
                    );
                });

                if (trends.length > 10) {
                    console.log(chalk.gray(`\n... and ${trends.length - 10} more entries`));
                }

                console.log('');
            }
        } catch (error) {
            spinner.fail('Failed to fetch sentiment trends');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

dashboardCommand
    .command('citations')
    .description('View top citations')
    .requiredOption('-p, --project-id <id>', 'Project ID')
    .option('-l, --limit <number>', 'Limit number of results', '10')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching top citations...').start();

        try {
            const limit = parseInt(options.limit, 10);
            const response = await apiCall<{
                topDomains: TopCitation[];
                summary: { totalCitations: number; uniqueDomains: number };
            }>(
                client.api.v1.dashboard.citations.$get({
                    query: {
                        project_id: options.projectId,
                        limit: limit.toString(),
                    },
                }),
            );
            const citations = response.topDomains;
            spinner.succeed(
                `Found ${citations.length} top citation source${citations.length === 1 ? '' : 's'}`,
            );

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(citations));
            } else {
                if (citations.length === 0) {
                    console.log(chalk.yellow('\nNo citation data available for this project.\n'));
                    return;
                }

                console.log(`\n${chalk.cyan.bold('Top Citations')}\n`);
                console.log(`${table.topCitations(citations)}\n`);

                const totalCitations = citations.reduce((sum, c) => sum + c.citation_count, 0);
                console.log(
                    `${chalk.blue.bold(
                        `📌 Total citations from top ${citations.length} sources: ${formatter.number(totalCitations)}`,
                    )}\n`,
                );
            }
        } catch (error) {
            spinner.fail('Failed to fetch citations');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

function generateSentimentBar(sentiment: number): string {
    const barLength = 20;
    const normalizedScore = Math.max(-1, Math.min(1, sentiment));
    const position = Math.round(((normalizedScore + 1) / 2) * barLength);

    let bar = '.js';
    for (let i = 0; i < barLength; i++) {
        if (i === position) {
            bar += chalk.white('█');
        } else if (i < barLength / 2) {
            bar += chalk.red('░');
        } else {
            bar += chalk.green('░');
        }
    }

    return `[${bar}]`;
}
