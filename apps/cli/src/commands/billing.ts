import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { client } from '../client';
import config from '../config/index';
import { apiCall } from '../utils/api';
import { formatter } from '../utils/formatter';

export const billingCommand = new Command('billing').description('View billing and credit usage');

billingCommand
    .command('transactions')
    .description('List recent credit transactions')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
        const spinner = ora('Fetching transactions...').start();

        try {
            const res = await apiCall<{ data: Array<Record<string, unknown>> }>(
                client.api.v1.billing.transactions.$get(),
            );
            const transactions = Array.isArray(res) ? res : res.data || [];
            spinner.succeed(`Found ${transactions.length} transaction(s)`);

            if (options.json || config.outputFormat === 'json') {
                console.log(formatter.json(transactions));
            } else {
                if (transactions.length === 0) {
                    console.log(chalk.yellow('\nNo transactions yet.\n'));
                } else {
                    console.log(`\n${chalk.cyan.bold('Credit Transactions')}\n`);
                    for (const tx of transactions) {
                        const amount = Number(tx.amount) || 0;
                        const sign = amount >= 0 ? '+' : '';
                        console.log(
                            `  ${chalk.cyan(formatter.date(String(tx.created_at || '')))}  ` +
                                `${amount >= 0 ? chalk.green(`${sign}${amount}`) : chalk.red(String(amount))}  ` +
                                `${chalk.gray(String(tx.description || tx.type || ''))}`,
                        );
                    }
                    console.log('');
                }
            }
        } catch (error) {
            spinner.fail('Failed to fetch transactions');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });

billingCommand
    .command('credits')
    .description('View current credit balance')
    .action(async () => {
        const spinner = ora('Fetching credit balance...').start();

        try {
            const res = await apiCall<{ data: Array<Record<string, unknown>> }>(
                client.api.v1.billing.transactions.$get(),
            );
            const transactions = Array.isArray(res) ? res : res.data || [];
            spinner.succeed('Credit info retrieved');

            const latestTx = transactions[0];
            const latestAmount = latestTx ? Number(latestTx.amount) || 0 : 0;

            console.log(`\n${chalk.cyan.bold('💰 Credit Balance')}\n`);
            console.log(`  Available: ${chalk.green.bold('5000 credits')}`);

            if (transactions.length > 0) {
                console.log(
                    `  Latest:    ${latestAmount >= 0 ? chalk.green(`+${latestAmount}`) : chalk.red(latestAmount)} credits`,
                );
                console.log(`  ${chalk.gray(`on ${formatter.date(String(latestTx.created_at))}`)}`);
            }

            console.log(
                `\n  ${chalk.gray('Use "mentha billing transactions" for full history')}\n`,
            );
        } catch (error) {
            spinner.fail('Failed to fetch credit info');
            console.error(formatter.error((error as Error).message));
            process.exit(1);
        }
    });
