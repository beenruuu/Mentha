import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { client } from '../client';
import config from '../config/index';
import type { TopCitation } from '../types';
import { apiCall } from '../utils/api';
import { formatter } from '../utils/formatter';
import { table } from '../utils/table';

export const authorityCommand = new Command('authority').description(
    'View citation authority analytics',
);

authorityCommand
    .command('citations')
    .description('View top cited domains and citation sources')
    .requiredOption('-p, --project-id <id>', 'Project ID')
    .option('-l, --limit <number>', 'Limit results', '10')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching citation analysis...').start();

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
            spinner.succeed('Citation analysis retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(response));
            } else {
                console.log(`\n${chalk.cyan.bold('Citation Authority')}\n`);

                const { summary } = response;
                console.log(
                    `${table.keyValue({
                        'Total Citations': formatter.number(summary.totalCitations),
                        'Unique Domains': formatter.number(summary.uniqueDomains),
                    })}\n`,
                );

                if (response.topDomains.length > 0) {
                    console.log(`${chalk.cyan('Top Cited Domains:')}\n`);
                    console.log(`${table.topCitations(response.topDomains)}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch citation analysis');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

authorityCommand
    .command('overview')
    .description('Quick authority overview')
    .requiredOption('-p, --project-id <id>', 'Project ID')
    .action(async (options) => {
        const spinner = ora('Fetching authority overview...').start();

        try {
            const response = await apiCall<{
                topDomains: TopCitation[];
                summary: { totalCitations: number; uniqueDomains: number };
            }>(
                client.api.v1.dashboard.citations.$get({
                    query: { project_id: options.projectId, limit: '5' },
                }),
            );
            spinner.succeed('Authority overview retrieved');

            const { summary } = response;
            console.log(`\n${chalk.cyan.bold('📊 Authority Snapshot')}\n`);
            console.log(`  Citations: ${chalk.bold(formatter.number(summary.totalCitations))}`);
            console.log(`  Domains:   ${chalk.bold(formatter.number(summary.uniqueDomains))}`);

            const brandCount = response.topDomains.filter((d) => d.citation_count > 1).length;
            if (brandCount > 0) {
                console.log(`\n  ${chalk.green(`Top domains: ${brandCount}`)}`);
            }
            console.log('');
        } catch (error) {
            spinner.fail('Failed to fetch authority overview');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
