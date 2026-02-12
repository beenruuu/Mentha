import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import config from '../config/index';
import apiClient from '../services/api-client';
import { formatter } from '../utils/formatter';
import { table } from '../utils/table';

export const knowledgeGraphCommand = new Command('kg')
    .description('Manage Knowledge Graph entities and claims')
    .alias('knowledge-graph');

knowledgeGraphCommand
    .command('entities')
    .description('List all entities in the Knowledge Graph')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching entities...').start();

        try {
            const entities = await apiClient.knowledgeGraph.entities();
            spinner.succeed(`Found ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(entities));
            } else {
                if (entities.length === 0) {
                    console.log(chalk.yellow('\nNo entities found in the Knowledge Graph.\n'));
                } else {
                    console.log(`\n${table.entities(entities)}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch entities');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

knowledgeGraphCommand
    .command('entity <id>')
    .description('Get detailed information about an entity')
    .option('-j, --json', 'Output as JSON')
    .action(async (id, options) => {
        const spinner = ora('Fetching entity details...').start();

        try {
            const entity = await apiClient.knowledgeGraph.entity(id);
            spinner.succeed('Entity retrieved');

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(entity));
            } else {
                console.log(`\n${table.entityDetails(entity)}\n`);
            }
        } catch (error) {
            spinner.fail('Failed to fetch entity');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

knowledgeGraphCommand
    .command('claims <entity-id>')
    .description('List claims for an entity')
    .option('-j, --json', 'Output as JSON')
    .action(async (entityId, options) => {
        const spinner = ora('Fetching claims...').start();

        try {
            const claims = await apiClient.knowledgeGraph.claims(entityId);
            spinner.succeed(`Found ${claims.length} claim${claims.length === 1 ? '' : 's'}`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(claims));
            } else {
                if (claims.length === 0) {
                    console.log(chalk.yellow('\nNo claims found for this entity.\n'));
                } else {
                    console.log(`\n${table.claims(claims)}\n`);
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch claims');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
