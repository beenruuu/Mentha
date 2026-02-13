import winston from 'winston';

import { env } from '../config/env';

const { combine, timestamp, json, printf, colorize } = winston.format;

const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level}: ${message} ${metaStr}`;
    }),
);

const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
    defaultMeta: { service: 'mentha-api' },
    transports: [new winston.transports.Console()],
});

export function createLogger(context: Record<string, unknown>) {
    return logger.child(context);
}
