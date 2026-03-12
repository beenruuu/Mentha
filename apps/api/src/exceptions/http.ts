import type { Context } from 'hono';

export class HttpException extends Error {
    public readonly statusCode: number;
    public readonly details?: unknown;

    constructor(statusCode: number, message: string, details?: unknown) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        const result: { error: string; statusCode: number; details?: unknown } = {
            error: this.message,
            statusCode: this.statusCode,
        };
        if (this.details) {
            result.details = this.details;
        }
        return result;
    }
}

export class BadRequestException extends HttpException {
    constructor(message: string = 'Bad Request', details?: unknown) {
        super(400, message, details);
    }
}

export class UnauthorizedException extends HttpException {
    constructor(message: string = 'Unauthorized', details?: unknown) {
        super(401, message, details);
    }
}

export class ForbiddenException extends HttpException {
    constructor(message: string = 'Forbidden', details?: unknown) {
        super(403, message, details);
    }
}

export class NotFoundException extends HttpException {
    constructor(message: string = 'Not Found', details?: unknown) {
        super(404, message, details);
    }
}

export class ConflictException extends HttpException {
    constructor(message: string = 'Conflict', details?: unknown) {
        super(409, message, details);
    }
}

export class UnprocessableEntityException extends HttpException {
    constructor(message: string = 'Unprocessable Entity', details?: unknown) {
        super(422, message, details);
    }
}

export class TooManyRequestsException extends HttpException {
    constructor(message: string = 'Too Many Requests', details?: unknown) {
        super(429, message, details);
    }
}

export class InternalServerException extends HttpException {
    constructor(message: string = 'Internal Server Error', details?: unknown) {
        super(500, message, details);
    }
}

export class ServiceUnavailableException extends HttpException {
    constructor(message: string = 'Service Unavailable', details?: unknown) {
        super(503, message, details);
    }
}

export function handleHttpException(c: Context, error: unknown) {
    if (error instanceof HttpException) {
        return c.json(error.toJSON(), error.statusCode as 200);
    }

    return c.json(
        {
            error: error instanceof Error ? error.message : 'Internal Server Error',
            statusCode: 500,
        },
        500,
    );
}
