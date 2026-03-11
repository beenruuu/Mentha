import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: {
        service: 'mentha-api',
        env: env.NODE_ENV,
    },
    transport: env.NODE_ENV !== 'production' 
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname,service,env',
            },
        } 
        : undefined,
});

export function createLogger(context: Record<string, unknown>) {
    return logger.child(context);
}

export type Logger = typeof logger;
