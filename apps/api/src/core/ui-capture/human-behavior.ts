import type { Page } from 'playwright';

const graphemeSegmenter =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;

export function randomBetween(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function bezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export async function moveMouseToElement(
    page: Page,
    target: {
        boundingBox: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
    },
): Promise<void> {
    const box = await target.boundingBox().catch(() => null);
    if (!box) return;

    const viewport = page.viewportSize() ?? { width: 1920, height: 1080 };
    const startX = randomBetween(viewport.width * 0.1, viewport.width * 0.9);
    const startY = randomBetween(viewport.height * 0.1, viewport.height * 0.9);
    const endX = box.x + box.width * (0.3 + Math.random() * 0.4);
    const endY = box.y + box.height * (0.3 + Math.random() * 0.4);

    const cp1x = startX + (endX - startX) * (0.2 + Math.random() * 0.3);
    const cp1y = startY + (Math.random() - 0.5) * 100;
    const cp2x = endX - (endX - startX) * (0.2 + Math.random() * 0.3);
    const cp2y = endY + (Math.random() - 0.5) * 100;

    const steps = randomBetween(6, 12);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = bezierPoint(t, startX, cp1x, cp2x, endX);
        const y = bezierPoint(t, startY, cp1y, cp2y, endY);
        await page.mouse.move(x, y);
        await page.waitForTimeout(randomBetween(3, 12));
    }
}

export async function preInteractionIdle(page: Page): Promise<void> {
    await page.waitForTimeout(randomBetween(300, 700));
}

export async function smallScroll(page: Page): Promise<void> {
    const amount = randomBetween(50, 200);
    await page.mouse.wheel(0, amount);
    await page.waitForTimeout(randomBetween(200, 600));
}

async function typeTextWithCadence(page: Page, text: string): Promise<void> {
    const units = graphemeSegmenter
        ? Array.from(graphemeSegmenter.segment(text), (segment) => segment.segment)
        : Array.from(text);

    for (const unit of units) {
        await page.keyboard.type(unit);
        await page.waitForTimeout(randomBetween(12, 28));
    }
}

export async function pastePrompt(page: Page, text: string): Promise<void> {
    const segments = graphemeSegmenter
        ? Array.from(graphemeSegmenter.segment(text), (segment) => segment.segment)
        : Array.from(text);
    let cursor = 0;
    let charsSinceLongPause = 0;

    while (cursor < segments.length) {
        const nextChunkSize = randomBetween(3, 8);
        const chunk = segments.slice(cursor, cursor + nextChunkSize).join('');
        cursor += nextChunkSize;

        if (chunk === '\n') {
            await page.keyboard.press('Shift+Enter');
            charsSinceLongPause = 0;
            await page.waitForTimeout(randomBetween(60, 140));
            continue;
        }

        if (chunk.includes('\n')) {
            const parts = chunk.split('\n');
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (part) {
                    charsSinceLongPause += graphemeSegmenter
                        ? Array.from(graphemeSegmenter.segment(part)).length
                        : part.length;
                    await typeTextWithCadence(page, part);
                }
                if (i < parts.length - 1) {
                    await page.keyboard.press('Shift+Enter');
                    charsSinceLongPause = 0;
                    await page.waitForTimeout(randomBetween(70, 160));
                }
            }
        } else {
            charsSinceLongPause += graphemeSegmenter
                ? Array.from(graphemeSegmenter.segment(chunk)).length
                : chunk.length;
            await typeTextWithCadence(page, chunk);
        }

        await page.waitForTimeout(randomBetween(35, 110));

        if (charsSinceLongPause >= randomBetween(22, 40)) {
            charsSinceLongPause = 0;
            await page.waitForTimeout(randomBetween(120, 260));
        }
    }
}
