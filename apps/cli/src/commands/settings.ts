import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { client } from '../client';
import config from '../config/index';
import type { Project } from '../types';
import { apiCall } from '../utils/api';
import { formatter } from '../utils/formatter';
import { prompt } from '../utils/prompt';
import { table } from '../utils/table';

export const settingsCommand = new Command('settings').description(
    'View and manage project settings',
);

settingsCommand
    .command('project <id>')
    .description('View project settings and configuration')
    .option('-j, --json', 'Output as JSON')
    .action(async (id, options) => {
        const spinner = ora('Fetching project settings...').start();

        try {
            const project = await apiCall<Project>(
                client.api.v1.projects[':id'].$get({ param: { id } }),
            );

            const healthRes = await fetch(`${config.apiBaseUrl}/health`);
            const health = healthRes.ok ? await healthRes.json() : null;

            spinner.succeed('Project settings retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json({ project, health }));
            } else {
                console.log(`\n${chalk.cyan.bold('⚙️  Project Settings')}\n`);
                console.log(`${table.projectDetails(project)}\n`);

                if (health) {
                    console.log(`${chalk.cyan('System Health:')}\n`);
                    const h = health as Record<string, unknown>;
                    console.log(
                        `${table.keyValue({
                            Status: String(h.status || 'unknown'),
                            Uptime: h.uptime ? `${Math.round(Number(h.uptime) / 60)}min` : 'N/A',
                            Version: String(h.version || 'N/A'),
                        })}\n`,
                    );
                }

                console.log(
                    `${chalk.gray('Use "mentha settings theme <light|dark>" to change theme')}\n`,
                );
            }
        } catch (error) {
            spinner.fail('Failed to fetch settings');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

settingsCommand
    .command('theme <mode>')
    .description('Set CLI theme (light/dark)')
    .action((mode) => {
        if (mode !== 'light' && mode !== 'dark') {
            console.error(formatter.error('Theme must be "light" or "dark"'));
            process.exit(1);
        }

        console.log(
            `${formatter.success(`Theme set to ${mode}`)} ${chalk.gray('(applies to current terminal session)')}`,
        );
    });

settingsCommand
    .command('health')
    .description('View system health status')
    .action(async () => {
        const spinner = ora('Checking system health...').start();

        try {
            const healthRes = await fetch(`${config.apiBaseUrl}/health`);
            const health = healthRes.ok ? await healthRes.json() : null;
            spinner.succeed('Health check complete');

            if (health) {
                const h = health as Record<string, unknown>;
                console.log(`\n${chalk.cyan.bold('🩺 System Health')}\n`);
                console.log(
                    `${table.keyValue({
                        Status: String(h.status || 'unknown'),
                        Uptime: h.uptime ? `${Math.round(Number(h.uptime) / 60)}min` : 'N/A',
                        Version: String(h.version || 'N/A'),
                        Timestamp: String(h.timestamp || 'N/A'),
                    })}\n`,
                );
            }
        } catch (error) {
            spinner.fail('Health check failed');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

settingsCommand
    .command('delete <id>')
    .description('Delete a project (Danger Zone)')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (id, options) => {
        if (!options.yes) {
            console.log(chalk.red.bold('\n⚠️  DANGER ZONE\n'));
            const confirmed = await prompt.confirm(
                `Are you sure you want to permanently delete project ${id}?`,
                false,
            );

            if (!confirmed) {
                console.log(chalk.yellow('\nDeletion cancelled.\n'));
                return;
            }
        }

        const spinner = ora('Deleting project...').start();

        try {
            await client.api.v1.projects[':id'].$delete({ param: { id } });
            spinner.succeed('Project deleted permanently');
        } catch (error) {
            spinner.fail('Failed to delete project');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
