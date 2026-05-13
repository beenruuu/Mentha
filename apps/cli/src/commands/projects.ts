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

export const projectsCommand = new Command('projects').description('Manage projects');

projectsCommand
    .command('list')
    .description('List all projects')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching projects...').start();

        try {
            const projects = await apiCall<Project[]>(client.api.v1.projects.$get());
            spinner.succeed(`Found ${projects.length} project(s)`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(projects));
            } else {
                if (projects.length === 0) {
                    console.log(
                        chalk.yellow(
                            '\nNo projects found. Create one with: mentha projects create\n',
                        ),
                    );
                } else {
                    console.log(`\n${table.projects(projects)}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch projects');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

projectsCommand
    .command('create')
    .description('Create a new project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --domain <url>', 'Domain URL')
    .option('-c, --competitors <urls>', 'Competitor URLs (comma-separated)')
    .option('--description <text>', 'Project description')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        let projectData;

        if (options.name && options.domain) {
            const competitors = options.competitors
                ? options.competitors.split(',').map((url: string) => url.trim())
                : [];

            projectData = {
                name: options.name,
                domain: options.domain,
                competitors,
                description: options.description,
            };
        } else {
            console.log(chalk.cyan('\n📝 Create a new project\n'));
            projectData = await prompt.createProject();
        }

        const spinner = ora('Creating project...').start();

        try {
            const project = await apiCall<Project>(
                client.api.v1.projects.$post({
                    json: projectData,
                }),
            );
            spinner.succeed('Project created successfully');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(project));
            } else {
                console.log(`\n${table.projectDetails(project)}\n`);
                console.log(formatter.success(`Project ID: ${project.id}`));
            }
        } catch (error) {
            spinner.fail('Failed to create project');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

projectsCommand
    .command('get <id>')
    .description('Get project details')
    .option('-j, --json', 'Output as JSON')
    .action(async (id, options) => {
        const spinner = ora('Fetching project...').start();

        try {
            const project = await apiCall<Project>(
                client.api.v1.projects[':id'].$get({
                    param: { id },
                }),
            );
            spinner.succeed('Project retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(project));
            } else {
                console.log(`\n${table.projectDetails(project)}\n`);
            }
        } catch (error) {
            spinner.fail('Failed to fetch project');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

projectsCommand
    .command('update <id>')
    .description('Update a project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --domain <url>', 'Domain URL')
    .option('-c, --competitors <urls>', 'Competitor URLs (comma-separated)')
    .option('--description <text>', 'Project description')
    .option('-j, --json', 'Output as JSON')
    .action(async (id, options) => {
        let updateData: Record<string, unknown> = {};

        if (options.name || options.domain || options.competitors || options.description) {
            if (options.name) updateData.name = options.name;
            if (options.domain) updateData.domain = options.domain;
            if (options.competitors) {
                updateData.competitors = options.competitors
                    .split(',')
                    .map((url: string) => url.trim());
            }
            if (options.description) updateData.description = options.description;
        } else {
            const spinner = ora('Fetching current project data...').start();
            try {
                const currentProject = await apiCall<Project>(
                    client.api.v1.projects[':id'].$get({
                        param: { id },
                    }),
                );
                spinner.stop();

                console.log(chalk.cyan('\n✏️  Update project\n'));
                const prompts = await prompt.updateProject({
                    name: currentProject.name,
                    domain: currentProject.domain,
                    competitors: currentProject.competitors || [],
                    description: currentProject.description,
                });

                updateData = Object.fromEntries(
                    Object.entries(prompts).filter(([, value]) => value !== undefined),
                );

                if (Object.keys(updateData).length === 0) {
                    console.log(chalk.yellow('\nNo changes made.\n'));
                    return;
                }
            } catch (error) {
                spinner.fail('Failed to fetch project');
                console.error(formatter.error((error as Error).message));
                process.exit(1);
            }
        }

        const spinner = ora('Updating project...').start();

        try {
            const project = await apiCall<Project>(
                client.api.v1.projects[':id'].$patch({
                    param: { id },
                    json: updateData,
                } as any),
            );
            spinner.succeed('Project updated successfully');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(project));
            } else {
                console.log(`\n${table.projectDetails(project)}\n`);
            }
        } catch (error) {
            spinner.fail('Failed to update project');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

projectsCommand
    .command('delete <id>')
    .description('Delete a project')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (id, options) => {
        if (!options.yes) {
            const confirmed = await prompt.confirm(
                `Are you sure you want to delete project ${id}?`,
                false,
            );

            if (!confirmed) {
                console.log(chalk.yellow('\nDeletion cancelled.\n'));
                return;
            }
        }

        const spinner = ora('Deleting project...').start();

        try {
            await client.api.v1.projects[':id'].$delete({
                param: { id },
            });
            spinner.succeed('Project deleted successfully');
        } catch (error) {
            spinner.fail('Failed to delete project');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

projectsCommand
    .command('analyze [domain]')
    .description('Analyze a domain and create a project (interactive onboarding)')
    .option('-j, --json', 'Output as JSON')
    .action(async (domain, options) => {
        if (!domain) {
            domain = await prompt.input('Enter your website URL:', 'https://');
        }

        let formattedDomain = domain;
        if (!formattedDomain.startsWith('http')) {
            formattedDomain = 'https://' + formattedDomain;
        }

        const spinner = ora(`Analyzing ${formattedDomain}...`).start();

        try {
            const result = await apiCall<{
                name: string;
                description: string;
                keywords: string[];
                competitors: string[];
            }>(
                client.api.v1.projects.analyze.$post({
                    json: { domain: formattedDomain },
                }),
            );

            spinner.succeed('Domain analyzed successfully');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(result));
                return;
            }

            console.log(`\n${chalk.cyan.bold('Analysis Results')}\n`);
            console.log(`${chalk.bold('Brand:')} ${chalk.green(result.name)}`);

            if (result.description) {
                console.log(`\n${chalk.bold('Description:')} ${result.description}`);
            }

            if (result.keywords.length > 0) {
                console.log(`\n${chalk.bold('Suggested Prompts:')}`);
                result.keywords.forEach((kw: string) => {
                    console.log(`  ${chalk.yellow('#')} ${kw}`);
                });
            }

            if (result.competitors.length > 0) {
                console.log(`\n${chalk.bold('Identified Competitors:')}`);
                result.competitors.forEach((comp: string) => {
                    console.log(`  ${chalk.red('◉')} ${comp}`);
                });
            }

            console.log('');
            const create = await prompt.confirm(
                `Create project "${result.name}" and start tracking?`,
                true,
            );

            if (!create) {
                console.log(chalk.yellow('\nProject creation cancelled.\n'));
                return;
            }

            const createSpinner = ora('Creating project...').start();

            const project = await apiCall<Project>(
                client.api.v1.projects.$post({
                    json: {
                        name: result.name,
                        domain: formattedDomain,
                        description: result.description,
                        competitors: result.competitors,
                    },
                }),
            );

            createSpinner.succeed('Project created successfully');

            if (result.keywords.length > 0) {
                const kwSpinner = ora('Adding suggested keywords...').start();
                try {
                    await Promise.all(
                        result.keywords.map((kw: string) =>
                            client.api.v1.keywords.$post({
                                json: {
                                    project_id: project.id,
                                    query: kw,
                                    engines: ['perplexity', 'openai', 'gemini', 'claude'],
                                },
                            }),
                        ),
                    );
                    kwSpinner.succeed(`${result.keywords.length} keywords added`);
                } catch {
                    kwSpinner.fail('Failed to add some keywords');
                }
            }

            const scanNow = await prompt.confirm('Trigger initial scan now?', true);

            if (scanNow) {
                const scanSpinner = ora('Triggering initial scan...').start();
                try {
                    const scanRes = await apiCall<{ runId: string; jobCount: number }>(
                        client.api.v1.scans.trigger.$post({
                            query: { project_id: project.id },
                        }),
                    );
                    scanSpinner.succeed(
                        `Scan started with ${scanRes.jobCount} queries across all engines`,
                    );
                } catch {
                    scanSpinner.fail('Failed to trigger scan');
                }
            }

            console.log(`\n${formatter.success(`Project "${project.name}" is ready!`)}`);
            console.log(`  ${chalk.cyan('ID:')} ${project.id}`);
            console.log(`  ${chalk.cyan('Web:')} http://localhost:3000/dashboard\n`);
        } catch (error) {
            spinner.fail('Failed to analyze domain');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
