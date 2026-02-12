import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import config from '../config/index';
import apiClient from '../services/api-client';
import { formatter } from '../utils/formatter';
import { prompt } from '../utils/prompt';
import { table } from '../utils/table';

export const keywordsCommand = new Command('keywords').description('Manage keywords');

keywordsCommand
    .command('list')
    .description('List keywords')
    .option('-p, --project-id <id>', 'Filter by project ID')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching keywords...').start();

        try {
            const keywords = await apiClient.keywords.list(options.projectId);
            spinner.succeed(`Found ${keywords.length} keyword(s)`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(keywords));
            } else {
                if (keywords.length === 0) {
                    console.log(
                        chalk.yellow(
                            '\nNo keywords found. Create one with: mentha keywords create\n',
                        ),
                    );
                } else {
                    console.log(`\n${table.keywords(keywords)}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch keywords');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

keywordsCommand
    .command('create')
    .description('Create a new keyword')
    .option('-p, --project-id <id>', 'Project ID')
    .option('-q, --query <text>', 'Search query')
    .option(
        '-i, --intent <type>',
        'Intent type (informational, transactional, navigational, commercial)',
    )
    .option('-f, --frequency <freq>', 'Scan frequency (daily, weekly, manual)')
    .option('-e, --engines <engines>', 'Engines (comma-separated)')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        let keywordData;

        if (options.projectId && options.query) {
            const engines = options.engines
                ? options.engines.split(',').map((e: string) => e.trim())
                : ['perplexity'];

            keywordData = {
                project_id: options.projectId,
                query: options.query,
                intent: options.intent || 'informational',
                scan_frequency: options.frequency || 'weekly',
                engines,
            };
        } else {
            let projectId = options.projectId;

            if (!projectId) {
                projectId = await prompt.input('Project ID:', undefined, (input: string) => {
                    if (!input) return 'Project ID is required.js';
                    return true;
                });
            }

            console.log(chalk.cyan('\n📝 Create a new keyword\n'));
            keywordData = await prompt.createKeyword(projectId);
        }

        const spinner = ora('Creating keyword...').start();

        try {
            const keyword = await apiClient.keywords.create(keywordData);
            spinner.succeed('Keyword created successfully');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(keyword));
            } else {
                console.log(`\n${table.keywords([keyword])}\n`);
                console.log(formatter.success(`Keyword ID: ${keyword.id}`));
            }
        } catch (error) {
            spinner.fail('Failed to create keyword');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

keywordsCommand
    .command('delete <id>')
    .description('Delete a keyword')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (id, options) => {
        if (!options.yes) {
            const confirmed = await prompt.confirm(
                `Are you sure you want to delete keyword ${id}?`,
                false,
            );

            if (!confirmed) {
                console.log(chalk.yellow('\nDeletion cancelled.\n'));
                return;
            }
        }

        const spinner = ora('Deleting keyword...').start();

        try {
            await apiClient.keywords.delete(id);
            spinner.succeed('Keyword deleted successfully');
        } catch (error) {
            spinner.fail('Failed to delete keyword');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
