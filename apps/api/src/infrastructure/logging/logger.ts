import winston from 'winston';
import { env } from '../../config/index';

const { combine, timestamp, json, printf, colorize } = winston.format;

/**
 * Development format: colorized, human-readable
 */
const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level}: ${message} ${metaStr}`;
    })
);

/**
 * Production format: structured JSON for log aggregation
 */
const prodFormat = combine(
    timestamp(),
    json()
);

/**
 * Centralized logger instance
 * - Development: Console with colors
 * - Production: JSON format for log aggregation (e.g., Railway logs)
 */
export const logger = winston.createLogger({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
    defaultMeta: { service: 'mentha-api' },
    transports: [
        new winston.transports.Console(),
    ],
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
    return logger.child(context);
}
