import { createMenthaClient } from '@mentha/core';
import type { AppType } from 'mentha-api';

import config from './config';

export const client: ReturnType<typeof createMenthaClient<AppType>> = createMenthaClient<AppType>({
    baseUrl: config.apiBaseUrl,
});
