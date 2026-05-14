import { env } from '../../config/env';
import { runCamoufoxUiCapture } from './camoufox-provider';
import type { UiCaptureRequest, UiCaptureResult } from './types';

export async function runUiCapture(request: UiCaptureRequest): Promise<UiCaptureResult> {
    if (env.MENTHA_UI_CAPTURE_PROVIDER === 'playwright') {
        const { runPlaywrightUiCapture } = await import('./playwright-provider');
        return runPlaywrightUiCapture(request);
    }

    return runCamoufoxUiCapture(request);
}
