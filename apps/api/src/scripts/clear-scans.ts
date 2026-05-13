import 'dotenv/config';
import { db } from '../db/index';
import { scanRuns, scanJobs, scanResults, citations } from '../db/schema/core';

async function main() {
    console.log('Clearing scan data...');
    try {
        await db.delete(citations);
        await db.delete(scanResults);
        await db.delete(scanJobs);
        await db.delete(scanRuns);
        console.log('Successfully cleared scan data.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
}

main();
