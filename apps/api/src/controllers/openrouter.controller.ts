import type { Context } from 'hono';

import { env } from '../config/env';
import { logger } from '../core/logger';
import { handleHttpException, BadRequestException } from '../exceptions/http';
import { CreditService } from '../core/credits';

export const OpenRouterController = {
    chatCompletions: async (c: Context): Promise<Response> => {
        try {
            if (!env.OPENROUTER_API_KEY) {
                throw new Error('OPENROUTER_API_KEY is not configured');
            }

            const user = c.get('user');
            if (!user) {
                throw new Error('User not authenticated');
            }

            const body = await c.req.json();
            const model = body.model || 'google/gemini-2.5-flash';

            // Check and deduct credits
            const cost = CreditService.getModelCost(model);
            const hasCredits = await CreditService.deductCredits(
                user.id,
                cost,
                `AI Chat Completion: ${model}`,
                { model }
            );

            if (!hasCredits) {
                return c.json({ 
                    error: 'Insufficient credits', 
                    message: 'You have exhausted your daily quota or credit balance.' 
                }, 402) as any;
            }

            // Setup default model and other OpenRouter specific params
            const payload = {
                model: model,
                messages: body.messages || [],
                ...body,
            };

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://mentha.saas',
                    'X-Title': 'Mentha Platform',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.text();
                logger.error('OpenRouter API error', {
                    status: response.status,
                    data: errorData,
                });
                return c.json(
                    { error: 'Failed to communicate with OpenRouter', details: errorData },
                    // @ts-ignore
                    response.status,
                );
            }

            // Stream response if requested
            if (body.stream) {
                c.header('Content-Type', 'text/event-stream');
                c.header('Cache-Control', 'no-cache');
                c.header('Connection', 'keep-alive');

                return new Response(response.body, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                    },
                });
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            logger.error('OpenRouter controller error', {
                error: (error as Error).message,
            });
            return handleHttpException(c, error);
        }
    },
};