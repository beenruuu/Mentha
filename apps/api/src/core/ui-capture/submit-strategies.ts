import type { Locator, Page } from 'playwright';

import { logger } from '../../core/logger';
import { randomBetween } from './human-behavior';

const SUBMIT_METHOD_TIMEOUT_MS = 10_000;

export type SubmitContext = {
    page: Page;
    input: Locator;
    sendButton: Locator | null;
    preSubmitContent: string;
    preSubmitUrl: string;
    checkSubmitSuccess?: (
        page: Page,
        context: { preSubmitUrl: string },
    ) => Promise<boolean | undefined>;
};

function hasWords(content: string): boolean {
    return content.trim().split(/\s+/).filter(Boolean).length > 0;
}

function normalizePromptValue(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

async function readInputContent(input: Locator): Promise<string> {
    return input.inputValue().catch(() => input.innerText().catch(() => ''));
}

async function ensureInputHasWords(ctx: SubmitContext, attemptLabel: string): Promise<void> {
    const liveContent = await readInputContent(ctx.input).catch(() => ctx.preSubmitContent);
    const normalizedLive = normalizePromptValue(liveContent);
    const normalizedPre = normalizePromptValue(ctx.preSubmitContent);

    if (hasWords(liveContent)) return;
    if (normalizedLive.length === 0 && normalizedPre.length > 0 && hasWords(ctx.preSubmitContent))
        return;

    throw new Error(`Input has no content before submit (${attemptLabel})`);
}

async function checkSubmissionSuccess(ctx: SubmitContext): Promise<boolean> {
    const { page, input, preSubmitContent, preSubmitUrl } = ctx;
    await page.waitForTimeout(500);

    const providerSuccess = await ctx.checkSubmitSuccess?.(page, { preSubmitUrl });
    if (providerSuccess !== undefined) return providerSuccess;

    const currentContent = await readInputContent(input).catch(() => preSubmitContent);
    if (
        normalizePromptValue(currentContent).length === 0 &&
        normalizePromptValue(preSubmitContent).length > 0
    ) {
        return true;
    }

    const currentUrl = page.url();
    if (currentUrl !== preSubmitUrl) {
        return true;
    }

    const inputVisible = await input.isVisible().catch(() => true);
    if (!inputVisible) {
        await page.waitForTimeout(200);
        const stillGone = !(await input.isVisible().catch(() => true));
        if (stillGone) return true;
    }

    return false;
}

async function withTimeout<T>(label: string, fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
            setTimeout(
                () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
                timeoutMs,
            ),
        ),
    ]);
}

export async function tryEnterSubmit(ctx: SubmitContext): Promise<boolean> {
    const { page, input } = ctx;
    try {
        await ensureInputHasWords(ctx, 'enter');
        return await withTimeout(
            'enter-submit',
            async () => {
                await page.waitForTimeout(randomBetween(120, 260));
                await input.press('Enter', { delay: randomBetween(40, 120) }).catch(() => null);
                return checkSubmissionSuccess(ctx);
            },
            SUBMIT_METHOD_TIMEOUT_MS,
        );
    } catch (err) {
        logger.debug({ error: (err as Error).message }, 'Enter submit failed');
        return false;
    }
}

export async function tryNativeClick(ctx: SubmitContext): Promise<boolean> {
    const { page, sendButton } = ctx;
    if (!sendButton) return false;
    try {
        await ensureInputHasWords(ctx, 'native-click');
        return await withTimeout(
            'native-click',
            async () => {
                await page.waitForTimeout(randomBetween(80, 180));
                await sendButton.scrollIntoViewIfNeeded().catch(() => null);
                await page.waitForTimeout(randomBetween(50, 150));
                await sendButton
                    .click({ timeout: SUBMIT_METHOD_TIMEOUT_MS, delay: randomBetween(35, 120) })
                    .catch(() => null);
                return checkSubmissionSuccess(ctx);
            },
            SUBMIT_METHOD_TIMEOUT_MS,
        );
    } catch (err) {
        logger.debug({ error: (err as Error).message }, 'Native click failed');
        return false;
    }
}

export async function tryForceClick(ctx: SubmitContext): Promise<boolean> {
    const { page, sendButton } = ctx;
    if (!sendButton) return false;
    try {
        await ensureInputHasWords(ctx, 'force-click');
        return await withTimeout(
            'force-click',
            async () => {
                await page.waitForTimeout(randomBetween(80, 180));
                await sendButton.scrollIntoViewIfNeeded().catch(() => null);
                await page.waitForTimeout(randomBetween(50, 150));
                await sendButton.click({
                    force: true,
                    timeout: SUBMIT_METHOD_TIMEOUT_MS,
                    delay: randomBetween(35, 120),
                });
                return checkSubmissionSuccess(ctx);
            },
            SUBMIT_METHOD_TIMEOUT_MS,
        );
    } catch (err) {
        logger.debug({ error: (err as Error).message }, 'Force click failed');
        return false;
    }
}

export async function tryDispatchClick(ctx: SubmitContext): Promise<boolean> {
    const { sendButton } = ctx;
    if (!sendButton) return false;
    try {
        await ensureInputHasWords(ctx, 'dispatch-click');
        return await withTimeout(
            'dispatch-click',
            async () => {
                await sendButton.dispatchEvent('click');
                return checkSubmissionSuccess(ctx);
            },
            SUBMIT_METHOD_TIMEOUT_MS,
        );
    } catch (err) {
        logger.debug({ error: (err as Error).message }, 'Dispatch click failed');
        return false;
    }
}

export async function trySubmitStrategies(
    page: Page,
    input: Locator,
    sendButton: Locator | null,
    submitOrder: Array<'native' | 'enter' | 'force' | 'dispatch'>,
    preSubmitUrl: string,
    checkSubmitSuccess?: SubmitContext['checkSubmitSuccess'],
): Promise<void> {
    const initialValue = await readInputContent(input).catch(() => '');
    const preSubmitContent = initialValue || '';

    const ctx: SubmitContext = {
        page,
        input,
        sendButton,
        preSubmitContent,
        preSubmitUrl,
        checkSubmitSuccess,
    };

    const strategyMap: Record<string, (ctx: SubmitContext) => Promise<boolean>> = {
        native: tryNativeClick,
        enter: tryEnterSubmit,
        force: tryForceClick,
        dispatch: tryDispatchClick,
    };

    const effectiveOrder = sendButton
        ? submitOrder
        : submitOrder.includes('enter')
          ? ['enter']
          : [];

    for (const strategy of effectiveOrder) {
        const fn = strategyMap[strategy];
        if (!fn) continue;
        const success = await fn(ctx);
        if (success) {
            logger.debug({ strategy }, 'Submitted successfully');
            return;
        }
    }

    throw new Error('All submission methods failed');
}
