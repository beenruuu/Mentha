import chalk from 'chalk';
import { Command } from 'commander';

import { client } from './client';
import { authorityCommand } from './commands/authority';
import { billingCommand } from './commands/billing';
import { configCommand } from './commands/config';
import { dashboardCommand } from './commands/dashboard';
import { keywordsCommand } from './commands/keywords';
import { knowledgeGraphCommand } from './commands/knowledge-graph';
import { optimizationCommand } from './commands/optimization';
import { projectsCommand } from './commands/projects';
import { scansCommand } from './commands/scans';
import { searchCommand } from './commands/search';
import { settingsCommand } from './commands/settings';
import config from './config/index';
import { handleResponse } from './utils/api';
import { formatter } from './utils/formatter';

const program = new Command();

program
    .name('mentha')
    .description('🌿 Mentha CLI - AEO/GEO Intelligence Platform')
    .version('1.0.0');

program
    .command('health')
    .description('Check API server health')
    .action(async () => {
        try {
            const response = await client.health.$get();
            const health = await handleResponse<{ status: string; timestamp: string }>(response);
            console.log(formatter.success(`API is healthy (${health.status})`));
            console.log(chalk.gray(`Server time: ${health.timestamp}`));
            console.log(chalk.gray(`API URL: ${config.apiBaseUrl}`));
        } catch (error) {
            console.error(formatter.error('API health check failed'));
            console.error(formatter.error((error as Error).message));
            console.log(
                chalk.yellow(`\nMake sure the API server is running at: ${config.apiBaseUrl}`),
            );
            process.exit(1);
        }
    });

// Core platform commands - order matches web sidebar
program.addCommand(dashboardCommand);
program.addCommand(keywordsCommand);
program.addCommand(authorityCommand);
program.addCommand(optimizationCommand);
program.addCommand(billingCommand);
program.addCommand(configCommand);
program.addCommand(settingsCommand);

// Management commands
program.addCommand(projectsCommand);
program.addCommand(scansCommand);

// AI / Utility commands
program.addCommand(searchCommand);
program.addCommand(knowledgeGraphCommand);

program.on('--help', () => {
    console.log('');
    console.log(chalk.cyan.bold('🌿 Mentha CLI'));
    console.log('');
    console.log('Examples:');
    console.log('  $ mentha health');
    console.log('  $ mentha dashboard som --project-id <id>');
    console.log('  $ mentha keywords list --project-id <id>');
    console.log('  $ mentha authority citations --project-id <id>');
    console.log('  $ mentha optimization overview');
    console.log('  $ mentha projects analyze <url>');
    console.log('  $ mentha search query "best toys for kids"');
    console.log('');
    console.log('Configuration:');
    console.log(`  API URL: ${chalk.green(config.apiBaseUrl)}`);
    console.log(`  Output Format: ${chalk.green(config.outputFormat)}`);
    console.log('');
});

if (process.argv.length === 2) {
    console.log(chalk.cyan.bold('\n🌿 Welcome to Mentha CLI\n'));
    console.log(
        'An interactive command-line interface for the Mentha AEO/GEO Intelligence Platform.\n',
    );
    console.log(`API URL: ${chalk.green(config.apiBaseUrl)}\n`);
    console.log('Available commands:');
    console.log(`  ${chalk.yellow('dashboard')}     - Share of Model, sentiment & citations`);
    console.log(`  ${chalk.yellow('keywords')}      - Manage tracked keywords`);
    console.log(`  ${chalk.yellow('authority')}     - Citation authority analytics`);
    console.log(`  ${chalk.yellow('optimization')}  - Knowledge Graph optimization`);
    console.log(`  ${chalk.yellow('billing')}       - Credits and transactions`);
    console.log(`  ${chalk.yellow('settings')}      - Project config and preferences`);
    console.log(`  ${chalk.yellow('projects')}      - Analyze, create, update & delete`);
    console.log(`  ${chalk.yellow('scans')}         - View scan results`);
    console.log(`  ${chalk.yellow('search')}        - AI search, chat & providers`);
    console.log(`  ${chalk.yellow('health')}        - Check API server health`);
    console.log(`  ${chalk.yellow('kg')}            - Knowledge Graph (alias)`);
    console.log('');
    console.log(chalk.cyan('🤖 AI Features:'));
    console.log('  mentha search query "your question"  - Ask AI anything');
    console.log('  mentha search interactive            - Interactive search mode');
    console.log('  mentha search chat                   - Chat with AI');
    console.log('');
    console.log(`Use ${chalk.cyan('mentha --help')} for more information.`);
    console.log(`Use ${chalk.cyan('mentha <command> --help')} for command-specific help.\n`);
} else {
    program.parse(process.argv);
}
