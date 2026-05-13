#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const searchPaths = [
    path.resolve(__dirname, '../node_modules/.bin/tsx'),
    path.resolve(__dirname, '../../node_modules/.bin/tsx'),
    path.resolve(__dirname, '../../../node_modules/.bin/tsx'),
];

function findTsx() {
    for (const p of searchPaths) {
        for (const ext of ['', '.CMD', '.cmd', '.ps1']) {
            const candidate = p + ext;
            if (fs.existsSync(candidate)) return candidate;
        }
    }
    return null;
}

const tsxPath = findTsx();

if (!tsxPath) {
    console.error('Error: tsx not found. Run "pnpm install" first.');
    process.exit(1);
}

const cliPath = path.resolve(__dirname, '../src/cli.ts');
const result = spawnSync(tsxPath, [cliPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname, '..'),
});

process.exit(result.status);
