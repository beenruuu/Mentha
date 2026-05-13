import 'dotenv/config';
import { db } from '../db/index';
import { projects } from '../db/schema/core';
import { getScanService } from '../services/scan.service';

async function main() {
    console.log('Triggering new scan...');
    try {
        const allProjects = await db.select().from(projects).limit(1);
        if (allProjects.length === 0) {
            console.log('No projects found to scan.');
            process.exit(0);
        }
        const projectId = allProjects[0].id;
        console.log(`Triggering scan for project: ${projectId}`);
        const scanService = getScanService();
        const result = await scanService.triggerProjectScan(projectId);
        console.log('Successfully triggered scan:', result);
        process.exit(0);
    } catch (error) {
        console.error('Error triggering scan:', error);
        process.exit(1);
    }
}

main();
