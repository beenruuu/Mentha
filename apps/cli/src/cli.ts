import { Command } from 'commander';
import chalk from 'chalk';
import { projectsCommand } from './commands/projects';
import { keywordsCommand } from './commands/keywords';
import { scansCommand } from './commands/scans';
import { searchCommand } from './commands/search';
import { knowledgeGraphCommand } from './commands/knowledge-graph';
import { dashboardCommand } from './commands/dashboard';
import apiClient from './services/api-client';
import { formatter } from './utils/formatter';
import config from './config/index';

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
            const health = await apiClient.health.check();
            console.log(formatter.success(`API is healthy (${health.status})`));
            console.log(chalk.gray(`Server time: ${health.timestamp}`));
            console.log(chalk.gray(`API URL: ${config.apiBaseUrl}`));
        } catch (error) {
            console.error(formatter.error('API health check failed'));
            console.error(formatter.error((error as Error).message));
            console.log(chalk.yellow(`\nMake sure the API server is running at: ${config.apiBaseUrl}`));
            process.exit(1);
        }
    });

program.addCommand(projectsCommand);
program.addCommand(keywordsCommand);
program.addCommand(scansCommand);
program.addCommand(searchCommand);
program.addCommand(knowledgeGraphCommand);
program.addCommand(dashboardCommand);

program.on('--help', () => {
    console.log('');
    console.log(chalk.cyan.bold('🌿 Mentha CLI'));
    console.log('');
    console.log('Examples:');
    console.log('  $ mentha health');
    console.log('  $ mentha projects list');
    console.log('  $ mentha projects create');
    console.log('  $ mentha keywords list --project-id <id>');
    console.log('  $ mentha search query "best toys for kids"');
    console.log('  $ mentha search interactive');
    console.log('  $ mentha dashboard som --project-id <id>');
    console.log('');
    console.log('Configuration:');
    console.log(`  API URL: ${chalk.green(config.apiBaseUrl)}`);
    console.log(`  Output Format: ${chalk.green(config.outputFormat)}`);
    console.log('');
});

if (process.argv.length === 2) {
    console.log(chalk.cyan.bold('\n🌿 Welcome to Mentha CLI\n'));
    console.log('An interactive command-line interface for the Mentha AEO/GEO Intelligence Platform.\n');
    console.log(`API URL: ${chalk.green(config.apiBaseUrl)}\n`);
    console.log('Available commands:');
    console.log('  ' + chalk.yellow('health') + '          - Check API server health');
    console.log('  ' + chalk.yellow('projects') + '        - Manage projects');
    console.log('  ' + chalk.yellow('keywords') + '        - Manage keywords');
    console.log('  ' + chalk.yellow('scans') + '           - View scan results');
    console.log('  ' + chalk.yellow('search') + '          - AI search & chat (NEW! 🤖)');
    console.log('  ' + chalk.yellow('kg') + '              - Manage Knowledge Graph');
    console.log('  ' + chalk.yellow('dashboard') + '       - View metrics and analytics');
    console.log('');
    console.log(chalk.cyan('🤖 AI Features:'));
    console.log('  mentha search query "your question"  - Ask AI anything');
    console.log('  mentha search interactive            - Interactive search mode');
    console.log('  mentha search chat                   - Chat with AI');
    console.log('');
    console.log('Use ' + chalk.cyan('mentha --help') + ' for more information.');
    console.log('Use ' + chalk.cyan('mentha <command> --help') + ' for command-specific help.\n');
} else {
    program.parse(process.argv);
}
