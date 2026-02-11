import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import apiClient from '../services/api-client';
import { formatter } from '../utils/formatter';
import { table } from '../utils/table';
import { prompt } from '../utils/prompt';
import config from '../config/index';

export const projectsCommand = new Command('projects')
    .description('Manage projects');

projectsCommand
    .command('list')
    .description('List all projects')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching projects...').start();

        try {
            const projects = await apiClient.projects.list();
            spinner.succeed(`Found ${projects.length} project(s)`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(projects));
            } else {
                if (projects.length === 0) {
                    console.log(chalk.yellow('\nNo projects found. Create one with: mentha projects create\n'));
                } else {
                    console.log('\n' + table.projects(projects) + '\n');
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
            const project = await apiClient.projects.create(projectData);
            spinner.succeed('Project created successfully');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(project));
            } else {
                console.log('\n' + table.projectDetails(project) + '\n');
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
            const project = await apiClient.projects.get(id);
            spinner.succeed('Project retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(project));
            } else {
                console.log('\n' + table.projectDetails(project) + '\n');
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
                const currentProject = await apiClient.projects.get(id);
                spinner.stop();

                console.log(chalk.cyan('\n✏️  Update project\n'));
                const prompts = await prompt.updateProject({
                    name: currentProject.name,
                    domain: currentProject.domain,
                    competitors: currentProject.competitors || [],
                    description: currentProject.description,
                });

                updateData = Object.fromEntries(
                    Object.entries(prompts).filter(([, value]) => value !== undefined)
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
            const project = await apiClient.projects.update(id, updateData);
            spinner.succeed('Project updated successfully');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(project));
            } else {
                console.log('\n' + table.projectDetails(project) + '\n');
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
                false
            );

            if (!confirmed) {
                console.log(chalk.yellow('\nDeletion cancelled.\n'));
                return;
            }
        }

        const spinner = ora('Deleting project...').start();

        try {
            await apiClient.projects.delete(id);
            spinner.succeed('Project deleted successfully');
        } catch (error) {
            spinner.fail('Failed to delete project');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
