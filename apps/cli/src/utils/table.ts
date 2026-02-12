import chalk from 'chalk';
import Table from 'cli-table3';

import type { Claim, Entity, Keyword, Project, ScanResult, TopCitation } from '../types/index';
import { formatter } from './formatter';

export const table = {
    /**
     * Render projects table
     */
    projects: (projects: Project[]): string => {
        const tbl = new Table({
            head: [
                chalk.cyan('ID'),
                chalk.cyan('Name'),
                chalk.cyan('Domain'),
                chalk.cyan('Competitors'),
                chalk.cyan('Created'),
            ],
            colWidths: [10, 25, 30, 20, 15],
            wordWrap: true,
        });

        projects.forEach((project) => {
            tbl.push([
                formatter.truncate(project.id, 8),
                project.name,
                formatter.domain(project.domain),
                project.competitors?.length.toString() || '0',
                formatter.date(project.created_at),
            ]);
        });

        return tbl.toString();
    },

    /**
     * Render project details
     */
    projectDetails: (project: Project): string => {
        const tbl = new Table({
            colWidths: [20, 80],
        });

        tbl.push(
            [chalk.cyan('ID'), project.id],
            [chalk.cyan('Name'), project.name],
            [chalk.cyan('Domain'), project.domain],
            [chalk.cyan('Competitors'), project.competitors?.join(', ') || 'None'],
            [chalk.cyan('Description'), project.description || 'N/A'],
            [chalk.cyan('Created'), new Date(project.created_at).toLocaleString()],
            [chalk.cyan('Updated'), new Date(project.updated_at).toLocaleString()],
        );

        return tbl.toString();
    },

    /**
     * Render keywords table
     */
    keywords: (keywords: Keyword[]): string => {
        const tbl = new Table({
            head: [
                chalk.cyan('ID'),
                chalk.cyan('Query'),
                chalk.cyan('Intent'),
                chalk.cyan('Frequency'),
                chalk.cyan('Engines'),
                chalk.cyan('Created'),
            ],
            colWidths: [10, 30, 18, 12, 20, 15],
            wordWrap: true,
        });

        keywords.forEach((keyword) => {
            tbl.push([
                formatter.truncate(keyword.id, 8),
                keyword.query,
                formatter.intent(keyword.intent),
                formatter.frequency(keyword.scan_frequency),
                keyword.engines.join(', '),
                formatter.date(keyword.created_at),
            ]);
        });

        return tbl.toString();
    },

    /**
     * Render scan results table
     */
    scans: (scans: ScanResult[]): string => {
        const tbl = new Table({
            head: [
                chalk.cyan('ID'),
                chalk.cyan('Query'),
                chalk.cyan('Engine'),
                chalk.cyan('Visibility'),
                chalk.cyan('Sentiment'),
                chalk.cyan('Type'),
                chalk.cyan('Date'),
            ],
            colWidths: [10, 25, 12, 14, 12, 22, 15],
            wordWrap: true,
        });

        scans.forEach((scan) => {
            tbl.push([
                formatter.truncate(scan.id, 8),
                scan.scan_jobs?.keywords?.query || 'N/A',
                scan.scan_jobs?.engine || 'N/A',
                formatter.visibility(scan.brand_visibility),
                formatter.sentiment(scan.sentiment_score),
                formatter.recommendationType(scan.recommendation_type),
                formatter.date(scan.created_at),
            ]);
        });

        return tbl.toString();
    },

    /**
     * Render scan details
     */
    scanDetails: (scan: ScanResult): string => {
        const tbl = new Table({
            colWidths: [20, 80],
        });

        tbl.push(
            [chalk.cyan('ID'), scan.id],
            [chalk.cyan('Brand Visibility'), formatter.visibility(scan.brand_visibility)],
            [chalk.cyan('Sentiment Score'), formatter.sentiment(scan.sentiment_score)],
            [
                chalk.cyan('Recommendation Type'),
                formatter.recommendationType(scan.recommendation_type),
            ],
            [chalk.cyan('Created'), new Date(scan.created_at).toLocaleString()],
            [chalk.cyan('Raw Response'), chalk.gray(formatter.truncate(scan.raw_response, 200))],
        );

        return tbl.toString();
    },

    /**
     * Render entities table
     */
    entities: (entities: Entity[]): string => {
        const tbl = new Table({
            head: [
                chalk.cyan('ID'),
                chalk.cyan('Name'),
                chalk.cyan('Type'),
                chalk.cyan('Description'),
                chalk.cyan('Created'),
            ],
            colWidths: [10, 25, 15, 35, 15],
            wordWrap: true,
        });

        entities.forEach((entity) => {
            tbl.push([
                formatter.truncate(entity.id, 8),
                entity.name,
                entity.type,
                formatter.truncate(entity.description || 'N/A', 32),
                formatter.date(entity.created_at),
            ]);
        });

        return tbl.toString();
    },

    /**
     * Render entity details
     */
    entityDetails: (entity: Entity): string => {
        const tbl = new Table({
            colWidths: [20, 80],
        });

        tbl.push(
            [chalk.cyan('ID'), entity.id],
            [chalk.cyan('Name'), entity.name],
            [chalk.cyan('Type'), entity.type],
            [chalk.cyan('Description'), entity.description || 'N/A'],
            [chalk.cyan('Created'), new Date(entity.created_at).toLocaleString()],
        );

        return tbl.toString();
    },

    /**
     * Render claims table
     */
    claims: (claims: Claim[]): string => {
        const tbl = new Table({
            head: [
                chalk.cyan('ID'),
                chalk.cyan('Claim'),
                chalk.cyan('Source'),
                chalk.cyan('Created'),
            ],
            colWidths: [10, 50, 30, 15],
            wordWrap: true,
        });

        claims.forEach((claim) => {
            tbl.push([
                formatter.truncate(claim.id, 8),
                claim.claim_text,
                claim.source_url ? formatter.domain(claim.source_url) : 'N/A',
                formatter.date(claim.created_at),
            ]);
        });

        return tbl.toString();
    },

    /**
     * Render top citations table
     */
    topCitations: (citations: TopCitation[]): string => {
        const tbl = new Table({
            head: [chalk.cyan('Domain'), chalk.cyan('Citations'), chalk.cyan('URLs')],
            colWidths: [30, 12, 58],
            wordWrap: true,
        });

        citations.forEach((citation) => {
            tbl.push([
                citation.domain,
                formatter.number(citation.citation_count),
                formatter.truncate(citation.urls.join(', '), 55),
            ]);
        });

        return tbl.toString();
    },

    /**
     * Render generic key-value table
     */
    keyValue: (data: Record<string, string | number | boolean>): string => {
        const tbl = new Table({
            colWidths: [30, 70],
        });

        Object.entries(data).forEach(([key, value]) => {
            tbl.push([chalk.cyan(key), String(value)]);
        });

        return tbl.toString();
    },
};
