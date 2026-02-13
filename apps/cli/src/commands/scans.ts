import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { client } from '../client';
import config from '../config/index';
import type { ScanResult } from '../types';
import { apiCall } from '../utils/api';
import { formatter } from '../utils/formatter';
import { table } from '../utils/table';

export const scansCommand = new Command('scans').description('View scan results');

scansCommand
    .command('list')
    .description('List scan results for a project')
    .requiredOption('-p, --project-id <id>', 'Project ID')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching scan results...').start();

        try {
            const limit = parseInt(options.limit, 10);
            const scans = await apiCall<ScanResult[]>(
                client.api.v1.scans.$get({
                    query: {
                        project_id: options.projectId,
                        limit: limit.toString(),
                    },
                }),
            );
            spinner.succeed(`Found ${scans.length} scan result(s)`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(scans));
            } else {
                if (scans.length === 0) {
                    console.log(chalk.yellow('\nNo scan results found for this project.\n'));
                } else {
                    console.log(`\n${table.scans(scans)}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch scan results');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

scansCommand
    .command('get <id>')
    .description('Get detailed scan result')
    .option('-j, --json', 'Output as JSON')
    .action(async (id, options) => {
        const spinner = ora('Fetching scan result...').start();

        try {
            const scan = await apiCall<ScanResult>(
                client.api.v1.scans[':id'].$get({
                    param: { id },
                }),
            );
            spinner.succeed('Scan result retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(scan));
            } else {
                console.log(`\n${table.scanDetails(scan)}\n`);

                console.log(chalk.cyan('Full Response:'));
                console.log(chalk.gray('─'.repeat(100)));
                console.log(scan.raw_response);
                console.log(`${chalk.gray('─'.repeat(100))}\n`);

                if (scan.analysis_json && Object.keys(scan.analysis_json).length > 0) {
                    console.log(chalk.cyan('Analysis Data:'));
                    console.log(`${formatter.json(scan.analysis_json)}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch scan result');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
